## Contexto
- Projeto Next.js 16 com React 19 e Tailwind v4.
- Script de build atual: `next build --turbo` em `package.json:9`.
- `tsconfig.json` define alias TypeScript `@/*` para raiz do projeto (`tsconfig.json:24-27`).
- O bundler não está resolvendo `@/` no build: arquivo `errors-build.md` lista dezenas de "Module not found: Can't resolve '@/components/ui/...'.
- `next.config.ts` não configura alias de resolução; há hook `webpack` sem alias (`next.config.ts:15-32`).

## Objetivo
- Fazer `npm run build` concluir sem erros.
- Gerar arquivos de produção (`.next`, `standalone`) prontos para deploy.
- Documentar correções aplicadas.

## Plano de Ação
### 1) Diagnóstico automatizado
- Verificar versão do Node (`node -v`) e garantir compatibilidade com Next 16 (>= 18.18).
- Executar `npm run build` para coletar o log completo de erros.
- Categorizar erros por tipo: compilação (TS/JSX), dependências, configuração, alias/resolução, ambiente.
- Mapear cada erro para arquivo/linha com base nos traces do build.

### 2) Corrigir resolução de módulos (`@/`)
- Adicionar alias explícito para `'@'` apontando para a raiz do projeto no `next.config.ts` via `webpack.resolve.alias` (afeta builds com Webpack).
- Avaliar comportamento com Turbopack:
  - Se os erros persistirem com `--turbo`, aplicar fallback para Webpack removendo `--turbo` do script de build (usar `next build`).
  - Motivo: Turbopack ainda tem diferenças de resolução; Webpack é estável e compatível com `output: 'standalone'`.
- Alternativas de mitigação caso necessário:
  - Ajustar imports problemáticos para caminhos relativos como medida pontual.

### 3) Conferir Tailwind v4/PostCSS
- `postcss.config.mjs` já usa `@tailwindcss/postcss` (`postcss.config.mjs:1-7`).
- Validar que `app/globals.css` importa `tailwindcss` (`app/globals.css:1`) e que o build processa o CSS sem erros.

### 4) Verificar compatibilidade de libs com React 19/Next 16
- Checar bibliotecas com componentes client-only (ex.: `lucide-react`, `react-player`, Radix UI) em arquivos marcados com `"use client"` (ex.: `components/ui/dialog.tsx:1`).
- Onde houver uso de APIs de browser em server components, mover para client components ou usar `next/dynamic` com `ssr: false`.

### 5) Reexecutar e iterar
- Rodar `npm run build` novamente.
- Para cada erro remanescente:
  - Identificar tipo e arquivo/linha a partir do log.
  - Aplicar correção mínima e idiomática (tipos TS, imports, ajustes de config).
  - Validar com nova execução do build.

### 6) Validação de artefatos de produção
- Confirmar geração de `.next/standalone` por `output: 'standalone'` (`next.config.ts:5`).
- Verificar que o `Dockerfile` e `docker-compose.yml` estão alinhados com o output (cópia de `.next/standalone`, `.next/static`, `public/`).

### 7) Documentação
- Registrar todas as mudanças com motivo, arquivo e linhas afetadas.
- Resumir erros encontrados, categoria, solução e validação.

## Entregáveis
- Build concluindo sem erros.
- Alias `@` resolvido corretamente no bundler.
- Artefatos de produção gerados e verificados.
- Relatório das alterações com referências de arquivo/linha.

## Observações Técnicas
- Evidência dos erros de alias: múltiplas entradas de "Module not found" para `@/components/ui/*` em `errors-build.md`.
- O `tsconfig.json` ajuda o editor/TS, mas o bundler precisa de alias explícito; por isso a configuração no `webpack` ou o fallback para Webpack é a via mais segura no curto prazo.

Você confirma que devo executar o plano (rodar o build, aplicar as correções e validar)?