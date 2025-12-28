# Change: Padronizar Animated Tabs como padrão de navegação

## Why
Hoje o sistema usa múltiplas variações de tabs (ex: `Tabs02`, `Tabs02Responsive`, `TabsTrigger02`), gerando inconsistência visual e maior custo de manutenção.

## What Changes
- Substituir tabs de navegação (tabs de seção/visualização) pelo componente `AnimatedIconTabs` (framer-motion) como padrão visual.
- Manter `@radix-ui/react-tabs` e `ClientOnlyTabs` para acessibilidade e evitar hydration mismatch no React 19.
- Padronizar comportamento:
  - Apenas a tab ativa expande e exibe label
  - Tabs inativas ficam recolhidas (ícone-only)
  - Container com `bg-white` e borda

## Impact
- Affected specs:
  - `specs/ui-components/spec.md`
- Affected code (inicial):
  - `src/features/dashboard/components/dashboard-tabs.tsx`
  - `src/features/audiencias/components/audiencias-content.tsx`
  - `src/features/expedientes/components/expedientes-content.tsx`
  - `src/features/obrigacoes/components/obrigacoes-content.tsx`
  - `src/features/financeiro/components/financeiro-tabs-content.tsx`
  - `src/features/assinatura-digital/components/assinatura-digital-tabs-content.tsx`
  - `src/features/captura/components/captura-tabs-content.tsx`
  - `src/features/captura/components/comunica-cnj/tabs-content.tsx`

## Notes / Constraints
- Alteração focada apenas em **tabs de navegação** (seção/visualização). Não altera Tabs genéricas usadas em formulários/diálogos.
- Para módulos com muitas tabs (ex: Financeiro), será mantida a mesma lista, mas com comportamento de label apenas na tab ativa (padrão Animated Tabs).
