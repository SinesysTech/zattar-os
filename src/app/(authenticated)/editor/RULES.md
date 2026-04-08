# Regras de Negocio - Editor

## Contexto
Modulo proxy que fornece a rota `/editor` para o editor de texto rico (PlateEditor). O componente e carregado via `next/dynamic` para otimizacao de bundle (~500KB). Toda a logica do editor vive em `src/components/editor/plate/`.

## Estrutura
- `page.tsx` — Pagina client com lazy-loading do PlateEditor
- `layout.tsx` — Layout com PageShell
- `index.ts` — Barrel export (vazio por design — ver abaixo)

## Entidades Principais
Nenhuma propria. O editor e um componente de infraestrutura compartilhado.

## Regras Principais
- **Modulo proxy**: Toda a logica (plugins, extensions, formatacao) vive em `src/components/editor/plate/`
- **Lazy loading obrigatorio**: PlateEditor deve ser carregado via `next/dynamic` com `ssr: false` para evitar bundle bloat
- **Sem re-export direto**: O barrel export nao re-exporta PlateEditor para evitar puxar ~500KB em imports de barrel. Consumidores devem importar diretamente de `@/components/editor/plate/plate-editor`
- **PageShell via layout**: Layout centralizado com PageShell

## Por que nao tem domain.ts/service.ts/repository.ts?
- Nao ha entidades de negocio proprias
- Nao ha persistencia (o conteudo gerado e consumido por outros modulos como `pecas-juridicas` e `documentos`)
- Nao ha regras de validacao alem das do PlateEditor
- Forcar estrutura FSD aqui criaria arquivos vazios sem valor

## Onde esta a logica real
- **Componente principal**: `src/components/editor/plate/plate-editor.tsx`
- **Plugins**: `src/components/editor/plate/plugins/`
- **Consumidores**: `pecas-juridicas`, `documentos`, `notas` (parcialmente)

## Quando este modulo evoluiria
Se for necessario persistir documentos diretamente do editor (sem passar por outro modulo), versionar conteudo, ou aplicar regras de negocio especificas (templates, placeholders, validacoes).
