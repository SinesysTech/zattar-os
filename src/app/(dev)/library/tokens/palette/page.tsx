import {
  DemoPageHeader,
  DemoSection,
  DemoSwatch,
  DemoCanvas,
  UsageInProduction,
} from '../../_components/demo-section'

export default function PalettePage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Tokens"
        title="Paleta selecionável"
        description="18 cores derivadas em OKLCH com luminosidade perceptualmente uniforme. Usadas em pickers de tag, label e cor de evento. Definidas como --palette-1..18 em globals.css."
      />

      <DemoSection
        title="Swatches"
        description="Cada swatch é um token CSS variable independente. Lê var(--palette-N)."
      >
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
            <DemoSwatch
              key={n}
              token={`palette-${n}`}
              label={`Palette ${n}`}
            />
          ))}
        </div>
      </DemoSection>

      <DemoSection
        title="Como Tailwind utility"
        description="Os tokens estão expostos via @theme inline em globals.css, então funcionam como bg-palette-1, text-palette-5, border-palette-12 automaticamente."
      >
        <DemoCanvas>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                className={`flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs`}
              >
                <span className={`size-3 rounded-full bg-palette-${n}`} />
                <code className="font-mono text-[10px]">bg-palette-{n}</code>
              </div>
            ))}
          </div>
        </DemoCanvas>
      </DemoSection>

      <UsageInProduction
        sites={[
          {
            file: 'src/lib/domain/tags/domain.ts',
            line: 133,
            snippet: `export const TAG_COLORS = [
  { label: "Vermelho",  hex: "#ED4949", token: "--palette-1" },
  { label: "Laranja",   hex: "#ED7E40", token: "--palette-2" },
  // ... 16 mais
] as const;`,
            note: 'Single source of truth dos tokens de cor de tag. Banco armazena hex (legacy compat), UI consome via token.',
          },
          {
            file: 'src/app/(authenticated)/processos/components/processo-tags-dialog.tsx',
            snippet: `<button
  style={{ backgroundColor: \`var(\${color.token})\` }}
  onClick={() => setNewTagCor(color.hex)}
/>`,
            note: 'Picker de cor de tag — consome o token via inline style, sem mapping paralelo de classes.',
          },
          {
            file: 'src/app/(authenticated)/notas/label-colors.ts',
            snippet: `export const AVAILABLE_LABEL_COLORS = Array.from(
  { length: 17 },
  (_, i) => \`bg-palette-\${i + 1}\`,
)`,
            note: 'Picker de cor de label — gerado dinamicamente a partir dos tokens.',
          },
        ]}
      />
    </div>
  )
}
