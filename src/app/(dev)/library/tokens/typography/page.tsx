import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
} from '../../_components/demo-section'

export default function TypographyPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Tokens"
        title="Tipografia"
        description="3 famílias tipográficas: Inter (sans/body/labels), Montserrat (heading/display/KPIs), Manrope (headline para AI/chat)."
      />

      <DemoSection title="Famílias">
        <div className="space-y-6">
          <DemoCanvas>
            <p className="mb-2 text-[11px] font-mono uppercase text-muted-foreground">font-sans · Inter</p>
            <p className="font-sans text-2xl">The quick brown fox jumps over the lazy dog</p>
            <p className="mt-1 text-xs text-muted-foreground">Body text, labels, inputs, badges</p>
          </DemoCanvas>
          <DemoCanvas>
            <p className="mb-2 text-[11px] font-mono uppercase text-muted-foreground">font-heading / font-display · Montserrat</p>
            <p className="font-heading text-3xl font-bold tracking-tight">The quick brown fox jumps over</p>
            <p className="mt-1 text-xs text-muted-foreground">Page titles, KPIs grandes, métricas</p>
          </DemoCanvas>
          <DemoCanvas>
            <p className="mb-2 text-[11px] font-mono uppercase text-muted-foreground">font-headline · Manrope</p>
            <p className="font-headline text-3xl font-bold tracking-tight">The quick brown fox jumps over</p>
            <p className="mt-1 text-xs text-muted-foreground">Magistrate AI, chat, headlines de feature</p>
          </DemoCanvas>
        </div>
      </DemoSection>

      <DemoSection title="Aliases utilitários">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li><code>font-sans</code> = Inter (default)</li>
          <li><code>font-heading</code> = Montserrat</li>
          <li><code>font-display</code> = Montserrat (alias de heading)</li>
          <li><code>font-headline</code> = Manrope</li>
          <li><code>font-body</code> = Inter (alias de sans)</li>
          <li><code>font-label</code> = Inter (alias de sans)</li>
          <li><code>font-mono</code> = Geist Mono</li>
        </ul>
      </DemoSection>
    </div>
  )
}
