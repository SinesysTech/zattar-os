import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
} from '../../_components/demo-section'

export default function SpacingPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Tokens"
        title="Spacing & Radius"
        description="Escala de spacing baseada no padrão Tailwind 4px. Radius derivado de --radius (8px) para visual tech/sharp."
      />

      <DemoSection title="Radius">
        <DemoCanvas>
          <div className="flex flex-wrap items-end gap-4">
            {[
              { cls: 'rounded-sm', label: 'sm (4px)' },
              { cls: 'rounded-md', label: 'md (6px)' },
              { cls: 'rounded-lg', label: 'lg (8px) — base' },
              { cls: 'rounded-xl', label: 'xl (12px)' },
              { cls: 'rounded-2xl', label: '2xl (16px)' },
              { cls: 'rounded-full', label: 'full' },
            ].map((r) => (
              <div key={r.cls} className="flex flex-col items-center gap-1">
                <div className={`h-16 w-16 bg-primary ${r.cls}`} />
                <code className="text-[10px] text-muted-foreground">{r.label}</code>
              </div>
            ))}
          </div>
        </DemoCanvas>
      </DemoSection>

      <DemoSection title="Spacing scale">
        <DemoCanvas>
          <div className="space-y-1">
            {[1, 2, 3, 4, 6, 8, 12, 16, 24].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <code className="w-12 text-[10px] text-muted-foreground">p-{s}</code>
                <div className={`bg-primary h-3`} style={{ width: `${s * 4}px` }} />
                <span className="text-xs text-muted-foreground">{s * 4}px</span>
              </div>
            ))}
          </div>
        </DemoCanvas>
      </DemoSection>
    </div>
  )
}
