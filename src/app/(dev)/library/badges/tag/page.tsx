import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
} from '../../_components/demo-section'

export default function TagBadgePage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Badges"
        title="TagBadge"
        description="Badge especializado para tags/etiquetas com cor customizada. Aceita prop cor (hex string vinda do banco) ou consome direto via TAG_COLORS do design system."
      />

      <DemoSection title="API">
        <DemoCanvas>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code>{`import { TagBadge, TagBadgeList } from '@/components/ui/tag-badge'
import { TAG_COLORS } from '@/lib/domain/tags'

<TagBadge nome="Urgente" cor={TAG_COLORS[0].hex} />
<TagBadge nome="Trabalhista" cor={TAG_COLORS[10].hex} />
<TagBadge nome="Em revisão" cor={TAG_COLORS[12].hex} variant="selected" />

<TagBadgeList tags={tags} maxVisible={3} onClick={openEditor} />`}</code>
          </pre>
        </DemoCanvas>
      </DemoSection>

      <DemoSection title="Storage do banco">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Tags persistidas no Supabase com coluna <code>cor</code> varchar (hex format).</li>
          <li>Os hex válidos vivem em <code>TAG_COLORS</code> (single source of truth) — 18 cores derivadas dos tokens <code>--palette-1..18</code>.</li>
          <li>UI components consomem via <code>TagBadge</code>, picker via inline style.</li>
        </ul>
      </DemoSection>
    </div>
  )
}
