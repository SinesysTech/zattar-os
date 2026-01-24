# Change: Refinar Layout do Fluxo de Configuração de Documento para Assinatura

## Why

O fluxo de configuração de documento para assinatura digital (páginas de edição e revisão) carece de consistência visual e narrativa de layout. A primeira página de upload está adequada, mas as páginas subsequentes apresentam layout fragmentado, sem hierarquia visual clara e sem aderência ao padrão de design do protótipo aprovado.

## What Changes

### Página de Edição (`/documentos/editar/[uuid]`)

- **Header do Canvas**: Adicionar barra de contexto com nome do documento, última edição e toggle de "Preview Mode"
- **FloatingSidebar**: Reestruturar com seções claramente delimitadas:
  - Seção "WHO IS SIGNING?" com header destacado e botão "+ Add"
  - Cards de signatário com layout refinado (avatar colorido, nome, email, indicador de "You")
  - Separador visual
  - Seção "DRAG & DROP FIELDS" com grid 2x2 de campos arrastáveis
  - Pro Tip visual sobre Shift+Select
  - Footer fixo com CTA "Review & Send" verde
- **Responsividade**: Garantir comportamento consistente mobile/desktop
- **Tipografia**: Aplicar hierarquia visual com labels uppercase para seções

### Página de Revisão (`/documentos/revisar/[uuid]`)

- **Layout Grid**: Reorganizar em 2 colunas consistentes com o padrão do editor
- **Card de Informações**: Consolidar dados do documento com visual mais limpo
- **Preview do PDF**: Manter proporção e alinhamento com editor
- **Lista de Signatários**: Usar mesmo padrão de cards da página de edição
- **Ações**: CTAs claros com hierarquia visual

### Componentes Compartilhados

- **SignerCard**: Padronizar visual com avatar colorido, iniciais, nome truncado e actions on-hover
- **FieldPaletteCard**: Grid 2x2 com ícones consistentes e descrições
- **ProTip Component**: Novo componente para dicas contextuais

## Impact

- Affected specs: `ui-components`
- Affected code:
  - `src/app/app/assinatura-digital/documentos/editar/[uuid]/client-page.tsx`
  - `src/app/app/assinatura-digital/documentos/editar/[uuid]/components/editor-page-layout.tsx`
  - `src/app/app/assinatura-digital/documentos/revisar/[uuid]/client-page.tsx`
  - `src/app/app/assinatura-digital/feature/components/editor/FloatingSidebar.tsx`
  - `src/app/app/assinatura-digital/feature/components/editor/components/SignerCard.tsx`
  - Componentes de palette e toolbar

## Reference

**Protótipo de Referência:**
- Canvas com documento PDF à esquerda
- Painel "Document Setup" à direita com:
  - Subtítulo "Configure signers and fields"
  - Seção "WHO IS SIGNING?" com cards de signatários
  - Seção "DRAG & DROP FIELDS" em grid 2x2
  - Pro Tip com ícone laranja
  - Botão "Review & Send" verde com seta

**Princípios de Design:**
- Hierarquia visual clara com labels uppercase
- Cores de signatários consistentes (background do avatar)
- Espaçamento consistente (p-6, gap-4)
- CTAs primários em verde (#059669)
