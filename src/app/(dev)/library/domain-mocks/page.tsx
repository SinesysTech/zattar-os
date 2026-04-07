import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import {
  DemoPageHeader,
  DemoSection,
} from '../_components/demo-section'

interface MockEntry {
  href: string
  module: string
  description: string
  files: number
}

const MOCKS: MockEntry[] = [
  {
    href: '/agenda/mock',
    module: 'Agenda',
    description: 'Calendário com 5 fontes de evento (audiências, expedientes, obrigações, perícias, agenda) e helpers de cor/ícone/formatação. Usa getEventColorClasses do design system.',
    files: 2,
  },
  {
    href: '/audiencias/mock',
    module: 'Audiências',
    description: 'Lista de audiências com modalidades (presencial/virtual/híbrida), status, prep score e KPI strips.',
    files: 2,
  },
  {
    href: '/contratos/mock',
    module: 'Contratos',
    description: 'Cards de contrato com obrigações, kanban de status, financial strip e ContratoTagsCard.',
    files: 1,
  },
  {
    href: '/partes/mock',
    module: 'Partes',
    description: 'Lista de partes processuais (autores, réus, terceiros, peritos, testemunhas) com badges de polo e tipo.',
    files: 1,
  },
  {
    href: '/assinatura-digital/mock',
    module: 'Assinatura Digital',
    description: 'Fluxo de assinatura digital com documentos, cards, stats strip e histórico.',
    files: 1,
  },
  {
    href: '/dashboard/mock',
    module: 'Dashboard (completo)',
    description: 'Dashboard executivo com 8 sections (financeiro, contratos, expedientes, pessoal, audiências, processos, primitivas, command-hub) e widgets de KPI.',
    files: 11,
  },
]

export default function DomainMocksPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Domain Mocks"
        title="Páginas mock por módulo"
        description="17 rotas Next.js sob src/app/(authenticated)/*/mock/ — playground visual para cada módulo do app, povoado com dados realistas. Usadas como sandbox durante desenvolvimento de features."
      />

      <DemoSection
        title="Mocks disponíveis"
        description="Cada mock é uma rota navegável. Já estão indexadas para descoberta rápida."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {MOCKS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:bg-accent"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-headline text-base font-semibold">
                  {m.module}
                </h3>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {m.description}
              </p>
              <div className="mt-auto flex items-center justify-between pt-2 text-[10px] font-mono text-muted-foreground">
                <code>{m.href}</code>
                <span>{m.files} {m.files === 1 ? 'arquivo' : 'arquivos'}</span>
              </div>
            </Link>
          ))}
        </div>
      </DemoSection>

      <DemoSection title="Política de mocks">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            Mocks vivem em <code>src/app/(authenticated)/{'{módulo}'}/mock/</code> e
            são rotas Next.js normais — não vão pro build de produção via{' '}
            <code>globalIgnores</code> futuramente.
          </li>
          <li>
            <strong className="text-foreground">Cores</strong> nos mocks devem usar
            tokens (<code>var(--*)</code>) sempre que possível. A pasta{' '}
            <code>**/mock/**</code> está nas exclusões da regra ESLint, mas isso é
            um <em>shield</em>, não um convite para hardcoding.
          </li>
          <li>
            Quando uma section de mock precisar de uma cor decorativa específica,
            prefira <code>var(--palette-N)</code> ou <code>var(--chart-N)</code>.
          </li>
          <li>
            <strong className="text-foreground">Não use mocks como fixtures de
            teste.</strong> Para tests, use <code>src/testing/mocks/</code>.
          </li>
        </ul>
      </DemoSection>
    </div>
  )
}
