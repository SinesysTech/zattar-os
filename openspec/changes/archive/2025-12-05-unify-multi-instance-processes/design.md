# Design: Unificação de Processos Multi-Instância

## Context

O sistema PJE-TRT mantém registros separados do mesmo processo quando ele transita entre graus (primeiro grau → segundo grau → TST). Cada registro contém a timeline acumulativa de todos os graus anteriores mais os novos eventos do grau atual.

Nosso banco de dados replica essa estrutura (mantendo consistência com a fonte), mas a visualização para o usuário deve ser unificada, tratando processos com o mesmo número como uma única entidade jurídica.

**Stakeholders**:
- Advogados e equipe jurídica (usuários finais que visualizam processos)
- Sistema de captura PJE (não deve ser alterado)
- Banco de dados Supabase/PostgreSQL (estrutura mantida)

**Constraints**:
- Não modificar estrutura do banco de dados ou lógica de captura
- Manter compatibilidade com API existente (ou versionar)
- Performance aceitável mesmo com agrupamentos SQL
- Timeline deve ser deduplicada de forma inteligente

## Goals / Non-Goals

**Goals**:
- Unificar visualização de processos com mesmo `numero_processo`
- Exibir contagem precisa de processos únicos (não instâncias)
- Agregar timeline eliminando duplicatas de eventos
- Indicar claramente em quais graus o processo está ativo
- Manter integridade e rastreabilidade dos dados originais

**Non-Goals**:
- Alterar banco de dados (merge físico de registros)
- Modificar lógica de captura do PJE
- Unificar processos de tribunais diferentes (apenas mesmo TRT)
- Implementar versionamento completo de API neste momento

## Decisions

### Decision 1: Agrupamento SQL no Backend
**O que**: Implementar agrupamento usando `GROUP BY numero_processo` com agregação de metadados.

**Por que**:
- Centraliza lógica de unificação em um único ponto (backend)
- Permite reutilização em diferentes frontends (web, mobile futuro)
- SQL nativo é eficiente para agrupamentos com índices adequados
- Reduz tráfego de rede (envia dados já agregados)

**Alternativas consideradas**:
- **Agrupamento no frontend**: Descartado - lógica duplicada, menos eficiente, dados duplicados na rede
- **View materializada no PostgreSQL**: Descartado por enquanto - adiciona complexidade de manutenção, overhead de refresh

**Implementação**:
```sql
SELECT
  numero_processo,
  MAX(id) as id_principal,
  ARRAY_AGG(id) as instancias_ids,
  ARRAY_AGG(grau) as graus,
  ARRAY_AGG(origem) as origens,
  MAX(updated_at) as ultima_atualizacao,
  -- outros campos agregados conforme necessário
FROM acervo_geral
GROUP BY numero_processo
```

### Decision 2: Estrutura de Resposta com Metadados de Instâncias
**O que**: Retornar objeto unificado com campo `instances` contendo array de graus/origens.

**Por que**:
- Mantém transparência sobre quais instâncias existem
- Permite frontend exibir indicadores visuais (badges de grau)
- Facilita drill-down para visualização de instância específica se necessário

**Formato**:
```typescript
{
  id: string; // ID da instância principal (mais recente)
  numero_processo: string;
  instances: [
    { id: string; grau: 'primeiro_grau' | 'segundo_grau' | 'tst'; origem: string },
    // ...
  ];
  // ... outros campos do processo
}
```

### Decision 3: Deduplicação de Timeline por Hash de Evento
**O que**: Usar hash (MD5/SHA) de `(data + tipo + descricao)` para identificar eventos duplicados.

**Por que**:
- Timeline do segundo grau contém eventos do primeiro
- Timeline do TST contém eventos do primeiro + segundo
- Eventos duplicados têm mesma data, tipo e descrição
- Hash permite comparação eficiente

**Implementação**:
```typescript
const eventHash = (event) =>
  md5(`${event.data}|${event.tipo}|${event.descricao.trim()}`);

const uniqueEvents = events.filter((event, index, arr) =>
  arr.findIndex(e => eventHash(e) === eventHash(event)) === index
);
```

