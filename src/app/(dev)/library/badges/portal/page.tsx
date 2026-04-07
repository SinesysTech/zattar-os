import { PortalBadge } from '@/app/portal/feature/components/portal/portal-badge'
import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
} from '../../_components/demo-section'

export default function PortalBadgePage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Badges"
        title="PortalBadge"
        description="Badge especializada do Portal do Cliente. Usa namespace de tokens --portal-{success,warning,danger,info}-soft que permitem reskin do portal sem tocar no app interno."
      />

      <DemoSection title="Variantes">
        <DemoCanvas className="dark bg-portal-bg" background="dark">
          <div className="flex flex-wrap gap-3">
            <PortalBadge variant="success">Pago</PortalBadge>
            <PortalBadge variant="warning">Pendente</PortalBadge>
            <PortalBadge variant="danger">Atrasado</PortalBadge>
            <PortalBadge variant="info">Em análise</PortalBadge>
            <PortalBadge variant="neutral">Arquivado</PortalBadge>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <PortalBadge variant="success" dot={false}>Sem dot</PortalBadge>
            <PortalBadge variant="warning" dot={false}>Sem dot</PortalBadge>
          </div>
        </DemoCanvas>
      </DemoSection>

      <DemoSection title="API">
        <DemoCanvas>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code>{`<PortalBadge variant="success">Pago</PortalBadge>
<PortalBadge variant="warning" dot={false}>Pendente</PortalBadge>`}</code>
          </pre>
        </DemoCanvas>
      </DemoSection>
    </div>
  )
}
