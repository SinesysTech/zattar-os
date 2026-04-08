# Regras de Negocio - Ajuda

## Contexto
Central de Ajuda do ZattarOS. Sistema de documentacao dinamica baseado em registry + lazy loading. Serve documentacao interna para usuarios do sistema. Nao possui regras de negocio — e puramente um sistema de conteudo estatico.

## Estrutura
- `[...slug]/page.tsx` — Rota dinamica que resolve qualquer caminho como uma entrada do registry
- `components/docs-sidebar.tsx` — Navegacao lateral com busca
- `components/doc-components.tsx` — Componentes auxiliares para renderizacao de docs (DocSection, DocFieldTable, DocActionList, DocTip, DocSteps)
- `content/` — Componentes React de conteudo (1 por doc), carregados via `lazy()`
- `design-system/playground/` — Playground interativo do Design System
- `docs-registry.ts` — Registry central de todas as docs (fonte da verdade)
- `layout.tsx` — Layout com PageShell e sidebar fixa

## Entidades Principais
- **DocEntry**: Entrada no registry com `title`, `slug`, `keywords`, `component` (lazy) e `children` (hierarquia)

## Regras Principais
- **Lazy loading**: Todo conteudo e carregado via `React.lazy()` para otimizacao de bundle
- **Registry como fonte da verdade**: `docs-registry.ts` define a estrutura hierarquica de toda a documentacao
- **Rota dinamica**: `[...slug]/page.tsx` resolve slugs para componentes via `resolveSlug()`
- **Busca client-side**: `searchDocs()` busca por titulo e keywords no registry
- **PageShell via layout**: Layout centralizado com PageShell

## Como adicionar nova documentacao
1. Criar arquivo em `content/<slug>.tsx` exportando um componente React default
2. Adicionar entrada em `docs-registry.ts` com `title`, `slug`, `keywords` e `component: lz('<slug>')`
3. Para hierarquia, usar `children: []` na entrada pai

## Por que nao tem domain.ts/service.ts/repository.ts?
- Nao ha entidades de negocio
- Nao ha persistencia (todo o conteudo e estatico em arquivos `.tsx`)
- Nao ha regras de validacao
- O "dominio" e o proprio `docs-registry.ts`
- Forcar FSD aqui criaria arquivos vazios

## Quando este modulo evoluiria
Se a documentacao passar a ser editavel pelo usuario, versionada com historico, ou indexada para busca semantica.
