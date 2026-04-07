import {
  type SemanticTone,
  tokenForTone,
  bgClassForTone,
  textClassForTone,
} from '@/lib/design-system'
import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
  DemoLabel,
  UsageInProduction,
} from '../../_components/demo-section'

interface ToneSpec {
  tone: SemanticTone
  label: string
  meaning: string
  whenToUse: string
}

const TONE_SPECS: ToneSpec[] = [
  {
    tone: 'success',
    label: 'Success',
    meaning: 'Positivo, concluído, saudável, validado',
    whenToUse: 'Status "Pago", "Ativo", "Concluído", confirmações, métricas crescentes positivas',
  },
  {
    tone: 'info',
    label: 'Info',
    meaning: 'Informação, neutro positivo, ação não-urgente',
    whenToUse: 'Tags informativas, badges de tipo neutro, dicas, status "Em análise"',
  },
  {
    tone: 'primary',
    label: 'Primary',
    meaning: 'Brand Zattar, destaque principal, ação primária',
    whenToUse: 'CTAs primárias, links, foco, métricas brand, contratos ativos',
  },
  {
    tone: 'accent',
    label: 'Accent',
    meaning: 'Complementar, hover states, destaque secundário',
    whenToUse: 'Hovers, accents de UI, fundo de seções selecionadas',
  },
  {
    tone: 'warning',
    label: 'Warning',
    meaning: 'Atenção, pendente, aviso não-fatal',
    whenToUse: 'Status "Pendente", "Suspenso", expedientes próximos do prazo, ações com cautela',
  },
  {
    tone: 'destructive',
    label: 'Destructive',
    meaning: 'Erro, perigo, crítico, atrasado',
    whenToUse: 'Erros, "Atrasado", "Cancelado", deletar, validação falha, contas em atraso',
  },
  {
    tone: 'neutral',
    label: 'Neutral',
    meaning: 'Inativo, arquivado, muted, sem significado especial',
    whenToUse: 'Status "Arquivado", "Encerrado", labels secundários, contadores',
  },
  {
    tone: 'chart-1',
    label: 'Chart 1',
    meaning: 'Categórico — sem significado inerente, primeira cor da paleta',
    whenToUse: 'Gráficos categóricos, primeira série de dados, segmento principal',
  },
  {
    tone: 'chart-2',
    label: 'Chart 2',
    meaning: 'Categórico — segunda cor da paleta',
    whenToUse: 'Segunda série de dados em gráficos comparativos',
  },
  {
    tone: 'chart-3',
    label: 'Chart 3',
    meaning: 'Categórico — terceira cor da paleta',
    whenToUse: 'Terceira série de dados',
  },
  {
    tone: 'chart-4',
    label: 'Chart 4',
    meaning: 'Categórico — quarta cor da paleta',
    whenToUse: 'Quarta série de dados, segmentos minoritários',
  },
  {
    tone: 'chart-5',
    label: 'Chart 5',
    meaning: 'Categórico — quinta cor da paleta',
    whenToUse: 'Quinta série de dados, "Outros"/catch-all',
  },
]

