# Change: Update Design System Badges

## Why
Os badges atuais usam contornos fortes e cores muito claras (pastel), o que reduz contraste, hierarquia visual e consistência entre módulos. Além disso, o uso direto de `Badge` fora do padrão dificulta governança de design.

## What Changes
- **Definir um padrão único de badges** (cores, contorno, intensidade) aplicável em todo o app.
- **Introduzir intensidades de badge** (ex.: `solid` e `soft`) para diferenciar informação primária vs secundária.
- **Centralizar o mapeamento semântico** (categoria + valor → variante + intensidade) no design system.
- **Enforcement/constraint**: reduzir/impedir uso de `Badge` diretamente em features, exigindo uso de `SemanticBadge`/wrappers aprovados.
- **Documentação e playground** na sandbox/design-system para demonstrar o padrão e guiar o uso.

## Impact
- Affected specs:
  - Design System / UI conventions (semântica de badges)
- Affected code (expected):
  - `src/components/ui/badge.tsx`
  - `src/components/ui/semantic-badge.tsx`
  - `src/lib/design-system/variants.ts`
  - `eslint` rules (ex.: `no-restricted-imports`)
  - `src/app/design-system/page.tsx` (sandbox)
- Risk:
  - Mudança visual transversal; exige revisão visual rápida em telas principais.

## Non-Goals
- Recriar todos os componentes de UI.
- Alterar tokens de tema (Tailwind config) além do necessário.
