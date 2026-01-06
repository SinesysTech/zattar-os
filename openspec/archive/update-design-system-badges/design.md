## Context
O app já possui:
- `Badge` (UI base) em `src/components/ui/badge.tsx`
- `SemanticBadge` em `src/components/ui/semantic-badge.tsx`
- Mapeamento semântico em `src/lib/design-system/variants.ts` (`getSemanticBadgeVariant`)

O problema atual é que as variantes do `Badge` usam frequentemente `border-*-400` com fundos claros (ex.: `bg-green-50`), criando uma sensação de "tudo pastel" e contornos fortes competindo com o conteúdo.

## Goals
- Melhorar contraste e hierarquia visual.
- Padronizar consistência entre módulos.
- Reduzir liberdade de uso de `Badge` fora do padrão (governança).

## Non-Goals
- Reprojetar o tema inteiro.

## Proposed Standard
### Intensidade
- **soft**: fundo leve, texto forte, sem contorno forte (default para metadados: tribunal, grau, tipo)
- **solid**: fundo forte, texto claro, sem contorno forte (default para estados: status)

### Regras de contorno
- Evitar `border-*-400` como contorno padrão.
- Permitir borda sutil apenas em `outline`/casos especiais.

### API
- Preferir `SemanticBadge` para qualquer informação de domínio.
- `Badge` direto deve ser considerado "UI primitive" e restrito por lint.

### Enforcement
- ESLint `no-restricted-imports` para bloquear `@/components/ui/badge` em features.
- Exceções:
  - `src/components/ui/*`
  - `src/app/design-system/*` (sandbox)

## Migration Notes
- Migrar badges de domínio usados diretamente para `SemanticBadge` (ou wrappers especializados já existentes no arquivo).
