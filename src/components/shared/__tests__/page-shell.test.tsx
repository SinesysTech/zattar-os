/**
 * Tests — PageShell (shadcn composition pattern + legacy API)
 *
 * Valida o componente sob dois contratos:
 *  1. Forma canônica (subcomponentes compostos)
 *  2. API legada (props title/description/actions/badge — deprecated)
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
  // Forma canônica (subcomponentes)
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

    test('all slots compose without auto-generated header', () => {
      const { container } = render(
        <PageShell>
          <PageHeader>
            <PageHeaderTitle>X</PageHeaderTitle>
          </PageHeader>
          <PageContent>Y</PageContent>
        </PageShell>,
      )
      // Apenas um header (o explícito do consumidor), sem header automático
      const headers = container.querySelectorAll('[data-slot="page-header"]')
      expect(headers).toHaveLength(1)
    })
  })

  // ──────────────────────────────────────────────────────────────────
  // API legada (deprecated, preservada até migração completa)
  // ──────────────────────────────────────────────────────────────────

  describe('legacy API (deprecated)', () => {
    test('renders title via prop using <h1> with token', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{2,49}$/),
          (title) => {
            const { container } = render(
              <PageShell title={title}>
                <div>conteúdo</div>
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

    test('renders description via prop using <p> with token', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{9,99}$/),
          (description) => {
            const { container } = render(
              <PageShell title="Título" description={description}>
                <div>conteúdo</div>
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

    test('renders actions via prop in PageHeaderAction slot', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5 }), (numButtons) => {
          const buttons = Array.from({ length: numButtons }, (_, i) => (
            <button key={i} type="button">
              Action {i + 1}
            </button>
          ))

          const { container } = render(
            <PageShell title="Título" actions={<>{buttons}</>}>
              <div>conteúdo</div>
            </PageShell>,
          )

          const action = container.querySelector('[data-slot="page-header-action"]')
          expect(action).toBeInTheDocument()
          expect(action?.querySelectorAll('button')).toHaveLength(numButtons)
        }),
        { numRuns: 10 },
      )
    })

    test('renders badge via prop in PageHeaderBadge slot', () => {
      const { container } = render(
        <PageShell
          title="Título"
          badge={<span data-testid="b">Beta</span>}
        >
          <div>conteúdo</div>
        </PageShell>,
      )
      const badge = container.querySelector('[data-slot="page-header-badge"]')
      expect(badge?.querySelector('[data-testid="b"]')).toBeInTheDocument()
    })

    test('wraps children in PageContent when legacy props are used', () => {
      const { container } = render(
        <PageShell title="Título">
          <div data-testid="child">child</div>
        </PageShell>,
      )
      const content = container.querySelector('[data-slot="page-content"]')
      expect(content).toBeInTheDocument()
      expect(content?.querySelector('[data-testid="child"]')).toBeInTheDocument()
    })

    test('without legacy props, children render directly without auto-wrap', () => {
      const { container } = render(
        <PageShell>
          <div data-testid="raw-child">raw</div>
        </PageShell>,
      )
      // Sem legacy props, não cria PageHeader nem PageContent automáticos
      expect(container.querySelector('[data-slot="page-header"]')).toBeNull()
      expect(container.querySelector('[data-slot="page-content"]')).toBeNull()
      expect(container.querySelector('[data-testid="raw-child"]')).toBeInTheDocument()
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
