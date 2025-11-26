# Tasks: Refatoração do Schema de Audiências

## Fase 1: Migração do Banco de Dados ✅

- [x] **1.1** Criar enum `modalidade_audiencia` com valores: `virtual`, `presencial`, `hibrida`
- [x] **1.2** Adicionar coluna `hora_inicio` (type `time`, nullable)
- [x] **1.3** Adicionar coluna `hora_fim` (type `time`, nullable)
- [x] **1.4** Adicionar coluna `modalidade` (type `modalidade_audiencia`, nullable)
- [x] **1.5** Criar função `populate_modalidade_audiencia()` que:
  - Define `virtual` se `url_audiencia_virtual IS NOT NULL` OU se descrição do tipo contém 'videoconfer'
  - Define `presencial` se `endereco_presencial IS NOT NULL`
  - Mantém `NULL` ou valor existente caso contrário (híbrida é manual)
- [x] **1.6** Criar trigger `trigger_set_modalidade_audiencia` em INSERT/UPDATE
- [x] **1.7** Popular `hora_inicio` e `hora_fim` dos registros existentes (extrair de `data_inicio`/`data_fim`)
- [x] **1.8** Popular `modalidade` dos registros existentes (executar lógica do trigger)
- [x] **1.9** Remover coluna `url` (não utilizada)
- [x] **1.10** Remover coluna `pauta_audiencia_horario_id` (redundante)

## Fase 2: Atualização do Backend ✅

- [x] **2.1** Atualizar `audiencias-persistence.service.ts`:
  - Remover `polo_ativo_cpf` e `polo_passivo_cnpj` do mapeamento
  - Remover `pauta_audiencia_horario_id`
  - Remover `url` (era usado para ata, mas não é mais necessário)
  - Adicionar mapeamento de `hora_inicio` (de `pautaAudienciaHorario.horaInicial`)
  - Adicionar mapeamento de `hora_fim` (de `pautaAudienciaHorario.horaFinal`)
- [x] **2.2** Atualizar tipos TypeScript em `backend/types/` se necessário
- [x] **2.3** Regenerar tipos do Supabase (`mcp__supabase__generate_typescript_types`)

## Fase 3: Atualização do Frontend ✅

- [x] **3.1** Adicionar filtro por `modalidade` na listagem de audiências
- [x] **3.2** Exibir badge/tag de modalidade nos cards/tabela de audiências
- [x] **3.3** Criar rota API para edição manual da modalidade (`/api/audiencias/[id]/modalidade`)

## Fase 4: Validação ✅

- [x] **4.1** Atualizar serviço de listagem com suporte a filtro de modalidade
- [x] **4.2** Atualizar tipos TypeScript no backend e frontend
- [x] **4.3** Atualizar Swagger/OpenAPI para documentar novo parâmetro
- [x] **4.4** Executar type-check do projeto
