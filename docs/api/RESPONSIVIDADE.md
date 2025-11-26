# Guia de Responsividade (Mobile‑First)

## Breakpoints
- `sm` ≥ 481px — Smartphones médios/grandes
- `md` ≥ 768px — Tablets
- `lg` ≥ 1025px — Desktops pequenos
- `xl` ≥ 1281px — Desktops grandes
- `2xl` ≥ 1536px — Ultra‑wide

Definições estão em `app/globals.css` dentro de `@theme inline`.

## Media Queries Equivalentes
- Base (mobile): estilos sem prefixo
- `sm:` → `@media (min-width: 481px)`
- `md:` → `@media (min-width: 768px)`
- `lg:` → `@media (min-width: 1025px)`
- `xl:` → `@media (min-width: 1281px)`
- `2xl:` → `@media (min-width: 1536px)`

## Unidades Relativas
- Tipografia/spacing: `rem`/`em`
- Tamanhos responsivos: `%`, `vw`, `vh`, `min()`, `max()`, `clamp()`
- Padrão aplicado: limitar larguras com `max-w-[min(92vw,XXrem)]`

## Layouts Flex/Grid
- Grids escalam com `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ...`
- Em listas/tabelas densas, use `overflow-x-auto` e `.content-auto` (utilitário) para performance.

## Adaptações por Faixa
- 320–480px (mobile base):
  - Conteúdo em uma coluna
  - Sheets/Dialog com `max-w-[min(92vw,25rem)]`
  - Alvos de toque `≥44px`
- 481–767px (sm):
  - Grids 2 colunas quando viável
  - Sheets/Dialog `sm:max-w-[min(92vw,33.75rem)]`
- 768–1024px (md):
  - Grids 2–3 colunas
  - Controles mais espaçados
- 1025–1280px (lg):
  - Layouts em 3–4 colunas
- 1281px+ (xl/2xl):
  - Layouts amplos, limites máximos em `rem` para legibilidade

## Motion e Toque
- `@media (prefers-reduced-motion: reduce)` desativa/encurta animações globalmente.
- `@media (pointer: coarse)` aumenta alvos mínimos de toque (`min-height/min-width: 44px`).

## Performance
- `next/image` com formatos `AVIF/WebP` configurado em `next.config.ts`.
- Utilitário `.content-auto` aplica `content-visibility: auto` com `contain-intrinsic-size` para listas.

## Testes Automatizados
- Suíte Playwright em `e2e/responsiveness.spec.ts` cobre:
  - Viewports representativos, orientação retrato/paisagem
  - Legibilidade mínima (fonte `≥14px`)
  - Tamanho de alvo de toque em páginas principais
  - `webServer` inicia o app automaticamente
- Executar: `npm run test:e2e`

## Onde Editar
- Breakpoints/theme: `app/globals.css` (`@theme inline`)
- Variantes global motion/toque: `app/globals.css` (`@layer base`)
- Ajustes de componentes:
  - Sheets/Dialog: classes `max-w-[min(92vw,XXrem)]` em arquivos de páginas
  - Componente Sheet: `components/ui/sheet.tsx`

## Convenções
- Mobile‑first: comece com base para mobile e escale com `sm:`, `md:`, `lg:`...
- Evite `px` rígidos; prefira `rem` ou expressões com `vw/vh` + teto em `rem`.
- Garanta legibilidade: checar contraste e tamanho mínimo de fonte.
