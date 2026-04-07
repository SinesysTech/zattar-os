'use client'

import { useState } from 'react'
import { type SemanticTone } from '@/lib/design-system'
import {
  DemoPageHeader,
  DemoSection,
} from '../../_components/demo-section'

/**
 * Visual Diff Harness
 * ============================================================================
 * Página de comparação lado-a-lado: cores Tailwind cruas (antes do batch
 * sweep) vs tokens semânticos (depois). Permite o usuário inspecionar
 * visualmente cada conversão para validar que o resultado é equivalente
 * ou melhor.
 *
 * Como usar:
 *   1. Abrir esta página em /library/visual-diff/widgets
 *   2. Toggle light/dark
 *   3. Para cada par, verificar se "depois" é aceitável
 *   4. Anotar discrepâncias para revisão manual
 * ============================================================================
 */

interface DiffPair {
  tone: SemanticTone | 'gray-bg' | 'gray-text'
  label: string
  /** Classe Tailwind original (que existia antes do batch) */
  before: {
    bg: string
    text: string
    border: string
  }
  /** Classe semântica nova (depois do batch) */
  after: {
    bg: string
    text: string
    border: string
  }
  context: string
}

const PAIRS: DiffPair[] = [
  {
    tone: 'success',
    label: 'Success (verde)',
    before: { bg: 'bg-emerald-500/15', text: 'text-emerald-700', border: 'border-emerald-500/30' },
    after: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/30' },
    context: 'Status "Pago", "Concluído", confirmações',
  },
  {
    tone: 'info',
    label: 'Info (azul)',
    before: { bg: 'bg-sky-500/15', text: 'text-sky-700', border: 'border-sky-500/30' },
    after: { bg: 'bg-info/15', text: 'text-info', border: 'border-info/30' },
    context: 'Tags informativas, "Em análise"',
  },
  {
    tone: 'primary',
    label: 'Primary (roxo brand)',
    before: { bg: 'bg-violet-500/15', text: 'text-violet-700', border: 'border-violet-500/30' },
    after: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
    context: 'CTAs, links, foco, brand',
  },
  {
    tone: 'accent',
    label: 'Accent',
    before: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    after: { bg: 'bg-accent', text: 'text-accent-foreground', border: 'border-accent' },
    context: 'Hovers, accents secundários',
  },
  {
    tone: 'warning',
    label: 'Warning (âmbar)',
    before: { bg: 'bg-orange-500/15', text: 'text-orange-700', border: 'border-orange-500/30' },
    after: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/30' },
    context: '"Pendente", "Suspenso", atenção',
  },
  {
    tone: 'destructive',
    label: 'Destructive (vermelho)',
    before: { bg: 'bg-red-500/15', text: 'text-red-700', border: 'border-red-500/30' },
    after: { bg: 'bg-destructive/15', text: 'text-destructive', border: 'border-destructive/30' },
    context: 'Erros, "Atrasado", "Cancelado"',
  },
  {
    tone: 'neutral',
    label: 'Neutral',
    before: { bg: 'bg-zinc-500/10', text: 'text-zinc-700', border: 'border-zinc-500/20' },
    after: { bg: 'bg-muted/60', text: 'text-muted-foreground', border: 'border-border' },
    context: '"Arquivado", labels secundários',
  },
  {
    tone: 'chart-1',
    label: 'Chart 1',
    before: { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-500' },
    after: { bg: 'bg-chart-1', text: 'text-primary-foreground', border: 'border-chart-1' },
    context: 'Primeira série de gráfico categórico',
  },
  {
    tone: 'chart-2',
    label: 'Chart 2',
    before: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500' },
    after: { bg: 'bg-chart-2', text: 'text-white', border: 'border-chart-2' },
    context: 'Segunda série / highlight',
  },
  {
    tone: 'chart-3',
    label: 'Chart 3',
    before: { bg: 'bg-zinc-300', text: 'text-zinc-900', border: 'border-zinc-300' },
    after: { bg: 'bg-chart-3', text: 'text-foreground', border: 'border-chart-3' },
    context: 'Terceira série / neutra',
  },
  {
    tone: 'chart-4',
    label: 'Chart 4',
    before: { bg: 'bg-green-600', text: 'text-white', border: 'border-green-600' },
    after: { bg: 'bg-chart-4', text: 'text-white', border: 'border-chart-4' },
    context: 'Quarta série / verde alternativo',
  },
  {
    tone: 'chart-5',
    label: 'Chart 5',
    before: { bg: 'bg-zinc-400', text: 'text-white', border: 'border-zinc-400' },
    after: { bg: 'bg-chart-5', text: 'text-foreground', border: 'border-chart-5' },
    context: 'Quinta série / "Outros"',
  },
]

function PairCard({ pair, mode }: { pair: DiffPair; mode: 'light' | 'dark' }) {
  const wrapperClass =
    mode === 'dark' ? 'dark bg-surface text-on-surface' : 'bg-surface-container-low text-foreground'

  return (
    <div className={`rounded-xl border border-border p-6 ${wrapperClass}`}>
      <div className="mb-4">
        <h3 className="font-semibold">{pair.label}</h3>
        <p className="text-xs text-muted-foreground">{pair.context}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* ANTES */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-sm bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-destructive">
              Antes
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Tailwind cru</span>
          </div>
          <div
            className={`rounded-md border ${pair.before.bg} ${pair.before.text} ${pair.before.border} p-3`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{pair.label}</span>
              <span className="text-[10px]">42</span>
            </div>
          </div>
          <code className="mt-2 block font-mono text-[9px] text-muted-foreground">
            {pair.before.bg} {pair.before.text}
          </code>
        </div>

        {/* DEPOIS */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-sm bg-success/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-success">
              Depois
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Token</span>
          </div>
          <div
            className={`rounded-md border ${pair.after.bg} ${pair.after.text} ${pair.after.border} p-3`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{pair.label}</span>
              <span className="text-[10px]">42</span>
            </div>
          </div>
          <code className="mt-2 block font-mono text-[9px] text-muted-foreground">
            {pair.after.bg} {pair.after.text}
          </code>
        </div>
      </div>
    </div>
  )
}

export default function VisualDiffWidgetsPage() {
  const [mode, setMode] = useState<'light' | 'dark' | 'both'>('both')

  return (
    <div>
      <DemoPageHeader
        eyebrow="Visual Diff"
        title="Widgets — Antes vs Depois"
        description="Comparação lado a lado de cada conversão de cor feita pelo batch sweep. Use para validar visualmente que os tokens semânticos produzem resultado equivalente ou melhor que as classes Tailwind originais."
      >
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setMode('light')}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'light'
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border hover:bg-accent'
            }`}
          >
            Light only
          </button>
          <button
            onClick={() => setMode('dark')}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'dark'
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border hover:bg-accent'
            }`}
          >
            Dark only
          </button>
          <button
            onClick={() => setMode('both')}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'both'
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border hover:bg-accent'
            }`}
          >
            Both (side-by-side)
          </button>
        </div>
      </DemoPageHeader>

      <DemoSection
        title="12 conversões principais"
        description={
          mode === 'both'
            ? 'Cada par mostrado em light (cima) e dark (baixo). Verifique se o "depois" é aceitável em ambos.'
            : `Renderizado em ${mode} mode.`
        }
      >
        <div className="space-y-6">
          {PAIRS.map((pair) => (
            <div key={pair.tone}>
              {(mode === 'light' || mode === 'both') && <PairCard pair={pair} mode="light" />}
              {(mode === 'dark' || mode === 'both') && (
                <div className={mode === 'both' ? 'mt-3' : ''}>
                  <PairCard pair={pair} mode="dark" />
                </div>
              )}
            </div>
          ))}
        </div>
      </DemoSection>

      <DemoSection title="Como usar este harness para revisão">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Toggle light/dark</strong>: alguns tokens podem
            parecer corretos em light mas perder contraste em dark, ou vice-versa.
          </li>
          <li>
            <strong className="text-foreground">Verificar contraste de texto</strong>: o texto deve
            ser legível sobre o background em ambos os modos.
          </li>
          <li>
            <strong className="text-foreground">Comparar saturação</strong>: tokens OKLCH são
            perceptualmente mais uniformes que Tailwind. É esperado que pareçam{' '}
            <em>levemente diferentes</em> — isso é correto.
          </li>
          <li>
            <strong className="text-foreground">Anotar discrepâncias graves</strong>: se um par
            ficar visivelmente errado (ex: texto ilegível, cor totalmente diferente da intenção
            original), reportar para ajuste fino do token em globals.css.
          </li>
        </ul>
      </DemoSection>

      <DemoSection title="Próximos passos da revisão visual">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            Após validar este harness, abrir <code>/dashboard</code> em produção e comparar com{' '}
            <code>/dashboard/mock</code>.
          </li>
          <li>
            Abrir <code>/portal/dashboard</code> e validar widgets do portal do cliente.
          </li>
          <li>
            Conferir{' '}
            <a href="/library/domain-mocks" className="text-primary underline">
              /library/domain-mocks
            </a>{' '}
            para a lista completa de mocks navegáveis.
          </li>
        </ul>
      </DemoSection>
    </div>
  )
}
