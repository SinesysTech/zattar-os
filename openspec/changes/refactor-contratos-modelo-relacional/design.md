## Context
O módulo de contratos atualmente depende de:
- FKs singulares em `contratos` (`cliente_id`, `parte_contraria_id`) para representar partes
- Campos JSONB (`parte_autora`, `parte_re`) e contadores para simular múltiplas partes
- Datas por estágio (`data_assinatura`, `data_distribuicao`, `data_desistencia`) sem histórico

No banco em produção há ~331 contratos. Consultas via Supabase MCP indicam:
- `parte_autora`/`parte_re` (JSONB) não estão preenchidos atualmente
- `parte_contraria_id` está preenchida na grande maioria
- `data_assinatura` está preenchida em praticamente todos os registros
- `contrato_processos` existe, porém está vazio (sem associações)

## Goals / Non-Goals
- Goals:
  - Garantir suporte relacional real para múltiplas partes por contrato e por papel_contratual (autora/re)
  - Ter histórico de evolução de status (incluindo reversões) com data/hora e autor
  - Unificar semântica de data de cadastro: usar `cadastrado_em` como data de negócio
  - Garantir que contratos legados estejam associados ao segmento trabalhista por padrão (backfill para `segmentos.slug='trabalhista'`).
  - Manter relacionamento N:N contrato↔processo e habilitar sincronização/associação automatizada
  - Suportar tags em contratos e processos com herança contrato→processo.
- Non-Goals:
  - Alterar o modelo de captura do PJE (acervo/processo_partes) além do necessário para associação
  - Implementar UI completa nesta mudança (será fase posterior)

## Decisions
### Decision: Introduzir `contrato_partes` como fonte de verdade para partes do contrato
- Cada contrato pode ter N partes, cada parte possui:
  - `papel_contratual`: autora | re
  - `tipo_entidade`: cliente | parte_contraria
  - `entidade_id`: id na tabela correspondente
  - Campos de snapshot opcionais (ex: `nome_snapshot`, `cpf_cnpj_snapshot`) para auditoria
- Manter `contratos.cliente_id` como "cliente principal" (para filtros e portal), mas permitir N autores/res via `contrato_partes`.
- Deprecar/remover JSONB (`parte_autora`, `parte_re`) e contadores.

Observação de nomenclatura:
- `papel_contratual` (autora/re) é **imutável** no ciclo de vida do contrato.
- `polo_processual` é **processual** (ativo/passivo) e pode mudar por grau (ex: recorrente/recorrido), portanto não deve ser usado para representar a qualificação do contrato.

### Decision: Introduzir `contrato_status_historico`
- O status atual continua em `contratos.status` (para filtros rápidos), porém TODA mudança de status gera um registro em histórico.
- Campos do histórico:
  - `contrato_id`
  - `from_status` (nullable para criação)
  - `to_status`
  - `changed_at` (timestamp)
  - `changed_by` (usuario)
  - `reason` (texto opcional)
  - `metadata` (jsonb opcional)

### Decision: Datas por estágio migram para eventos
- Em vez de colunas `data_assinatura`, `data_distribuicao`, `data_desistencia`, registrar eventos no histórico.
- A UI pode derivar "assinado em" como o primeiro evento `to_status=contratado` (ou um evento explícito "assinado")

### Decision: Renomear `data_contratacao` para `cadastrado_em`
- `created_at` permanece como auditoria técnica.
- `cadastrado_em` é a data de negócio (que pode refletir contratos migrados).

### Decision: Associação contrato↔processo via `contrato_processos`
- Manter tabela existente e criar serviços para vincular/desvincular.
- Sincronização automática não deve ser feita via trigger pesada em `contratos`/`acervo`.
- Preferir:
  - função SQL idempotente para sugerir/vincular
  - execução via job/cron/script (ex: edge function/worker) acionada após marcação "distribuído".

### Decision: Sistema unificado de tags + propagação contrato→processo
- Criar tabela `tags` como catálogo único (criada via UI e reutilizável entre contrato/processo).
- Criar tabelas de relação `contrato_tags` e `processo_tags`.
- Regra de herança:
  - Ao criar vínculo em `contrato_processos`, copiar tags do contrato para o processo.
  - Ao inserir nova tag em `contrato_tags`, copiar para todos os processos já vinculados.
- Implementação preferida: triggers/funções pequenas e idempotentes apenas sobre tabelas de relacionamento (evita trigger pesada em `acervo`).

## Alternatives considered
- Manter JSONB para partes: rejeitado por inconsistência, pouca consultabilidade e divergência com UI.
- Manter datas por coluna e apenas adicionar histórico: rejeitado por duplicidade e dificuldade de reversão.
- Triggers que buscam em acervo por CPF/CNPJ a cada update: rejeitado por custo/performance e risco de lock.

## Migration Plan
### Passo 1: Criar novas tabelas
- Criar `contrato_partes`
- Criar `contrato_status_historico`

### Passo 2: Backfill de dados
- Popular `contrato_partes`:
  - Inserir o cliente principal com `papel_contratual` baseado no papel do cliente no contrato (campo legado `polo_cliente` será renomeado/depreciado)
  - Inserir parte contrária principal com `papel_contratual` oposto, quando `parte_contraria_id` não for null
- Backfill de `segmento_id`:
  - Setar `contratos.segmento_id` para o segmento trabalhista (referência por `segmentos.slug='trabalhista'`) em registros legados.
- Popular `contrato_status_historico`:
  - Criar evento inicial (from_status null → to_status = status atual)
  - Opcionalmente criar eventos adicionais se existirem datas antigas (assinado/distribuído/desistência)
- Backfill de tags:
  - Se existirem vínculos em `contrato_processos`, garantir que processos vinculados herdem tags do contrato.

### Passo 3: Mudanças no schema da tabela `contratos`
- Renomear `data_contratacao` → `cadastrado_em`
- Dropar colunas legadas de partes e datas após backend migrado.

### Passo 4: Atualizar backend e UI
- Backend passa a ler/gravar via tabelas novas.
- UI passa a exibir múltiplas partes e histórico.

### Rollback
- Antes de dropar colunas legadas, manter compatibilidade por 1 release.
- Caso rollback seja necessário, reativar leitura dos campos antigos (JSONB/FKs) e ignorar novas tabelas.

## Open Questions
- Definição final: `contratos.cliente_id` permanece obrigatório e representa o cliente principal?
- Nomenclatura/legado: renomear `contratos.polo_cliente` (hoje enum `polo_processual`) para `papel_cliente_no_contrato` (autora/re) para evitar confusão com polo processual?
- Eventos: status suficiente ou precisamos de tipo de evento separado (ex: ASSINADO vs STATUS=CONTRATADO)?
- Política de sincronização contrato↔processo: automático sempre ou apenas sugerido ao usuário?
