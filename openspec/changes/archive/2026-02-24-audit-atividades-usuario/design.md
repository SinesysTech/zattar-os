## Context

A tabela `logs_alteracao` já existe na production schema e registra eventos de negócio:

```sql
CREATE TABLE "public"."logs_alteracao" (
    id BIGINT PRIMARY KEY,
    tipo_entidade TEXT NOT NULL,          -- acervo, audiencias, expedientes, contratos, etc.
    entidade_id BIGINT NOT NULL,
    tipo_evento TEXT NOT NULL,            -- atribuicao_responsavel, transferencia_responsavel, desatribuicao_responsavel, mudanca_status, observacao_adicionada
    usuario_que_executou_id BIGINT NOT NULL,
    responsavel_anterior_id BIGINT,
    responsavel_novo_id BIGINT,
    dados_evento JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Triggers já ativos disparam inserts nessa tabela quando `responsavel_id` muda em `acervo`, `audiencias`, `expedientes`, `contratos`, `clientes`, `partes_contrarias`, `terceiros`, `representantes`. O padrão `set_config('app.current_user_id')` é usado para rastrear quem executou a ação.

O componente `AtividadesRecentes` no frontend é um placeholder. O `AuthLogsTimeline` (para logs de autenticação) já implementa o padrão visual de timeline com ícones, cores por tipo, `formatDistanceToNow` do `date-fns`, e empty state.

## Goals / Non-Goals

**Goals:**
- Exibir timeline de atividades de negócio do usuário na página de detalhes
- Consultar `logs_alteracao` por `usuario_que_executou_id` com limite configurável
- Humanizar os eventos (ex: "Atribuiu processo #12345 a João" em vez de "atribuicao_responsavel")
- Seguir o padrão visual do `AuthLogsTimeline` para consistência

**Non-Goals:**
- Criar novos triggers ou modificar a tabela `logs_alteracao` (infraestrutura já existente)
- Implementar filtros avançados ou busca na timeline (pode ser adicionado depois)
- Sistema de notificações em tempo real baseado nos logs
- Paginação infinita (v1 mostra as últimas N atividades com opção de "ver mais")

## Decisions

### 1. Reutilizar `logs_alteracao` ao invés de criar nova tabela

**Decisão**: Consultar diretamente a tabela `logs_alteracao` existente.

**Alternativa considerada**: Criar tabela dedicada `atividades_usuario` com schema otimizado para o frontend.

**Rationale**: A tabela já contém exatamente os dados necessários, com triggers ativos e indexação. Criar tabela separada significaria duplicação de dados e manutenção de dois pipelines de auditoria. A query é simples (filtro por `usuario_que_executou_id` + ORDER BY `created_at` DESC + LIMIT).

### 2. Mapeamento de eventos no frontend (não no banco)

**Decisão**: O mapeamento `tipo_evento` → label/ícone/cor acontece no componente React, não via view SQL.

**Alternativa considerada**: Criar view `logs_alteracao_humanizados` no banco com labels pré-computados.

**Rationale**: Os labels são puramente de apresentação e podem mudar sem migração. O `AuthLogsTimeline` já usa esse padrão (maps `EVENT_ICONS`, `EVENT_LABELS`, `EVENT_COLORS`). Manter consistência.

### 3. Join com `usuarios` para nomes de responsáveis

**Decisão**: Fazer join com `usuarios` na query do repository para retornar `nomeExibicao` do responsável anterior e novo, quando aplicável.

**Alternativa considerada**: Retornar apenas IDs e resolver no frontend com cache.

**Rationale**: O volume de dados é pequeno (últimos 20 logs) e o join é simples. Evita waterfall de requests e complexidade de cache no frontend.

### 4. Componente segue padrão `AuthLogsTimeline`

**Decisão**: Estrutura visual idêntica — Card com header, lista de eventos com timeline vertical, ícones por tipo, timestamps relativos, empty state com componente `Empty`.

**Rationale**: Consistência visual. O `AuthLogsTimeline` já foi validado na tab "Segurança" da mesma página. O usuário espera o mesmo padrão visual.

### 5. Sem nova permissão dedicada

**Decisão**: Usar a permissão existente `usuarios:visualizar` para acessar atividades do usuário.

**Alternativa considerada**: Criar `usuarios:ver-atividades` separada.

**Rationale**: Se o usuário pode ver o perfil, pode ver as atividades. Granularidade excessiva adiciona complexidade sem benefício real. Simplifica a implementação.

## Risks / Trade-offs

- **[Dados limitados ao `logs_alteracao`]** → A tabela registra principalmente atribuições/transferências de responsável e mudanças de status. Ações como "editou dados do processo" ou "criou audiência" podem não estar logadas. Mitigation: Exibir o que está disponível; novos triggers podem ser adicionados incrementalmente.

- **[Performance com volume alto de logs]** → Se um usuário tem milhares de registros, query sem limite seria lenta. Mitigation: LIMIT 20 por padrão, com botão "Carregar mais" que incrementa o offset.

- **[Nomes de usuários deletados]** → Se `responsavel_anterior_id` ou `responsavel_novo_id` referencia um usuário excluído, o join retorna NULL. Mitigation: LEFT JOIN + fallback "Usuário removido" no componente.

## Architecture

```
[logs_alteracao table]  ← triggers já ativos nas tabelas principais
        ↓
[repository-audit-atividades.ts]  ← query com join em usuarios
        ↓
[audit-atividades-actions.ts]  ← server action com check de permissão
        ↓
[AtividadesRecentes component]  ← timeline com ícones/labels/timestamps
```

### Estrutura de arquivos

```
src/features/usuarios/
├── repository-audit-atividades.ts    ← NEW: query logs_alteracao
├── actions/
│   └── audit-atividades-actions.ts   ← NEW: server action
├── components/activities/
│   └── atividades-recentes.tsx       ← MODIFY: substituir placeholder
```
