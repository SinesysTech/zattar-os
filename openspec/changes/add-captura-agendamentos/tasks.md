## 1. Database - Tabela de Agendamentos
- [ ] 1.1 Criar migration `supabase/migrations/YYYYMMDDHHMMSS_create_agendamentos.sql`
- [ ] 1.2 Definir estrutura da tabela `agendamentos`
- [ ] 1.3 Criar índices para performance (proxima_execucao, ativo, advogado_id)
- [ ] 1.4 Configurar RLS (Row Level Security) se necessário

## 2. Backend - Tipos TypeScript
- [ ] 2.1 Criar `backend/types/captura/agendamentos-types.ts`
- [ ] 2.2 Definir interface `Agendamento`
- [ ] 2.3 Definir interfaces para criar/atualizar/listar agendamentos
- [ ] 2.4 Definir tipo `Periodicidade` ('diario' | 'a_cada_N_dias') e campo `dias_intervalo` (number | null)

## 3. Backend - Serviços de Persistência
- [ ] 3.1 Criar `backend/captura/services/persistence/agendamento-persistence.service.ts`
- [ ] 3.2 Implementar `criarAgendamento`
- [ ] 3.3 Implementar `listarAgendamentos` (com filtros)
- [ ] 3.4 Implementar `buscarAgendamentoPorId`
- [ ] 3.5 Implementar `atualizarAgendamento`
- [ ] 3.6 Implementar `deletarAgendamento`
- [ ] 3.7 Implementar `buscarAgendamentosParaExecutar` (proxima_execucao <= now())

## 4. Backend - Serviços de Aplicação
- [ ] 4.1 Criar `backend/captura/services/agendamentos/criar-agendamento.service.ts`
- [ ] 4.2 Criar `backend/captura/services/agendamentos/listar-agendamentos.service.ts`
- [ ] 4.3 Criar `backend/captura/services/agendamentos/buscar-agendamento.service.ts`
- [ ] 4.4 Criar `backend/captura/services/agendamentos/atualizar-agendamento.service.ts`
- [ ] 4.5 Criar `backend/captura/services/agendamentos/deletar-agendamento.service.ts`
- [ ] 4.6 Criar `backend/captura/services/agendamentos/calcular-proxima-execucao.service.ts`

## 5. Backend - Serviço de Scheduler
- [ ] 5.1 Criar `backend/captura/services/scheduler/agendamento-scheduler.service.ts`
- [ ] 5.2 Implementar função para buscar agendamentos prontos para execução
- [ ] 5.3 Implementar função para executar um agendamento
- [ ] 5.4 Integrar com serviços de captura existentes
- [ ] 5.5 Atualizar `ultima_execucao` e `proxima_execucao` após execução
- [ ] 5.6 Registrar execução no `capturas_log`
- [ ] 5.7 Criar script/cron job para executar scheduler periodicamente

## 6. API - Endpoints de Agendamentos
- [ ] 6.1 Criar `app/api/captura/agendamentos/route.ts` (GET, POST)
- [ ] 6.2 Criar `app/api/captura/agendamentos/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] 6.3 Criar `app/api/captura/agendamentos/[id]/executar/route.ts` (POST)
- [ ] 6.4 Adicionar documentação Swagger para todos os endpoints
- [ ] 6.5 Implementar validações de entrada
- [ ] 6.6 Implementar tratamento de erros

## 7. Frontend - Hooks e API Client
- [ ] 7.1 Criar `lib/hooks/use-agendamentos.ts`
- [ ] 7.2 Criar `lib/api/agendamentos.ts` (cliente API)
- [ ] 7.3 Implementar funções para CRUD de agendamentos

## 8. Frontend - Componentes de Agendamentos
- [ ] 8.1 Criar `components/captura/agendamentos/agendamento-form.tsx`
- [ ] 8.2 Criar `components/captura/agendamentos/agendamentos-list.tsx`
- [ ] 8.3 Criar `components/captura/agendamentos/agendamento-item.tsx`
- [ ] 8.4 Criar `components/captura/agendamentos/agendamento-actions.tsx`
- [ ] 8.5 Integrar formulário com `CapturaFormBase` para seleção de advogado/credenciais

## 9. Frontend - Página de Captura
- [ ] 9.1 Adicionar aba "Agendamentos" em `app/(dashboard)/captura/page.tsx`
- [ ] 9.2 Integrar componentes de agendamentos na nova aba
- [ ] 9.3 Adicionar navegação entre abas (Captura, Histórico, Agendamentos)

## 10. Testes e Validação
- [ ] 10.1 Testar criação de agendamento
- [ ] 10.2 Testar execução automática do scheduler
- [ ] 10.3 Testar atualização de `proxima_execucao`
- [ ] 10.4 Testar registro no histórico de capturas
- [ ] 10.5 Testar diferentes periodicidades
- [ ] 10.6 Testar ativação/desativação de agendamentos

