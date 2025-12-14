# Status de Migração dos Diálogos de Cadastro

Esta tabela rastreia o progresso da migração dos diálogos de cadastro para o novo componente `DialogFormShell`.

| Feature | Arquivo | Tipo Atual | Multi-Step | Status | Prioridade |
|---------|---------|------------|------------|--------|------------|
| Partes | `src/features/partes/components/clientes/cliente-form.tsx` | DialogFormShell | Sim (5 steps) | ✅ Migrado | Alta |
| Usuários | `src/features/usuarios/components/forms/usuario-create-dialog.tsx` | DialogFormShell | Não | ✅ Migrado | Alta |
| Usuários | `src/features/usuarios/components/forms/usuario-edit-dialog.tsx` | DialogFormShell | Não | ✅ Migrado | Alta |
| Processos | `src/features/processos/components/processo-form.tsx` | DialogFormShell | Não | ✅ Migrado | Alta |
| Contratos | `src/features/contratos/components/contrato-form.tsx` | DialogFormShell | Não | ✅ Migrado | Alta |
| RH | `src/features/rh/components/salarios/salario-form-dialog.tsx` | DialogFormShell | Não | ✅ Migrado | Média |
| Financeiro | `src/features/financeiro/components/contas-pagar/conta-pagar-form-dialog.tsx` | DialogFormShell | Não | ✅ Migrado | Média |

## Notas
- **ClienteForm**: Migrado e bug de endereço corrigido.
- **UsuarioCreateDialog**: Migrado para `DialogFormShell`.
- **UsuarioEditDialog**: Migrado para `DialogFormShell`.
- **ProcessoForm**: Reescrito para usar `DialogFormShell` e `useActionState` (era um form simples antes).
- **ContratoForm**: Migrado de `Sheet` para `DialogFormShell` (mantendo `ResponsiveDialog` behavior).
- **SalarioFormDialog**: Migrado para `DialogFormShell`.
- **ContaPagarFormDialog**: Migrado para `DialogFormShell`.