**Alternativa considerada**:
- Comparação direta de objetos: Descartado - menos eficiente, sensível a diferenças de whitespace

### Decision 4: Processo Principal como Instância Mais Recente
**O que**: Usar a instância com maior `updated_at` como processo principal.

**Por que**:
- Grau mais recente geralmente tem dados mais completos
- Timeline mais atualizada
- Simplifica lógica (um critério claro de priorização)

**Alternativas**:
- Priorizar TST > segundo grau > primeiro grau: Descartado - nem sempre TST é o mais recente
- Permitir usuário escolher: Descartado - complexidade desnecessária para MVP

### Decision 5: Índice Composto para Performance
**O que**: Criar índice `(numero_processo, updated_at DESC)`.

**Por que**:
- Otimiza queries de agrupamento
- Facilita identificação do processo principal
- Impacto mínimo em inserts (índice em campos pouco atualizados)

**SQL**:
```sql
CREATE INDEX IF NOT EXISTS idx_acervo_numero_updated
ON acervo_geral(numero_processo, updated_at DESC);
```

### Decision 6: Parâmetro de Query para Desabilitar Unificação
**O que**: Adicionar parâmetro `?unified=true` (default: true) para controlar agrupamento.

**Por que**:
- Compatibilidade retroativa com código que espera registros separados
- Debugging (visualizar instâncias individuais)
- Flexibilidade para casos de uso específicos

**Comportamento**:
- `?unified=true` (ou omitido): Retorna processos unificados
- `?unified=false`: Retorna todas as instâncias separadamente (comportamento legado)

## Risks / Trade-offs

### Risk 1: Performance de Queries de Agrupamento
**Risco**: GROUP BY pode ser lento com muitos registros.

**Mitigação**:
- Índice composto `(numero_processo, updated_at DESC)`
- Paginação server-side (limita registros processados)
- Monitorar query performance com `EXPLAIN ANALYZE`
- Considerar view materializada se performance inadequada

**Trade-off**: Complexidade de query aumenta, mas centraliza lógica e reduz tráfego de rede.

### Risk 2: Breaking Change na API
**Risco**: Estrutura de resposta alterada pode quebrar código existente.

**Mitigação**:
- Parâmetro `unified=false` para comportamento legado
- Revisar todos os consumidores da API antes de deploy
- Documentação clara da mudança
- Considerar versionamento de API futuro (`/api/v2/acervo`)

**Trade-off**: Mantém compatibilidade mas adiciona complexidade condicional.

### Risk 3: Deduplicação de Timeline Pode Falhar em Edge Cases
**Risco**: Eventos similares mas distintos podem ser considerados duplicados.

**Mitigação**:
- Hash robusto incluindo múltiplos campos
- Testes com dados reais de diferentes tribunais
- Permitir visualização de timeline por instância se necessário

**Trade-off**: Hash pode ter colisões raras, mas algoritmo simples é mais manutenível.

### Risk 4: Confusão sobre "Processo Principal"
**Risco**: Usuários podem não entender qual instância é exibida como principal.

**Mitigação**:
- UI clara mostrando todos os graus ativos (badges)
- Tooltip/hover explicando lógica de priorização
- Permitir drill-down para ver instância específica

**Trade-off**: Adiciona elementos de UI, mas melhora transparência.

## Migration Plan

### Fase 1: Backend (API)
1. Criar índice `idx_acervo_numero_updated`
2. Implementar lógica de agrupamento em `app/api/acervo/route.ts`
3. Adicionar parâmetro `unified` com default `false` (não-breaking)
4. Testar com dados reais de desenvolvimento
5. Atualizar documentação Swagger

### Fase 2: Frontend
1. Atualizar tipos TypeScript para estrutura unificada
2. Modificar componente DataTable para exibir processos unificados
3. Adicionar badges/indicadores de grau
4. Implementar deduplicação de timeline na visualização detalhada
5. Ajustar contadores e paginação

