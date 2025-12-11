# Pendências de Migração @/app/\_lib

## Status Geral

✅ **Migrados com sucesso**: 73 arquivos (84%)
⚠️ **Requerem atenção manual**: 14 arquivos (16%)

## Imports Legados Remanescentes

### 1. Hooks que não existem mais

Os seguintes hooks foram removidos e precisam ser substituídos por Server Actions ou outros hooks:

#### `useClientes`

**Arquivos afetados:**

- `src/app/(dashboard)/financeiro/contas-receber/page.tsx` (linha 56, 375, 570)
- `src/app/(dashboard)/financeiro/contas-receber/[id]/page.tsx` (linha 13)

**Solução sugerida:**

- Migrar para Server Action na feature `partes` ou `financeiro`
- Criar `actionListarClientes()` se necessário
- Usar fetching direto via Server Component quando possível

#### `useMinhasPermissoes`

**Arquivos afetados:**

- `src/app/(dashboard)/assinatura-digital/formularios/client-page.tsx`
- `src/app/(dashboard)/assinatura-digital/formularios/[id]/schema/page.tsx`
- `src/app/(dashboard)/assinatura-digital/segmentos/client-page.tsx`
- `src/app/(dashboard)/assinatura-digital/templates/page.tsx`
- `src/app/(dashboard)/assinatura-digital/templates/[id]/edit/page.tsx`

**Solução sugerida:**

- Usar API `/api/permissoes/minhas` diretamente
- Ou criar hook em `@/features/usuarios/hooks/use-minhas-permissoes.ts`

#### `useTribunais`

**Arquivos afetados:**

- `src/app/(dashboard)/captura/tribunais/page.tsx`

**Solução sugerida:**

- Criar Server Action em `@/features/captura` ou usar `@/types/tribunais`

#### `useTiposAudiencias`

**Arquivos afetados:**

- `src/features/audiencias/components/audiencia-form.tsx`
- `src/features/audiencias/components/audiencias-content.tsx`

**Solução sugerida:**

- Migrar para `@/features/audiencias/hooks/use-tipos-audiencias.ts`

#### `useMounted` e `useIsTouchDevice`

**Arquivos afetados:**

- `src/components/editor/plate-ui/block-context-menu.tsx`
- `src/components/editor/plate-ui/mention-node.tsx`

**Solução sugerida:**

- Migrar para `@/hooks/use-mounted.ts` (criar se necessário)
- `useIsTouchDevice` pode usar `use-media-query` ou criar novo hook global

### 2. Utilitários

#### `markdownJoinerTransform`

**Arquivos afetados:**

- `src/app/api/ai/command/route.ts`
- `src/app/api/plate/ai/route.ts`

**Solução sugerida:**

- Migrar para `@/lib/utils/markdown.ts` ou similar

## Mapeamento de Migrações Realizadas

| Import Antigo                            | Import Novo                             | Status      |
| ---------------------------------------- | --------------------------------------- | ----------- |
| `@/app/_lib/utils/utils`                 | `@/lib/utils`                           | ✅ Completo |
| `@/app/_lib/hooks/use-acervo`            | `@/features/acervo`                     | ✅ Completo |
| `@/app/_lib/hooks/use-audiencias`        | `@/features/audiencias`                 | ✅ Completo |
| `@/app/_lib/hooks/use-usuarios`          | `@/features/usuarios`                   | ✅ Completo |
| `@/app/_lib/hooks/use-obrigacoes`        | `@/features/financeiro`                 | ✅ Completo |
| `@/app/_lib/hooks/use-contas-*`          | `@/features/financeiro`                 | ✅ Completo |
| `@/app/_lib/hooks/use-orcamentos`        | `@/features/financeiro`                 | ✅ Completo |
| `@/app/_lib/hooks/use-plano-contas`      | `@/features/financeiro`                 | ✅ Completo |
| `@/app/_lib/hooks/use-mobile`            | `@/hooks/use-breakpoint`                | ✅ Completo |
| `@/app/_lib/types/*`                     | `@/types/*`                             | ✅ Completo |
| `@/app/_lib/assinatura-digital/*`        | `@/features/assinatura-digital/utils/*` | ✅ Completo |
| `@/app/_lib/stores/*`                    | `@/features/*/stores`                   | ✅ Completo |
| `@/app/_lib/hooks/use-clientes`          | ❌ Pendente                             | ⚠️ Manual   |
| `@/app/_lib/hooks/use-minhas-permissoes` | ❌ Pendente                             | ⚠️ Manual   |
| `@/app/_lib/hooks/use-tribunais`         | ❌ Pendente                             | ⚠️ Manual   |
| `@/app/_lib/hooks/use-tipos-audiencias`  | ❌ Pendente                             | ⚠️ Manual   |
| `@/app/_lib/hooks/use-mounted`           | ❌ Pendente                             | ⚠️ Manual   |
| `@/app/_lib/hooks/use-is-touch-device`   | ❌ Pendente                             | ⚠️ Manual   |
| `@/app/_lib/markdown-joiner-transform`   | ❌ Pendente                             | ⚠️ Manual   |

## Próximos Passos

1. ✅ Deletar pasta `src/app/_lib` (manter apenas `use-mobile.ts` temporariamente)
2. ⚠️ Criar hooks faltantes em seus locais apropriados
3. ⚠️ Atualizar arquivos pendentes manualmente
4. ✅ Testar build para identificar erros
5. ✅ Atualizar documentação da arquitetura

## Comandos Úteis

```bash
# Verificar imports restantes
grep -r "from ['\"]@/app/_lib" src --include="*.ts" --include="*.tsx"

# Contar arquivos afetados
grep -rl "from ['\"]@/app/_lib" src --include="*.ts" --include="*.tsx" | wc -l
```
