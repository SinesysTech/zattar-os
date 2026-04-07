import { Badge } from '@/components/ui/badge'
import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
  DemoLabel,
  UsageInProduction,
} from '../../_components/demo-section'

const VARIANTS = ['default', 'secondary', 'success', 'info', 'warning', 'destructive', 'neutral', 'accent', 'outline'] as const

export default function BadgesAllPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Badges"
        title="Catálogo de badges"
        description="Badge primitive + variantes (soft / solid) + 9 cores semânticas. Todos os tons usam tokens semânticos do design system — light/dark mode automáticos."
      />

      <DemoSection
        title="Tone: solid"
        description="Alta intensidade, fundo cheio. Use para chamar atenção primária."
      >
        <DemoCanvas className="flex flex-wrap gap-3">
          {VARIANTS.map((v) => (
            <Badge key={v} tone="solid" variant={v}>
              {v}
            </Badge>
          ))}
        </DemoCanvas>
      </DemoSection>

      <DemoSection
        title="Tone: soft"
        description="Baixa intensidade, fundo translúcido. Padrão recomendado para listas e tabelas."
      >
        <DemoCanvas className="flex flex-wrap gap-3">
          {VARIANTS.filter(v => v !== 'outline').map((v) => (
            <Badge key={v} tone="soft" variant={v}>
              {v}
            </Badge>
          ))}
        </DemoCanvas>
      </DemoSection>

      <DemoSection
        title="Combinações dark"
        description="Validar contraste em superfícies escuras."
      >
        <DemoCanvas background="dark" className="flex flex-wrap gap-3">
          <DemoLabel>solid</DemoLabel>
          <div className="flex w-full flex-wrap gap-3">
            {VARIANTS.map((v) => (
              <Badge key={v} tone="solid" variant={v}>{v}</Badge>
            ))}
          </div>
          <DemoLabel>soft</DemoLabel>
          <div className="flex w-full flex-wrap gap-3">
            {VARIANTS.filter(v => v !== 'outline').map((v) => (
              <Badge key={v} tone="soft" variant={v}>{v}</Badge>
            ))}
          </div>
        </DemoCanvas>
      </DemoSection>

      <DemoSection
        title="Wrappers especializados"
        description="Wrappers de domínio sob @/components/ui/* — sempre prefira esses em código de feature em vez de Badge crua."
      >
        <DemoCanvas>
          <ul className="space-y-2 text-sm">
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">SemanticBadge</code>{' '}
              — wrapper que mapeia 8 categorias de domínio (tribunal, status,
              parte, polo, audiencia_status, audiencia_modalidade, expediente_tipo, captura_status) para variants visuais.
            </li>
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">TagBadge</code>{' '}
              — badge com cor customizada (consume <code>cor</code> hex do banco). Para tags de processo/contrato.
            </li>
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">PortalBadge</code>{' '}
              — badge especializada do portal do cliente, usa tokens --portal-*.
            </li>
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">TribunalBadge</code>,{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">StatusBadge</code>,{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GrauBadge</code>,{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">PoloBadge</code>{' '}
              — atalhos sobre <code>SemanticBadge</code> com category fixa.
            </li>
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">AudienciaStatusBadge</code>,{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">AudienciaModalidadeBadge</code>{' '}
              — específicos do módulo audiências.
            </li>
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VerifiedBadge</code>,{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">AppBadge</code>{' '}
              — usos especiais (selo verificado, menção a outro app).
            </li>
          </ul>
        </DemoCanvas>
      </DemoSection>

      <UsageInProduction
        sites={[
          {
            file: 'src/components/ui/semantic-badge.tsx',
            snippet: `// SEMPRE use SemanticBadge para badges de domínio
<SemanticBadge category="tribunal" value="TRT1">TRT1</SemanticBadge>
<SemanticBadge category="status" value="ATIVO">Ativo</SemanticBadge>
<SemanticBadge category="parte" value="PERITO" autoLabel />`,
            note: 'Encapsula a lógica de mapeamento de domínio → variant visual.',
          },
          {
            file: 'src/app/portal/feature/components/portal/portal-badge.tsx',
            line: 14,
            snippet: `const VARIANT_STYLES: Record<PortalBadgeVariant, string> = {
  success: "bg-portal-success-soft text-portal-success",
  warning: "bg-portal-warning-soft text-portal-warning",
  // ...
}`,
            note: 'Portal namespace — usa tokens --portal-*-soft do design system.',
          },
          {
            file: 'src/app/(authenticated)/contratos/[id]/components/contrato-tags-card.tsx',
            snippet: `<Badge variant={tipoContratoVariant}>{tipoContratoLabel}</Badge>
<Badge variant="secondary">{tipoCobrancaLabel}</Badge>
<Badge variant="outline">Cliente {papelLabel}</Badge>`,
            note: 'Variants semânticos diretos, sem cores hardcoded.',
          },
        ]}
      />

      <DemoSection title="ESLint enforcement">
        <DemoCanvas>
          <p className="text-sm text-muted-foreground">
            Em <code>src/app/(authenticated)/**</code>, importar{' '}
            <code className="rounded bg-muted px-1.5 py-0.5">@/components/ui/badge</code>{' '}
            direto é <strong>bloqueado pelo ESLint</strong>. Use{' '}
            <code className="rounded bg-muted px-1.5 py-0.5">SemanticBadge</code> ou um
            wrapper especializado.
          </p>
        </DemoCanvas>
      </DemoSection>
    </div>
  )
}