### Fase 3: Rollout
1. Deploy backend com `unified=false` default (sem impacto)
2. Validar que API funciona em ambos os modos
3. Deploy frontend consumindo API unificada
4. Alterar default para `unified=true` após validação
5. Monitorar métricas de performance e erros

### Rollback
Se necessário reverter:
1. Alterar default `unified` de volta para `false`
2. Frontend automaticamente volta a exibir instâncias separadas
3. Remover índice se causar problemas de performance em writes

### Data Migration
**Não requer migração de dados** - mudança é apenas na camada de apresentação.

### Decision 7: Responsável Unificado por Processo
**O que**: Responsável é atribuído ao processo unificado (por `numero_processo`), não por instância individual.

**Por que**:
- Do ponto de vista jurídico, o processo é uma entidade única mesmo transitando entre graus
- Simplifica gestão (um responsável por processo, não múltiplos)
- Evita confusão sobre quem é responsável por qual instância

**Implementação**:
- Manter campo `responsavel_id` em cada registro do banco (compatibilidade)
- Ao atribuir responsável, atualizar **todas as instâncias** do mesmo `numero_processo`
- API de atribuição (`PUT /api/acervo/[id]/responsavel`) deve propagar para todas as instâncias
- UI mostra um único responsável por processo unificado

**SQL de atribuição**:
```sql
UPDATE acervo_geral
SET responsavel_id = $1, updated_at = NOW()
WHERE numero_processo = (
  SELECT numero_processo FROM acervo_geral WHERE id = $2
);
```

### Decision 8: Grau Atual Baseado em Data de Autuação
**O que**: Determinar grau atual do processo pela instância com **maior data de autuação**.

**Por que**:
- Data de autuação do primeiro grau = data de distribuição original
- Quando processo vai para segundo grau, nova data de autuação é registrada
- Data de autuação mais recente indica onde o processo está atualmente
- Última movimentação (`updated_at`) também serve como indicador secundário

**Implementação**:
```sql
-- Identificar instância atual (grau atual)
SELECT id, grau, data_autuacao, updated_at
FROM acervo_geral
WHERE numero_processo = $1
ORDER BY data_autuacao DESC, updated_at DESC
LIMIT 1;
```

**Uso**:
- Filtro por grau: aplica ao grau atual (instância com maior data de autuação)
- Classificação por grau: usa grau da instância atual
- Badge "Grau Atual" destacado na UI

### Decision 9: Agregação de Audiências e Pendências
**O que**: Audiências e pendências (expedientes) são agregadas de **todas as instâncias** do processo.

**Por que**:
- Audiências e expedientes pertencem ao processo jurídico, não à instância específica
- Advogado precisa visualizar todas as pendências independente de grau
- Ordenação por data permite priorização correta

**Implementação**:
```sql
-- Buscar audiências de todas as instâncias
SELECT a.*
FROM audiencias a
JOIN acervo_geral ag ON a.processo_id = ag.id
WHERE ag.numero_processo = $1
ORDER BY a.data_audiencia ASC;

-- Buscar expedientes de todas as instâncias
SELECT e.*
FROM expedientes e
JOIN acervo_geral ag ON e.processo_id = ag.id
WHERE ag.numero_processo = $1
ORDER BY e.data_criacao DESC;
```

**UI**:
- Exibir todas as audiências/expedientes em lista única
- Incluir badge de grau ao lado de cada item (indicar origem)
- Ordenar por data (prioridade: audiências mais próximas primeiro)

## Resolved Decisions Summary

Todas as questões abertas foram resolvidas:

✅ **Responsável**: Unificado por processo (Decision 7)
✅ **Grau atual**: Baseado em maior data de autuação (Decision 8)
✅ **Audiências/Pendências**: Agregadas de todas as instâncias (Decision 9)
✅ **Filtros**: Aplicados à instância atual para grau, OR lógico para outros (Decisions 1, 8)
✅ **Cache**: Chave inclui parâmetro `unified` (Decision 6)
