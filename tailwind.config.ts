import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

/**
 * Tailwind CSS v4 — Configuração Mínima
 *
 * IMPORTANTE: em Tailwind v4, tokens de cor, fonte, spacing customizado etc.
 * são definidos via `@theme inline` em `src/app/globals.css` (CSS-first).
 * NÃO adicione cores/fontes aqui — elas serão ignoradas pelo engine Rust v4.
 *
 * Este arquivo existe para:
 *   1. Carregar o plugin `tailwindcss-animate` (animações de shadcn/ui)
 *   2. Expor `max-w-350 / w-350` (1400px) como utility — o único token CSS
 *      que ainda é mais ergonômico declarar aqui do que em `@theme inline`.
 *
 * Fonte canônica de tokens:
 *   - src/app/globals.css (bloco `@theme inline` — linhas 23-228)
 *   - design-system/MASTER.md (documentação narrativa)
 *   - src/lib/design-system/tokens.ts (espelho TypeScript tipado)
 */

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      maxWidth: {
        '350': '1400px',
      },
      width: {
        '350': '1400px',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
