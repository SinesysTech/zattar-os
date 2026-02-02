# Plano de Implementação: Logs de Auditoria e Visualização

## User Review Required

> [!IMPORTANT]
> Esta mudança introduz triggers que serão executados em todos os UPDATES das tabelas principais. Embora otimizado, é importante monitorar a performance inicial.
> A lógica assume que `app.current_user_id` está setado corretamente na sessão do Supabase/Next.js.

## Proposed Changes

### Backend (Supabase/PostgreSQL)

#### [NEW] [migrations/20260202180000_create_generic_audit_trigger.sql](file:///c:/Development/zattar-advogados-app/supabase/migrations/20260202180000_create_generic_audit_trigger.sql)

- Cria função `public.log_generic_changes()` que:
  - Verifica se há usuário atual (`app.current_user_id`).
  - Compara `OLD` e `NEW`.
  - Ignora colunas: `updated_at`, `created_at`, `dados_anteriores`, `responsavel_id` (já tem trigger próprio), `dados_antigos`.
  - Insere em `logs_alteracao` com tipo `alteracao_manual`.
- Aplica triggers em:
  - `public.audiencias`
  - `public.expedientes`
  - `public.pericias`

### Frontend (Components)

#### [NEW] [src/components/common/audit-log-timeline.tsx](file:///c:/Development/zattar-advogados-app/src/components/common/audit-log-timeline.tsx)

- Componente visual para listar logs.
- Recebe `logs: LogAlteracao[]`.
- Formatação amigável de datas e nomes de usuários.
- "Diff" visual ("Mudou Status de X para Y").

#### [MODIFY] [src/features/audiencias/components/audiencia-detalhes-dialog.tsx](file:///c:/Development/zattar-advogados-app/src/features/audiencias/components/audiencia-detalhes-dialog.tsx)

- Adicionar aba "Histórico" usando `AuditLogTimeline`.

#### [MODIFY] [src/features/expedientes/components/expediente-detalhes-dialog.tsx](file:///c:/Development/zattar-advogados-app/src/features/expedientes/components/expediente-detalhes-dialog.tsx)

- Adicionar aba "Histórico".

#### [MODIFY] [src/features/pericias/components/pericia-detalhes-dialog.tsx](file:///c:/Development/zattar-advogados-app/src/features/pericias/components/pericia-detalhes-dialog.tsx)

- Adicionar aba "Histórico".

### Services/Actions

#### [NEW] [src/features/audit/services/audit-log.service.ts](file:///c:/Development/zattar-advogados-app/src/features/audit/services/audit-log.service.ts)

- Função para buscar logs: `getAuditLogs(entityType, entityId)`.

## Verification Plan

### Automated Tests

- Criar teste de unidade para a função SQL (usando `pgTAP` se disponível, ou teste de integração via código).
- Teste: Fazer update como usuário -> Verificar `logs_alteracao`.
- Teste: Fazer update como sistema (sem user_id) -> Verificar que NÃO criou log.

### Manual Verification

1.  Abrir uma Audiência.
2.  Editar a "Data".
3.  Salvar.
4.  Ir na aba "Histórico" e ver o registro "Data alterada de X para Y por [Seu Nome]".
