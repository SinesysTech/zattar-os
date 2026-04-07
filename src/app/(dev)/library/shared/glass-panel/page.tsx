import { GlassPanel, WidgetContainer } from '@/components/shared/glass-panel'
import { BarChart3 } from 'lucide-react'
import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
  DemoLabel,
  UsageInProduction,
} from '../../_components/demo-section'

export default function GlassPanelPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Shared"
        title="GlassPanel"
        description="Container com efeito glassmorphism em 3 níveis de profundidade. Estilos automáticos light/dark via globals.css (.glass-widget, .glass-kpi). Usado em widgets do dashboard, cards de KPI e CTAs primárias."
      />

      <DemoSection
        title="Depth levels"
        description="depth=1 → glass-widget (transparente, ambiente) · depth=2 → glass-kpi (mais opaco, métricas) · depth=3 → primary tint (CTA destacada)"
      >
        <div className="space-y-4">
          <div>
            <DemoLabel>depth=1 — glass-widget</DemoLabel>
            <GlassPanel depth={1} className="p-6">
              <p className="text-sm">Widget container — fundo translúcido para criar atmosfera</p>
            </GlassPanel>
          </div>
          <div>
            <DemoLabel>depth=2 — glass-kpi</DemoLabel>
            <GlassPanel depth={2} className="p-6">
              <p className="text-sm">KPI card — mais opaco para legibilidade de métricas</p>
            </GlassPanel>
          </div>
          <div>
            <DemoLabel>depth=3 — primary tint</DemoLabel>
            <GlassPanel depth={3} className="p-6">
              <p className="text-sm">Destaque máximo — usado em CTAs e cards de auth</p>
            </GlassPanel>
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="WidgetContainer (header padrão)"
        description="GlassPanel + header com title/icon/subtitle/action. Usado por todos os widgets do dashboard."
      >
        <DemoCanvas>
          <WidgetContainer
            title="Métricas do mês"
            icon={BarChart3}
            subtitle="Acompanhamento financeiro"
          >
            <div className="text-2xl font-bold">R$ 124.350</div>
            <p className="mt-1 text-xs text-muted-foreground">+12% vs. mês anterior</p>
          </WidgetContainer>
        </DemoCanvas>
      </DemoSection>

      <UsageInProduction
        sites={[
          {
            file: 'src/app/portal/feature/components/hero/cpf-hero-form.tsx',
            line: 39,
            snippet: '<GlassPanel depth={3} className="relative w-full overflow-hidden p-8 shadow-2xl">',
            note: 'Login do portal — depth=3 para destaque primário sobre AmbientBackdrop.',
          },
          {
            file: 'src/components/auth/v2/auth-layout.tsx',
            line: 27,
            snippet: '<GlassPanel className="px-8 py-10 sm:px-10 sm:py-12 w-full">',
            note: 'Login interno — depth padrão (1), wrapper do form de login.',
          },
        ]}
      />
    </div>
  )
}
