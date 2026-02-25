## Context

O módulo de Assinatura Digital atualmente cria contratos com valores hard-coded na rota `salvar-acao`: `tipo_contrato: 'ajuizamento'`, `tipo_cobranca: 'pro_exito'`, `papel_cliente_no_contrato: 'autora'`, `status: 'em_contratacao'`. Esses valores são definidos por enums PostgreSQL fixos (`tipo_contrato`, `tipo_cobranca`, `status_contrato`, `papel_contratual`), tornando impossível reutilizar o fluxo de assinatura digital para outros cenários contratuais.

O banco atual usa:
- `contratos.tipo_contrato` → enum com 7 valores fixos
- `contratos.tipo_cobranca` → enum com 2 valores fixos
- `contratos.status` → enum com 4 valores fixos (`em_contratacao`, `contratado`, `distribuido`, `desistencia`)
- `contratos.papel_cliente_no_contrato` → enum com 2 valores (`autora`, `re`)
- `assinatura_digital_formularios` → sem campo `tipo_formulario` nem configuração de contrato

Frontend usa Zustand store, React Hook Form, shadcn/ui, Next.js App Router. Backend usa Supabase service client + Next.js API routes.

## Goals / Non-Goals

**Goals:**
- Substituir enums fixos de `tipo_contrato` e `tipo_cobranca` por tabelas configuráveis pelo admin (CRUD)
- Substituir `status` fixo por pipelines configuráveis por segmento, com estágios personalizáveis (nome, ordem, cor)
- Permitir que o admin defina `tipo_formulario` (contrato, documento, cadastro) ao criar formulários
- Auto-scaffold de seções de formulário quando `tipo_formulario = 'contrato'`
- Rota `salvar-acao` ler configuração do formulário em vez de valores hard-coded
- Nova página Kanban de contratos com drag-and-drop entre estágios do pipeline
- UI de admin para CRUD de pipelines, tipos de contrato e tipos de cobrança

**Non-Goals:**
- Migração retroativa de contratos existentes para novos pipelines (será migration simples com pipeline default)
- Automações/triggers ao mover contrato entre estágios (futuro)
- Múltiplos pipelines por segmento (1:1 por enquanto)
- Remoção dos enums PostgreSQL existentes (serão mantidos temporariamente por backward compatibility, mas não usados por código novo)
- Permissões granulares por pipeline/estágio

## Decisions

### D1: Tabelas configuráveis em vez de ALTER TYPE enum

**Decisão**: Criar tabelas `contrato_tipos` e `contrato_tipos_cobranca` com CRUD, em vez de alterar os enums PostgreSQL existentes.

**Alternativa considerada**: `ALTER TYPE ... ADD VALUE` para adicionar novos valores ao enum. Rejeitada porque: (1) não permite remover valores, (2) não permite renomear, (3) não suporta metadata (descrição, cor), (4) requer migrations para cada novo valor.

**Implementação**:
- `contrato_tipos(id, nome, slug, descricao, ativo, ordem, created_at, updated_at)`
- `contrato_tipos_cobranca(id, nome, slug, descricao, ativo, ordem, created_at, updated_at)`
- `contratos` ganha colunas `tipo_contrato_id` (FK) e `tipo_cobranca_id` (FK) como nullable inicialmente
- Colunas enum originais (`tipo_contrato`, `tipo_cobranca`) mantidas temporariamente para backward compat
- Migration seed: inserir registros nas novas tabelas para cada valor do enum existente

### D2: Pipeline por segmento com relação 1:1

**Decisão**: Cada segmento tem exatamente um pipeline. A tabela `contrato_pipelines` tem `segmento_id UNIQUE`.

**Alternativa considerada**: Múltiplos pipelines por segmento (ex: pipeline de "ajuizamento" e pipeline de "assessoria" dentro de "trabalhista"). Rejeitada por complexidade desnecessária no momento — pode ser relaxada futuramente removendo o UNIQUE.

**Implementação**:
- `contrato_pipelines(id, segmento_id UNIQUE, nome, descricao, ativo, created_at, updated_at)`
- `contrato_pipeline_estagios(id, pipeline_id, nome, slug, cor, ordem, is_default, created_at, updated_at)`
- `contratos` ganha coluna `estagio_id` (FK para `contrato_pipeline_estagios`), nullable inicialmente
- Coluna `status` mantida temporariamente
- Cada pipeline MUST ter exatamente um estágio com `is_default = true` (usado ao criar contratos)

### D3: Configuração de contrato no formulário via JSONB `contrato_config`

**Decisão**: Adicionar campo `tipo_formulario` (text, check in 'contrato','documento','cadastro') e `contrato_config` (JSONB) na tabela `assinatura_digital_formularios`.

**Alternativa considerada**: Colunas separadas (`tipo_contrato_id`, `tipo_cobranca_id`, `papel_cliente`, `pipeline_id`). Rejeitada porque: (1) só se aplicam quando `tipo_formulario = 'contrato'`, ficando null para outros tipos, (2) JSONB é mais flexível para futuras extensões sem ALTER TABLE.

**Estrutura do `contrato_config`**:
```json
{
  "tipo_contrato_id": 1,
  "tipo_cobranca_id": 2,
  "papel_cliente": "autora",
  "pipeline_id": 3
}
```

### D4: Auto-scaffold de schema via função server-side

**Decisão**: Quando admin seleciona `tipo_formulario = 'contrato'` na criação do formulário, o backend gera um `form_schema` base com 3 seções predefinidas (Dados do Cliente, Parte Contrária, Dados do Contrato) como ponto de partida editável.

