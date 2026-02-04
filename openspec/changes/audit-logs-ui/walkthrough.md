# Walkthrough - Logs de Auditoria

## O que foi feito

Implementamos um sistema completo de auditoria para **Audiências**, **Expedientes** e **Perícias**.

### 1. Backend (Supabase)

- **Migration**: `20260202180000_create_generic_audit_trigger.sql`
  - Cria a função `log_generic_changes()` que compara automaticamente o estado anterior (`OLD`) e novo (`NEW`) dos registros.
  - Ignora alterações de sistema (robôs) e campos de controle interno.
  - Registra as alterações na tabela `logs_alteracao` com o tipo `alteracao_manual`.

### 2. Frontend

- **Serviço**: `AuditLogService` para buscar os logs no Supabase.
- **Hook**: `useAuditLogs` para facilitar o uso nos componentes.
- **Componente**: `AuditLogTimeline`
  - Visualização em linha do tempo.
  - Mostra "Quem", "Quando" e "O Que" mudou.
  - Formatação visual de "Diff" (De: `Valor Antigo` Para: `Valor Novo`).
- **Integração nas Telas**:
  - **Audiências**: Aba "Histórico" no card da audiência (`AudienciasDiaDialog`).
  - **Expedientes**: Aba "Histórico" nos detalhes (`ExpedienteDetalhesDialog`).
  - **Perícias**: Aba "Histórico" nos detalhes (`PericiaDetalhesDialog`).

## Como Testar

1.  **Rodar a Migration**
    - Execute o comando para aplicar a migration no seu banco de dados local/dev.

    ```bash
    npx supabase migration up
    ```

2.  **Verificar na UI**
    - Abra uma **Audiência**.
    - Edite um campo (ex: status, observação).
    - Salve.
    - Vá na aba **Histórico** e veja o registro da alteração.
    - Repita para **Expedientes** e **Perícias**.

## Arquivos Modificados

- `supabase/migrations/20260202180000_create_generic_audit_trigger.sql`
- `src/features/audit/services/audit-log.service.ts`
- `src/features/audit/hooks/use-audit-logs.ts`
- `src/components/common/audit-log-timeline.tsx`
- `src/features/audiencias/components/audiencias-dia-dialog.tsx`
- `src/features/expedientes/components/expediente-detalhes-dialog.tsx`
- `src/features/pericias/components/pericia-detalhes-dialog.tsx`
