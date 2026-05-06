'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Heading, Text } from '@/components/ui/typography'

/**
 * PageShell — Container canônico de página, padrão shadcn/ui.
 *
 * Forma canônica (composition pattern):
 *
 * ```tsx
 * <PageShell>
 *   <PageHeader>
 *     <PageHeaderBadge><Badge>Beta</Badge></PageHeaderBadge>
 *     <PageHeaderTitle>Processos</PageHeaderTitle>
 *     <PageHeaderDescription>Lista de processos do escritório</PageHeaderDescription>
 *     <PageHeaderAction>
 *       <Button size="sm" className="rounded-xl">Novo</Button>
 *     </PageHeaderAction>
 *   </PageHeader>
 *
 *   <PageContent>
 *     <DataShell>...</DataShell>
 *   </PageContent>
 * </PageShell>
 * ```
 *
 * Convenções shadcn aplicadas:
 * - `data-slot` em cada subcomponente (CSS scoping via `has-data-[slot=...]`)
 * - Container query `@container/page-header` para responsividade interna
 * - Grid layout com slots opcionais (igual `CardHeader`)
 * - Tags semânticas: `<main>`, `<header>`, `<h1>`, `<p>`
 * - Tipografia consome tokens do design system (`text-page-title`, `text-caption`)
 *
 * Tipografia mora dentro dos subcomponentes. Container nunca dita estilo do
 * conteúdo — `PageShell` é puramente layout.
 */
function PageShell({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot="page-shell"
      className={cn('flex flex-1 flex-col gap-6', className)}
      {...props}
    />
  )
}

/**
 * Cabeçalho de página. Renderiza um landmark `<header>` com layout em grid.
 * Detecta automaticamente slots opcionais (`PageHeaderAction`,
 * `PageHeaderDescription`, `PageHeaderBadge`) via `has-data-[slot=...]`.
 */
function PageHeader({ className, ...props }: React.ComponentProps<'header'>) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        '@container/page-header grid auto-rows-min items-start gap-1.5',
        'has-data-[slot=page-header-action]:grid-cols-[1fr_auto]',
        'has-data-[slot=page-header-description]:grid-rows-[auto_auto]',
        'has-data-[slot=page-header-badge]:has-data-[slot=page-header-description]:grid-rows-[auto_auto_auto]',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Badge contextual acima do título (Beta, Pro, Pendente, etc.).
 * Posicionado na primeira linha do grid, com gap pequeno até o título.
 */
function PageHeaderBadge({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-badge"
      className={cn('col-start-1 mb-1 flex items-center', className)}
      {...props}
    />
  )
}

/**
 * Título principal da página. Renderiza `<h1>` com token `text-page-title`
 * (24px, font-heading, font-bold). Apenas um por página, conforme
 * convenção de acessibilidade.
 */
function PageHeaderTitle({
  className,
  children,
  ...props
}: React.ComponentProps<'h1'>) {
  return (
    <Heading
      level="page"
      data-slot="page-header-title"
      className={cn('col-start-1', className)}
      {...props}
    >
      {children}
    </Heading>
  )
}

/**
 * Subtítulo descritivo da página. Renderiza `<p>` com token `text-caption`
 * (13px, text-muted-foreground). Use com moderação — apenas quando a página
 * exige contexto explicativo que não cabe no título.
 */
function PageHeaderDescription({
  className,
  children,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <Text
      variant="caption"
      data-slot="page-header-description"
      className={cn('col-start-1 mt-0.5', className)}
      {...props}
    >
      {children}
    </Text>
  )
}

/**
 * Slot de ações primárias do cabeçalho (botões "Novo X", filtros, exports).
 * Posicionado na coluna 2, alinhado à direita. Empilha verticalmente em
 * telas estreitas via container query.
 */
function PageHeaderAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-action"
      className={cn(
        'col-start-2 row-span-full row-start-1 self-start justify-self-end',
        'flex shrink-0 items-center gap-2',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Container do conteúdo principal da página, abaixo do `<PageHeader>`.
 * Aplica `space-y-4` por padrão para empilhamento consistente entre seções.
 */
function PageContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-content"
      className={cn('space-y-4', className)}
      {...props}
    />
  )
}

export {
  PageShell,
  PageHeader,
  PageHeaderBadge,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderAction,
  PageContent,
}
