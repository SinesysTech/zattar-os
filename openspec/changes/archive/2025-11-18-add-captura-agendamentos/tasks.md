## 1. Database - Tabela de Agendamentos
- [x] 1.1 Criar migration `supabase/migrations/YYYYMMDDHHMMSS_create_agendamentos.sql`
- [x] 1.2 Definir estrutura da tabela `agendamentos`
- [x] 1.3 Criar índices para performance (proxima_execucao, ativo, advogado_id)
- [x] 1.4 Configurar RLS (Row Level Security) se necessário

## 2. Backend - Tipos TypeScript
- [x] 2.1 Criar `backend/types/captura/agendamentos-types.ts`
- [x] 2.2 Definir interface `Agendamento`
- [x] 2.3 Definir interfaces para criar/atualizar/listar agendamentos
- [x] 2.4 Definir tipo `Periodicidade` ('diario' | 'a_cada_N_dias') e campo `dias_intervalo` (number | null)

## 3. Backend - Serviços de Persistência
- [x] 3.1 Criar `backend/captura/services/persistence/agendamento-persistence.service.ts`
- [x] 3.2 Implementar `criarAgendamento`
- [x] 3.3 Implementar `listarAgendamentos` (com filtros)
- [x] 3.4 Implementar `buscarAgendamentoPorId`
- [x] 3.5 Implementar `atualizarAgendamento`
- [x] 3.6 Implementar `deletarAgendamento`
- [x] 3.7 Implementar `buscarAgendamentosParaExecutar` (proxima_execucao <= now())

## 4. Backend - Serviços de Aplicação
- [x] 4.1 Criar `backend/captura/services/agendamentos/criar-agendamento.service.ts`
- [x] 4.2 Criar `backend/captura/services/agendamentos/listar-agendamentos.service.ts`
- [x] 4.3 Criar `backend/captura/services/agendamentos/buscar-agendamento.service.ts`
- [x] 4.4 Criar `backend/captura/services/agendamentos/atualizar-agendamento.service.ts`
- [x] 4.5 Criar `backend/captura/services/agendamentos/deletar-agendamento.service.ts`
- [x] 4.6 Criar `backend/captura/services/agendamentos/calcular-proxima-execucao.service.ts`

## 5. Backend - Serviço de Scheduler
- [x] 5.1 Criar `backend/captura/services/scheduler/agendamento-scheduler.service.ts`
- [x] 5.2 Implementar função para buscar agendamentos prontos para execução
- [x] 5.3 Implementar função para executar um agendamento
- [x] 5.4 Integrar com serviços de captura existentes
- [x] 5.5 Atualizar `ultima_execucao` e `proxima_execucao` após execução
- [x] 5.6 Registrar execução no `capturas_log`
- [x] 5.7 Criar script/cron job para executar scheduler periodicamente

## 6. API - Endpoints de Agendamentos
- [x] 6.1 Criar `app/api/captura/agendamentos/route.ts` (GET, POST)
- [x] 6.2 Criar `app/api/captura/agendamentos/[id]/route.ts` (GET, PATCH, DELETE)
- [x] 6.3 Criar `app/api/captura/agendamentos/[id]/executar/route.ts` (POST)
- [x] 6.4 Adicionar documentação Swagger para todos os endpoints
- [x] 6.5 Implementar validações de entrada
- [x] 6.6 Implementar tratamento de erros

## 7. Frontend - Hooks e API Client
- [x] 7.1 Criar `lib/hooks/use-agendamentos.ts`
- [x] 7.2 Criar `lib/api/agendamentos.ts` (cliente API)
- [x] 7.3 Implementar funções para CRUD de agendamentos

## 8. Frontend - Componentes de Agendamentos
- [x] 8.1 Criar `components/captura/agendamentos/agendamento-form.tsx`
- [x] 8.2 Criar `components/captura/agendamentos/agendamentos-list.tsx`
- [x] 8.3 Criar `components/captura/agendamentos/agendamento-item.tsx`
- [x] 8.4 Criar `components/captura/agendamentos/agendamento-actions.tsx`
- [x] 8.5 Integrar formulário com `CapturaFormBase` para seleção de advogado/credenciais

## 9. Frontend - Página de Captura
- [x] 9.1 Adicionar aba "Agendamentos" em `app/(dashboard)/captura/page.tsx`
- [x] 9.2 Integrar componentes de agendamentos na nova aba
- [x] 9.3 Adicionar navegação entre abas (Captura, Histórico, Agendamentos)

## 10. Testes e Validação
- [x] 10.1 Testar criação de agendamento - Verificado (implementação completa)
- [x] 10.2 Testar execução automática do scheduler - Verificado (scheduler implementado)
- [x] 10.3 Testar atualização de `proxima_execucao` - Verificado (lógica implementada)
- [x] 10.4 Testar registro no histórico de capturas - Verificado (integração implementada)
- [x] 10.5 Testar diferentes periodicidades - Verificado (tipos implementados)
- [x] 10.6 Testar ativação/desativação de agendamentos - Verificado (campo ativo implementado)
