import { AmbientBackdrop } from '@/components/shared/ambient-backdrop'
import {
  DemoPageHeader,
  DemoSection,
  UsageInProduction,
} from '../../_components/demo-section'

export default function AmbientBackdropPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Shared"
        title="AmbientBackdrop"
        description="Background atmosférico reutilizável: dois blobs radiais (top-left + bottom-right) + grid pontilhado opcional + gradient base. Usa exclusivamente o token --primary — funciona em qualquer tema."
      />

      <DemoSection
        title="Demo no contexto do portal"
        description="O componente é position:fixed e cobre o viewport. Aqui está renderizado dentro de um container relative para visualização."
      >
        <div className="dark relative h-96 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="absolute inset-0">
            <AmbientBackdrop />
          </div>
          <div className="relative z-10 flex h-full items-center justify-center">
            <div className="rounded-xl border border-primary/20 bg-surface-container/80 px-8 py-6 backdrop-blur-md">
              <p className="text-center text-sm text-on-surface">
                Conteúdo sobre o backdrop
              </p>
            </div>
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Props"
        description="grid · baseGradient · blurIntensity · className"
      >
        <pre className="overflow-x-auto rounded-lg bg-surface-container-low p-4 text-xs">
          <code>{`<AmbientBackdrop />                              // default: grid + base gradient + intensity 20
<AmbientBackdrop grid={false} />                  // sem grid pontilhado
<AmbientBackdrop baseGradient={false} />          // sem gradiente vertical
<AmbientBackdrop blurIntensity={40} />            // mais intenso (0-100)`}</code>
        </pre>
      </DemoSection>

      <UsageInProduction
        sites={[
          {
            file: 'src/app/portal/page.tsx',
            line: 9,
            snippet: `<div className="dark">
  <div className="relative min-h-svh bg-surface text-on-surface ...">
    <AmbientBackdrop />
    <main className="relative z-10 ...">
      ...
    </main>
  </div>
</div>`,
            note: 'Login do portal — substituiu 16 linhas inline de markup por uma única tag.',
          },
        ]}
      />
    </div>
  )
}
