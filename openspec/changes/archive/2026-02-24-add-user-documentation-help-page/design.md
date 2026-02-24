## Context

A rota `/app/ajuda` existe mas contém apenas um playground interno do design system (`/app/ajuda/design-system/playground`). Não há nenhuma documentação voltada ao usuário final. O app usa Next.js 16 App Router, shadcn/ui, e Tailwind CSS v4. Páginas seguem os padrões `PageShell` ou `DataShell` + `DataTableToolbar`. O sidebar principal é definido em `app-sidebar.tsx` com 3 seções: navPrincipal, navServicos e navGestao.

## Goals / Non-Goals

**Goals:**
- Criar uma central de ajuda completa acessível em `/app/ajuda`
- Documentar cada módulo do sistema do ponto de vista do usuário final
- Navegação lateral dedicada que espelhe a hierarquia do sidebar principal
- Busca textual para encontrar funcionalidades rapidamente
- Conteúdo estático (sem banco de dados) para simplicidade e performance
- Manter o playground de design system existente intacto em sua sub-rota

**Non-Goals:**
- Sistema de tickets de suporte ou chat ao vivo
- Documentação de API ou documentação técnica/dev
- Versionamento de documentação (changelog)
- Internacionalização (i18n) — conteúdo será em português apenas
- Editor WYSIWYG para administradores editarem a documentação via UI
- Vídeo-tutoriais ou conteúdo multimídia incorporado

## Decisions

### 1. Conteúdo como componentes React estáticos (não MDX)

**Decisão:** Cada página de documentação será um componente React (.tsx) com conteúdo direto, usando componentes shadcn/ui para formatação.

**Alternativas consideradas:**
- **MDX files**: Permitiria edição mais fácil do conteúdo, mas adiciona dependência `@next/mdx` + `mdx-components`, e o app não usa MDX em lugar nenhum. Overhead desnecessário.
- **Markdown stored in DB**: Mais flexível, mas adiciona complexidade (tabela, CRUD, editor) que é non-goal.
- **Markdown files com `gray-matter`**: Bom para blogs, mas para documentação estruturada com componentes interativos (colapsáveis, tabs, callouts) é mais limitado.

**Rationale:** Componentes React dão controle total sobre layout, permitem uso direto de `Card`, `Accordion`, `Tabs`, `Alert` do shadcn/ui para organizar informações, e seguem o padrão do projeto sem dependências novas.

### 2. Layout com sidebar de navegação dedicado

**Decisão:** Um `layout.tsx` em `/app/ajuda` que renderiza uma sidebar fixa à esquerda com a árvore de tópicos, e o conteúdo à direita. Usar o componente `ScrollArea` do shadcn para a sidebar.

**Alternativas consideradas:**
- **Tabs horizontais no topo**: Limita o número de seções visíveis e não escala para ~25 páginas.
- **Menu dropdown**: Esconde a estrutura — ruim para navegação exploratória.
- **Reusar a sidebar principal do app**: Poluiria a navegação principal e misturaria funcionalidades com documentação.

**Rationale:** Documentação com muitas seções precisa de navegação lateral com hierarquia expansível. Padrão consolidado (Docs do Next.js, Tailwind, shadcn). A sidebar será independente da principal do app.

### 3. Estrutura de rotas flat com layout compartilhado

**Decisão:** Usar sub-rotas dinâmicas com catch-all: `/app/ajuda/[[...slug]]/page.tsx`. A slug determina qual conteúdo renderizar.

```
/app/ajuda                          → Página inicial (visão geral)
/app/ajuda/partes/clientes          → Documentação de Clientes
/app/ajuda/financeiro/dre           → Documentação do DRE
/app/ajuda/assinatura-digital/templates → Documentação de Templates
```

**Alternativas consideradas:**
- **Uma page.tsx por módulo**: Criaria ~25 pastas/arquivos de page. Funciona mas é verboso.
- **Single page com scroll**: Péssimo para SEO interno e deep-linking.

**Rationale:** Catch-all com slug permite deep-linking, mantém um único ponto de entrada, e o mapa de conteúdo fica centralizado em um objeto de configuração.

### 4. Registro de conteúdo centralizado

**Decisão:** Um arquivo `docs-registry.ts` que mapeia slugs para componentes de conteúdo, títulos, e metadados de navegação. Serve tanto para renderizar a sidebar quanto para resolver qual componente mostrar.

```typescript
type DocEntry = {
  title: string;
  slug: string;
  component: React.LazyComponent;
  children?: DocEntry[];
};
```

**Rationale:** Fonte única de verdade para navegação e roteamento. Facilita adicionar novos tópicos sem modificar layout ou roteamento.

### 5. Busca client-side com filtro simples

**Decisão:** Busca textual client-side que filtra os itens do registry por título e palavras-chave. Input no topo da sidebar.

**Alternativas consideradas:**
- **Algolia/search service**: Overkill para ~25 páginas estáticas.
- **Full-text search no DB**: Desnecessário — conteúdo é estático.

**Rationale:** Para ~25-30 páginas, filtro client-side com keywords é suficiente e zero overhead.

### 6. Componentes de documentação reutilizáveis

**Decisão:** Criar componentes auxiliares específicos para documentação:
- `DocSection` — wrapper de seção com título e âncora
- `DocFieldTable` — tabela para listar campos e suas descrições
- `DocActionList` — lista de ações disponíveis com ícones
- `DocTip` — callout de dica usando `Alert` do shadcn
- `DocSteps` — passos numerados para tutoriais

**Rationale:** Padroniza o formato visual da documentação e facilita a escrita de conteúdo para cada módulo.

## Risks / Trade-offs

- **[Conteúdo desatualiza]** → Mitigação: Documentação fica no codebase, então mudanças em features podem incluir atualizações na doc no mesmo PR.
- **[Volume de conteúdo é grande]** → Mitigação: Implementação incremental — começar com os módulos mais usados (Partes, Processos, Contratos) e expandir.
- **[Sidebar ocupa espaço]** → Mitigação: Sidebar será colapsável em telas menores, usando pattern responsivo similar ao sidebar principal do app.
- **[Catch-all route pode conflitar com playground existente]** → Mitigação: O playground em `/app/ajuda/design-system/playground` tem sua própria `page.tsx` e tem prioridade sobre o catch-all no App Router.