export default function SemanticTonesPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Tokens"
        title="Semantic Tones"
        description="API de alto nível para representar tons de UI sem carregar cor literal. Domain/repository layers retornam SemanticTone, UI consome via tokenForTone(). Permite trocar paleta inteira em 1 lugar e mantém light/dark automático."
      />

      <DemoSection
        title="Por quê existe"
        description="Antes desta refatoração, repositories como dashboard/repositories/processos-metrics.ts retornavam color: 'oklch(...)' diretamente. Isso acoplava o domain layer ao design system. Agora retornam tone: SemanticTone e a UI resolve via helper."
      >
        <DemoCanvas>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code>{`// ❌ ANTES — repository carrega cor
return {
  status: 'Ativos',
  count: 42,
  color: 'oklch(0.55 0.18 145)',  // ← acoplamento errado
}

// ✅ DEPOIS — repository carrega significado
return {
  status: 'Ativos',
  count: 42,
  tone: 'success',  // ← UI decide a cor
}

// UI consome via helper:
import { tokenForTone } from '@/lib/design-system'
<Cell fill={tokenForTone(item.tone)} />`}</code>
          </pre>
        </DemoCanvas>
      </DemoSection>

      <DemoSection
        title="Catálogo dos 12 tons"
        description="Cada tom tem significado semântico fixo. Ordem do mais positivo (success) ao mais negativo (destructive), seguido de neutral e categóricos chart-1..5."
      >
        <div className="space-y-3">
          {TONE_SPECS.map((spec) => {
            const cssVar = tokenForTone(spec.tone)
            return (
              <div
                key={spec.tone}
                className="flex items-start gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div
                  className="mt-0.5 size-12 shrink-0 rounded-md border border-border shadow-sm"
                  style={{ backgroundColor: cssVar }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-semibold">{spec.label}</h3>
                    <code className="font-mono text-[10px] text-muted-foreground">
                      {spec.tone}
                    </code>
                    <code className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {cssVar}
                    </code>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <strong className="text-foreground">Significado:</strong>{' '}
                    {spec.meaning}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <strong className="text-foreground">Quando usar:</strong>{' '}
                    {spec.whenToUse}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </DemoSection>

      <DemoSection
        title="API completa"
        description="3 funções helper. Use a forma mais conveniente para o contexto."
      >
        <div className="space-y-4">
          <DemoCanvas>
            <DemoLabel>tokenForTone — para inline style / SVG / chart libs</DemoLabel>
            <pre className="overflow-x-auto text-xs leading-relaxed">
              <code>{`import { tokenForTone } from '@/lib/design-system'

// Em <Cell> do Recharts (SVG)
<Cell fill={tokenForTone('warning')} />

// Em inline style
<div style={{ backgroundColor: tokenForTone(tone) }} />

// Em CSS-in-JS
const styles = { color: tokenForTone('destructive') }`}</code>
            </pre>
          </DemoCanvas>

          <DemoCanvas>
            <DemoLabel>bgClassForTone — para className Tailwind (background)</DemoLabel>
            <pre className="overflow-x-auto text-xs leading-relaxed">
              <code>{`import { bgClassForTone } from '@/lib/design-system'

<div className={bgClassForTone('success')}>
  // resolve para "bg-success"
</div>

// Combinando com outras classes
<div className={cn(bgClassForTone(tone), 'rounded-md p-2')} />`}</code>
            </pre>
          </DemoCanvas>

          <DemoCanvas>
            <DemoLabel>textClassForTone — para className Tailwind (text)</DemoLabel>
            <pre className="overflow-x-auto text-xs leading-relaxed">
              <code>{`import { textClassForTone } from '@/lib/design-system'

<span className={textClassForTone('warning')}>
  // resolve para "text-warning"
</span>`}</code>
            </pre>
          </DemoCanvas>
        </div>
      </DemoSection>

      <DemoSection
        title="Demo: bgClassForTone vs textClassForTone"
        description="Helpers Tailwind aplicados em Badge-like elements."
      >
        <DemoCanvas className="flex flex-wrap gap-3">
          {TONE_SPECS.slice(0, 7).map((spec) => (
            <div
              key={spec.tone}
              className={`inline-flex items-center gap-2 rounded-md border border-border px-3 py-1 ${bgClassForTone(spec.tone)}/15 ${textClassForTone(spec.tone)}`}
            >
              <span className={`size-2 rounded-full ${bgClassForTone(spec.tone)}`} />
              <span className="text-xs font-medium">{spec.label}</span>
            </div>
          ))}
        </DemoCanvas>
      </DemoSection>

      <UsageInProduction
        sites={[
          {
            file: 'src/app/(authenticated)/dashboard/repositories/processos-metrics.ts',
            line: 20,
            snippet: `const STATUS_TONES: Record<string, SemanticTone> = {
  'Ativos': 'success',
  'Suspensos': 'warning',
  'Arquivados': 'neutral',
  'Em Recurso': 'info',
}

// no retorno do query:
const porStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
  status,
  count,
  tone: STATUS_TONES[status] ?? 'neutral' as SemanticTone,
}))`,
            note: 'Single source of truth do mapeamento status → tom. Trocar a paleta inteira = editar este map.',
          },
          {
            file: 'src/app/(authenticated)/dashboard/widgets/processos/aging.tsx',
            line: 62,
            snippet: `const segments = aging.map((a) => ({
  value: a.count,
  color: tokenForTone(a.tone),  // ← UI resolve aqui
  label: a.faixa,
  tone: a.tone,
}))

<StackedBar segments={segments} />
<span style={{ backgroundColor: tokenForTone(seg.tone) }} />`,
            note: 'Widget consome o tom via tokenForTone. Mesmo tom é usado em SVG (StackedBar) e inline style (legend dot).',
          },
          {
            file: 'src/app/(authenticated)/dashboard/repositories/financeiro-metrics.ts',
            line: 144,
            snippet: `const AGING_TONES: Record<string, SemanticTone> = {
  avencer: 'success',
  ate30: 'chart-4',     // ← amarelo neutro, sem alarme
  '30_60': 'warning',   // ← atenção
  '60_90': 'chart-2',   // ← intermediário
  '90mais': 'destructive', // ← crítico
}`,
            note: 'Aging usa progressão de tom para sinalizar risco crescente. Mistura de status semânticos (success/warning/destructive) com chart-N para gradações intermediárias.',
          },
        ]}
      />

      <DemoSection title="Quando NÃO usar SemanticTone">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Brand assets fixos</strong> — logo, splash. Use o asset diretamente.
          </li>
          <li>
            <strong className="text-foreground">Cores customizadas pelo usuário</strong> (tags, labels, eventos) — use{' '}
            <code className="rounded bg-muted px-1 py-0.5">--palette-1..18</code> ou{' '}
            <code className="rounded bg-muted px-1 py-0.5">--event-*</code>.
          </li>
          <li>
            <strong className="text-foreground">Decoração pura sem significado</strong> — use{' '}
            <code className="rounded bg-muted px-1 py-0.5">--chart-1..5</code> direto, sem passar pelo helper.
          </li>
          <li>
            <strong className="text-foreground">Quando a UI já tem o tom no escopo</strong> e a string é mais legível —
            ex: <code className="rounded bg-muted px-1 py-0.5">{'<Badge variant="success">'}</code> em vez de{' '}
            <code className="rounded bg-muted px-1 py-0.5">{'<Badge variant={someTone}>'}</code>.
          </li>
        </ul>
      </DemoSection>

      <DemoSection title="ESLint enforcement">
        <DemoCanvas>
          <p className="text-sm text-muted-foreground">
            Repositories que carregam <code className="rounded bg-muted px-1 py-0.5">color: string</code>{' '}
            (literal OKLCH/hex/Tailwind cru) disparam <strong className="text-foreground">error</strong> na regra{' '}
            <code className="rounded bg-muted px-1 py-0.5">no-restricted-syntax</code>. Use{' '}
            <code className="rounded bg-muted px-1 py-0.5">tone: SemanticTone</code> e deixe a UI resolver.
          </p>
        </DemoCanvas>
      </DemoSection>
    </div>
  )
}
