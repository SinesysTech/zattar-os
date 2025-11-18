# Change: Sistema de Agendamento de Capturas

## Why
Atualmente, as capturas precisam ser iniciadas manualmente pelo usuário. Para automatizar o processo e garantir que as capturas sejam executadas regularmente sem intervenção manual, é necessário implementar um sistema de agendamento que permita:
- Agendar capturas para execução automática em horários específicos
- Definir periodicidade (diária, a cada 2 dias, etc.)
- Selecionar tipo de captura, advogado e credenciais
- Visualizar e gerenciar agendamentos criados
- Registrar execuções automáticas no histórico de capturas

## What Changes
- **NEW**: Criar tabela `agendamentos` no banco de dados
- **NEW**: Criar serviços backend para CRUD de agendamentos
- **NEW**: Criar endpoints API REST para gerenciar agendamentos
- **NEW**: Criar serviço de execução automática de agendamentos (scheduler)
- **NEW**: Criar componente frontend para gerenciar agendamentos
- **NEW**: Adicionar aba "Agendamentos" na página de captura
- **MODIFIED**: Integrar execuções automáticas com histórico de capturas existente

## Impact
- Affected specs: `captura-trt` (expandido), `agendamentos` (novo)
- Affected code:
  - Backend: `backend/captura/services/agendamentos/` (novo), `backend/captura/services/scheduler/` (novo)
  - API: `app/api/captura/agendamentos/` (novo)
  - Frontend: `components/captura/agendamentos/` (novo), `app/(dashboard)/captura/` (modificado)
  - Database: Nova tabela `agendamentos` (migration)

## Technical Details

### Tabela `agendamentos`
- `id`: ID único do agendamento
- `tipo_captura`: Tipo de captura (acervo_geral, arquivados, audiencias, pendentes)
- `advogado_id`: ID do advogado
- `credencial_ids`: Array de IDs das credenciais
- `periodicidade`: Tipo de periodicidade (diario, a_cada_N_dias onde N é configurável pelo usuário)
- `dias_intervalo`: Número de dias entre execuções (usado quando periodicidade = a_cada_N_dias)
- `horario`: Horário de execução (HH:mm)
- `ativo`: Boolean indicando se o agendamento está ativo
- `parametros_extras`: JSONB com parâmetros específicos (dataInicio, dataFim, filtroPrazo)
- `ultima_execucao`: Timestamp da última execução
- `proxima_execucao`: Timestamp da próxima execução calculada
- `created_at`, `updated_at`: Timestamps padrão

### Serviço de Scheduler
- Executar periodicamente (ex: a cada minuto) verificando agendamentos ativos
- Identificar agendamentos cuja `proxima_execucao` chegou
- Executar captura usando os serviços existentes
- Atualizar `ultima_execucao` e calcular nova `proxima_execucao`
- Registrar execução no histórico de capturas (`capturas_log`)

### Endpoints API
- `GET /api/captura/agendamentos`: Listar agendamentos (com filtros)
- `POST /api/captura/agendamentos`: Criar novo agendamento
- `GET /api/captura/agendamentos/[id]`: Buscar agendamento específico
- `PATCH /api/captura/agendamentos/[id]`: Atualizar agendamento
- `DELETE /api/captura/agendamentos/[id]`: Deletar agendamento
- `POST /api/captura/agendamentos/[id]/executar`: Executar agendamento manualmente

### Frontend
- Nova aba "Agendamentos" na página de captura
- Formulário para criar/editar agendamentos
- Lista de agendamentos com status (ativo/inativo)
- Ações: editar, ativar/desativar, deletar, executar manualmente
- Visualização de histórico de execuções do agendamento

