## Visão Geral
- Stack atual: Next.js App Router (16) com Tailwind v4 (`app/globals.css:1`) e amplo uso de utilitários responsivos em TSX. Há hooks úteis como `useIsMobile` (`app/_lib/hooks/use-mobile.ts:3`) e `useIsTouchDevice` (`app/_lib/hooks/use-is-touch-device.ts:5`).
- Testes: dependência `playwright` presente (`package.json:103`), mas falta `@playwright/test` para suíte automatizada.
- Objetivo: implementar mobile-first completo, alinhar breakpoints às faixas pedidas, remover tamanhos rígidos, documentar, e criar testes automatizados abrangendo densidade de pixels, orientação e navegadores.

## Ajuste de Breakpoints (Tailwind v4)
- Definir breakpoints mobile-first via `@theme inline` em `app/globals.css`:
  - `sm`: 481px (smartphones médios/grandes)
  - `md`: 768px (tablets)
  - `lg`: 1025px (desktop pequeno)
  - `xl`: 1281px (desktop grande)
  - `2xl`: 1536px (ultra‑wide, se necessário)
- Implementação: adicionar tokens `--breakpoint-*` no bloco `@theme inline` (`app/globals.css:6`).
- Impacto: variantes existentes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) passam a respeitar as novas faixas. Faremos validação visual nas telas sensíveis (ex.: `components/ui/sheet.tsx`, `components/layout/app-breadcrumb.tsx`).

## Mobile‑First e Unidades Relativas
- Padrão: estilos base para 320–480px; progressivo com `sm:`, `md:`, `lg:`, `xl:`.
- Converter valores arbitrários em pixels para unidades relativas ou responsivas quando afetarem UX em telas menores:
  - Larguras fixas: `w-[400px]`, `max-w-[600px]` → `w-[min(92vw,32rem)]`, `max-w-[min(92vw,37.5rem)]`.
  - Popovers/Sheets: manter limites máximos, mas basear em `vw` com teto em `rem`:
    - Ex.: `app/(dashboard)/usuarios/components/usuario-view-sheet.tsx:40` `w-[400px] sm:w-[540px]` → `w-[min(92vw,25rem)] sm:w-[min(92vw,33.75rem)]`.
  - Textos com `text-[…px]` (ex.: `components/ui/callout-node.tsx:48`) → mapear para escala Tailwind (`text-base`, `text-lg`) ou `clamp()` se necessário.
- Manter spacing/typography do Tailwind (base em `rem`); evitar alterar `:root` `font-size` para não quebrar escala global.

## Revisão de Componentes Sensíveis
- Auditar e ajustar componentes com muitos tamanhos fixos:
  - Toolbars e grids: `components/ui/table-toolbar.tsx:112,140,185`; `app/(dashboard)/usuarios/components/usuarios-grid-view.tsx` (`grid-cols-*` em breakpoints).
  - Sheets/dialogs: `components/ui/sheet.tsx` (`sm:max-w-sm`), `app/(dashboard)/*/components/*-dialog.tsx` (`sm:max-w-[...]`).
  - Editor/combobox: `components/ui/editor.tsx:81`, `components/ui/inline-combobox.tsx:267`.
- Estratégia: substituir larguras/alturas em `px` por `min()/max()/clamp()` com limites em `vw`/`vh` e `rem`, garantindo legibilidade e toque.

## Toque, DPI e Acessibilidade
- Tamanho mínimo de alvo de toque: 44–48px (≈ 2.75–3rem) em botões, inputs, itens de listas; revisar `components/ui/*` (ex.: `components/ui/input.tsx`, `components/ui/button.tsx`).
- Habilitar detecção touch via `useIsTouchDevice` (`app/_lib/hooks/use-is-touch-device.ts:5`) para:
  - Aumentar `gap`/`padding` e espaçamento de controles em mobile.
  - Reduzir áreas de drag precise e animações.
- Considerar `@media (prefers-reduced-motion: reduce)` para desativar transições pesadas (com `framer-motion`) em dispositivos com hardware limitado.

## Performance e Conexões Lentas
- Imagens: padronizar `next/image` com formatos modernos (`webp`, `avif`) e `sizes`/`quality` por breakpoint; configurar em `next.config.ts` (se necessário).
- Lazy loading agressivo para conteúdos pesados; usar `content-visibility: auto` onde adequado (listas/timelines).
- Reduzir animações em mobile/lento; debouncing para handlers de scroll/resize.
- Optionais: usar `navigator.connection.effectiveType` para degradação (qualidade de imagem, desativar pré‑visualizações de mídia).

## Testes Automatizados (Playwright)
- Adicionar `@playwright/test` e configurar `playwright.config.ts` para rodar em `chromium`, `webkit`, `firefox`.
- Suíte: `e2e/responsiveness.spec.ts` cobrindo:
  - Viewports: 360x640, 390x844, 768x1024, 1024x768 (paisagem), 1280x800, 1440x900.
  - Densidade de pixels: `deviceScaleFactor` 1, 2, 3.
  - Orientação: alternar retrato/paisagem.
  - Redimensionamento suave: varrer larguras e verificar ausência de erros de console/layout thrashing.
  - Legibilidade: validar `font-size/line-height` mínimos para `h1`, `p`, `button` via `getComputedStyle`.
  - Toque: em mobile com `hasTouch`, validar abertura de menus/sheets e tamanho de alvo (`>= 44px`).
  - Performance: coletar métricas simples (`domContentLoaded`, `firstPaint` proxy) e orçamentos por página.
- Páginas alvo: principais rotas do dashboard (`app/(dashboard)/*/page.tsx`) e de auth (`app/auth/*/page.tsx`).

## Documentação de Responsividade
- Criar documentação em `docs/RESPONSIVIDADE.md` contendo:
  - Breakpoints definidos e suas media queries equivalentes.
  - Guia de uso de unidades relativas (`rem`, `em`, `%`, `vw/vh`) com exemplos.
  - Padrões de Grid/Flex usados (exemplos práticos com Tailwind).
  - Tabela de adaptações por faixa de tamanho (o que muda em cada breakpoint).
  - Checklist de toque, DPI, orientação e performance.
- Adicionar um guia de manutenção: onde editar (ex.: `app/globals.css:6`), como testar (`npm run test:e2e`), e convenções para novos componentes.

## Passos de Implementação
1. Atualizar breakpoints no `@theme inline` de `app/globals.css`.
2. Revisar e converter tamanhos fixos críticos em `px` para expressões responsivas (`vw`/`rem`/`clamp()`).
3. Ajustar componentes de navegação/sheets para mobile‑first (colapsar/expandir, max‑widths em `%/vw`).
4. Introduzir regras `prefers-reduced-motion` e condicionais com `useIsTouchDevice` para espaçamento/gestos.
5. Configurar `next/image` e micro‑otimizações de renderização.
6. Adicionar `@playwright/test`, `playwright.config.ts` e escrever suíte de responsividade.
7. Criar `docs/RESPONSIVIDADE.md` e um guia de implementação/manutenção.

## Validação
- Executar testes em três navegadores e múltiplas densidades/orientações.
- Verificar regressões visuais nas páginas com alto uso de grid e dialogs.
- Medir métricas de renderização e garantir orçamentos mínimos.

## Entregáveis
- Breakpoints atualizados e consistentes no Tailwind.
- Componentes sem dependência de larguras fixas problemáticas em mobile.
- Suíte de testes automatizados de responsividade.
- Documentação completa e guia de manutenção.

Confirma prosseguir com este plano? Após aprovação, aplico as mudanças e rodo a validação completa.