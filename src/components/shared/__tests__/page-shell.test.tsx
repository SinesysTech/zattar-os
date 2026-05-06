/**
 * Tests — PageShell (shadcn composition pattern)
 *
 * Valida o componente sob a API canônica composta. A API legada
 * (props `title`/`description`/`actions`/`badge`) foi removida após
 * migração completa dos consumidores.
 *
 * Foca em comportamento, semântica e acessibilidade. Evita asserts em
 * classes Tailwind específicas, que são frágeis a refator visual.
 */

import * as fc from 'fast-check'
import { render } from '@testing-library/react'
import {
  PageShell,
  PageHeader,
  PageHeaderBadge,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderAction,
  PageContent,
} from '@/components/shared/page-shell'
import {
  setViewport,
  COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers'

describe('PageShell', () => {
  beforeEach(() => {
    setViewport(COMMON_VIEWPORTS.desktop)
  })

  // ──────────────────────────────────────────────────────────────────
  // Slots e marcação semântica
  // ──────────────────────────────────────────────────────────────────

  describe('composition pattern', () => {
    test('renders <main> with data-slot="page-shell"', () => {
      const { container } = render(
        <PageShell>
          <PageContent>conteúdo</PageContent>
        </PageShell>,
      )
      const main = container.querySelector('main[data-slot="page-shell"]')
      expect(main).toBeInTheDocument()
    })

    test('renders <header> with data-slot="page-header"', () => {
      const { container } = render(
        <PageShell>
          <PageHeader>
            <PageHeaderTitle>Título</PageHeaderTitle>
          </PageHeader>
        </PageShell>,
      )
      const header = container.querySelector('header[data-slot="page-header"]')
      expect(header).toBeInTheDocument()
    })

    test('PageHeaderTitle renders <h1> with text-page-title token', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{2,49}$/),
          (title) => {
            const { container } = render(
              <PageShell>
                <PageHeader>
                  <PageHeaderTitle>{title}</PageHeaderTitle>
                </PageHeader>
              </PageShell>,
            )
            const h1 = container.querySelector('h1[data-slot="page-header-title"]')
            expect(h1).toBeInTheDocument()
            expect(h1).toHaveTextContent(title)
            expect(h1?.className).toMatch(/text-page-title/)
          },
        ),
        { numRuns: 10 },
      )
    })

    test('PageHeaderDescription renders <p> with text-caption token', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{9,99}$/),
          (description) => {
            const { container } = render(
              <PageShell>
                <PageHeader>
                  <PageHeaderTitle>Título</PageHeaderTitle>
                  <PageHeaderDescription>{description}</PageHeaderDescription>
                </PageHeader>
              </PageShell>,
            )
            const p = container.querySelector('p[data-slot="page-header-description"]')
            expect(p).toBeInTheDocument()
            expect(p).toHaveTextContent(description)
            expect(p?.className).toMatch(/text-caption/)
          },
        ),
        { numRuns: 10 },
      )
    })

    test('PageHeaderAction renders slot positioned in column 2', () => {
      const { container } = render(
        <PageShell>
          <PageHeader>
            <PageHeaderTitle>Título</PageHeaderTitle>
            <PageHeaderAction>
              <button type="button">Novo</button>
            </PageHeaderAction>
          </PageHeader>
        </PageShell>,
      )
      const action = container.querySelector('[data-slot="page-header-action"]')
      expect(action).toBeInTheDocument()
      expect(action?.className).toMatch(/col-start-2/)
      expect(action?.querySelector('button')).toBeInTheDocument()
    })

    test('PageHeaderBadge renders slot above title', () => {
      const { container } = render(
        <PageShell>
          <PageHeader>
            <PageHeaderBadge>
              <span data-testid="badge">Beta</span>
            </PageHeaderBadge>
            <PageHeaderTitle>Título</PageHeaderTitle>
          </PageHeader>
        </PageShell>,
      )
      const badge = container.querySelector('[data-slot="page-header-badge"]')
      expect(badge).toBeInTheDocument()
      expect(badge?.querySelector('[data-testid="badge"]')).toBeInTheDocument()
    })

    test('PageContent renders with data-slot="page-content"', () => {
      const { container } = render(
        <PageShell>
          <PageContent>
            <div data-testid="child">child</div>
          </PageContent>
        </PageShell>,
      )
      const content = container.querySelector('[data-slot="page-content"]')
      expect(content).toBeInTheDocument()
      expect(content?.querySelector('[data-testid="child"]')).toBeInTheDocument()
    })

    test('children render directly without auto-wrap when no header is used', () => {
      const { container } = render(
        <PageShell>
          <div data-testid="raw-child">raw</div>
        </PageShell>,
      )
      expect(container.querySelector('[data-slot="page-header"]')).toBeNull()
      expect(container.querySelector('[data-slot="page-content"]')).toBeNull()
      expect(container.querySelector('[data-testid="raw-child"]')).toBeInTheDocument()
    })

    test('full composition with all slots renders single header and single content', () => {
      const { container } = render(
        <PageShell>
          <PageHeader>
            <PageHeaderBadge>Badge</PageHeaderBadge>
            <PageHeaderTitle>Título</PageHeaderTitle>
            <PageHeaderDescription>Descrição</PageHeaderDescription>
            <PageHeaderAction>
              <button type="button">Ação</button>
            </PageHeaderAction>
          </PageHeader>
          <PageContent>
            <div>conteúdo</div>
          </PageContent>
        </PageShell>,
      )
      expect(container.querySelectorAll('[data-slot="page-header"]')).toHaveLength(1)
      expect(container.querySelectorAll('[data-slot="page-content"]')).toHaveLength(1)
    })
  })

  // ──────────────────────────────────────────────────────────────────
  // Acessibilidade
  // ──────────────────────────────────────────────────────────────────

  describe('accessibility', () => {
    test('PageShell uses <main> landmark', () => {
      const { container } = render(
        <PageShell>
          <PageContent>x</PageContent>
        </PageShell>,
      )
      expect(container.querySelector('main')).toBeInTheDocument()
    })

    test('PageHeader uses <header> landmark', () => {
      const { container } = render(
        <PageShell>
          <PageHeader>
            <PageHeaderTitle>X</PageHeaderTitle>
          </PageHeader>
        </PageShell>,
      )
      expect(container.querySelector('header')).toBeInTheDocument()
    })

    test('PageHeaderTitle is a single <h1> per page', () => {
      const { container } = render(
        <PageShell>
          <PageHeader>
            <PageHeaderTitle>Título</PageHeaderTitle>
          </PageHeader>
          <PageContent>conteúdo</PageContent>
        </PageShell>,
      )
      expect(container.querySelectorAll('h1')).toHaveLength(1)
    })

    test('forwards arbitrary HTML attributes (id, aria-*)', () => {
      const { container } = render(
        <PageShell id="test-page" aria-label="Página de teste">
          <PageContent>x</PageContent>
        </PageShell>,
      )
      const main = container.querySelector('main')
      expect(main).toHaveAttribute('id', 'test-page')
      expect(main).toHaveAttribute('aria-label', 'Página de teste')
    })
  })
})