**Alternativa considerada**: Scaffold no frontend (client-side). Rejeitada porque o schema builder já opera sobre dados retornados do backend, e manter a lógica de scaffold centralizada facilita manutenção.

**Implementação**: Função utilitária `generateContratoFormScaffold()` que retorna um `DynamicFormSchema` com seções e campos padrão. Chamada na criação do formulário quando `tipo_formulario = 'contrato'` e `form_schema` está vazio.

### D5: salvar-acao lê configuração do formulário

**Decisão**: A rota `salvar-acao` busca o formulário por ID, extrai `contrato_config`, e usa esses valores para criar o contrato. Se `contrato_config` não existir, usa valores default (backward compat).

**Implementação**:
1. Query `assinatura_digital_formularios` por `formulario_id` do payload
2. Parse `contrato_config` JSONB
3. Usar `tipo_contrato_id`, `tipo_cobranca_id`, `papel_cliente` do config
4. Lookup `pipeline_id` → buscar estágio default (`is_default = true`) → usar como `estagio_id`
5. Fallback para valores originais se config não presente (transição gradual)

### D6: Kanban com @hello-pangea/dnd

**Decisão**: Usar `@hello-pangea/dnd` (fork mantido do `react-beautiful-dnd`) para drag-and-drop no Kanban.

**Alternativa considerada**: `@dnd-kit/core` — mais moderno mas API mais verbosa para o caso de uso simples de colunas Kanban. `@hello-pangea/dnd` tem API declarativa perfeita para listas verticais/horizontais.

**Implementação**:
- Página em `/app/assinatura-digital/contratos/kanban`
- Acesso via botão com ícone `Eye` na `DataTableToolbar` de formulários (ao lado do botão Export, alinhado à direita)
- Colunas = estágios do pipeline selecionado
- Cards = contratos com info resumida (cliente, tipo, data)
- Drag-and-drop chama API `PATCH /api/contratos/[id]/estagio` para atualizar `estagio_id`
- Filtro por segmento (que determina o pipeline visível)

### D7: Papel do cliente permanece enum PostgreSQL

**Decisão**: Manter `papel_contratual` como enum (`autora`, `re`) em vez de criar tabela configurável.

**Justificativa**: Papéis contratuais são conceitos jurídicos fixos com significado semântico no sistema (determinam polo processual). Não faz sentido o admin criar papéis arbitrários. O valor é selecionado na configuração do formulário (`contrato_config.papel_cliente`).

## Risks / Trade-offs

**[Dual-column durante transição]** → As colunas enum originais (`tipo_contrato`, `tipo_cobranca`, `status`) coexistem com as novas FK/pipeline por um período. Mitigation: migration final remove colunas enum após validar que todo o código usa as novas referências. Documentar no tasks.md como última task.

**[JSONB não validado pelo banco]** → `contrato_config` é JSONB sem check constraint. Mitigation: validação via Zod no backend antes de persistir. Schema Zod define a estrutura esperada.

**[Pipeline sem estágio default]** → Se admin cria pipeline sem marcar estágio default, `salvar-acao` não sabe onde colocar novo contrato. Mitigation: constraint no backend — ao criar/atualizar pipeline, exigir exatamente um estágio `is_default = true`. UI impede remoção do flag do último estágio default.

**[Performance Kanban com muitos contratos]** → Se um estágio tem centenas de contratos, o board pode ficar pesado. Mitigation: paginação/lazy-load por coluna (carregar últimos 50 por estágio, com "carregar mais"). Aceitável para v1 sem paginação — volume inicial é baixo.

**[Backward compat do salvar-acao]** → Formulários existentes não terão `contrato_config`. Mitigation: fallback para valores default na rota. Formulários antigos continuam funcionando sem mudança.

## Migration Plan

1. **Criar tabelas novas** (`contrato_pipelines`, `contrato_pipeline_estagios`, `contrato_tipos`, `contrato_tipos_cobranca`) sem alterar tabelas existentes
2. **Seed data**: Inserir registros nas tabelas novas correspondendo aos valores atuais dos enums
3. **Adicionar colunas** em `contratos` (`estagio_id`, `tipo_contrato_id`, `tipo_cobranca_id`) como nullable
4. **Adicionar colunas** em `assinatura_digital_formularios` (`tipo_formulario`, `contrato_config`) como nullable com default
5. **Backfill**: Popular `tipo_contrato_id` e `tipo_cobranca_id` nos contratos existentes baseado nos valores enum
6. **Backfill**: Popular `estagio_id` nos contratos existentes mapeando `status` → estágio correspondente no pipeline default
7. **Deploy código** que lê das novas colunas com fallback para enum
8. **Futuro** (fora do escopo): Remover colunas enum e tornar FK NOT NULL

**Rollback**: Reverter migration 3-6 (drop columns). Código com fallback continua funcionando com enums originais.

## Open Questions

- **Q1**: Seed dos pipelines default — criar um pipeline por segmento existente automaticamente, ou exigir que o admin crie manualmente? **Recomendação**: Criar automaticamente com 4 estágios padrão (Em Contratação, Contratado, Distribuído, Desistência) para cada segmento ativo.
- **Q2**: O botão de acesso ao Kanban na toolbar deve filtrar automaticamente pelo segmento do formulário atual, ou abrir a página Kanban geral? **Recomendação**: Abrir página Kanban geral com filtro de segmento pré-selecionável.
