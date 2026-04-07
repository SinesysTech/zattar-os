import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  getEventColorClasses,
} from '@/lib/design-system/event-colors'
import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
  UsageInProduction,
} from '../../_components/demo-section'

export default function EventColorsPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Tokens"
        title="Event Colors"
        description="Tokens semânticos para cores de fonte de evento de calendário/agenda. Cada tipo (audiência, expediente, obrigação, perícia, agenda, prazo) tem seu token --event-* derivado da paleta canônica."
      />

      <DemoSection
        title="Tipos canônicos"
        description="6 tipos + default. Use getEventColorClasses(type) para receber bg/text/border/dot prontos."
      >
        <div className="space-y-3">
          {EVENT_TYPES.map((type) => {
            const c = getEventColorClasses(type)
            return (
              <div
                key={type}
                className={`flex items-center justify-between rounded-lg border ${c.border} ${c.bgSoft} px-4 py-3`}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-3 rounded-full ${c.dot}`} />
                  <span className={`font-semibold ${c.text}`}>
                    {EVENT_TYPE_LABELS[type]}
                  </span>
                </div>
                <code className="font-mono text-[10px] text-muted-foreground">
                  --event-{type}
                </code>
              </div>
            )
          })}
        </div>
      </DemoSection>

      <DemoSection
        title="API do helper"
        description="Importe getEventColorClasses para receber todas as classes de uma vez."
      >
        <DemoCanvas>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code>{`import { getEventColorClasses } from '@/lib/design-system/event-colors'

const c = getEventColorClasses('audiencia')
// {
//   bgSoft:  'bg-event-audiencia/15',
//   bgSolid: 'bg-event-audiencia',
//   text:    'text-event-audiencia',
//   border:  'border-event-audiencia/40',
//   dot:     'bg-event-audiencia',
//   cssVar:  'var(--event-audiencia)',
// }

<div className={c.bgSoft + ' ' + c.text}>...</div>`}</code>
          </pre>
        </DemoCanvas>
      </DemoSection>

      <DemoSection
        title="Aliases legacy"
        description="getEventColorClasses() aceita também aliases antigos do mock (sky, amber, violet, rose, emerald, orange) e mapeia automaticamente para os tipos canônicos."
      >
        <DemoCanvas>
          <pre className="text-xs leading-relaxed">
            <code>{`sky      → audiencia
amber    → expediente
violet   → pericia
rose     → prazo
emerald  → agenda
orange   → obrigacao`}</code>
          </pre>
        </DemoCanvas>
      </DemoSection>

      <UsageInProduction
        sites={[
          {
            file: 'src/app/(authenticated)/agenda/mock/data.ts',
            snippet: `import { getEventColorClasses } from "@/lib/design-system/event-colors";

function buildEntry(legacy: EventColor): ColorMapEntry {
  const c = getEventColorClasses(legacy);
  return { bg: c.bgSoft, bgSolid: c.bgSolid, text: c.text, border: c.border, dot: c.dot };
}

export const COLOR_MAP = {
  sky:     buildEntry("sky"),
  amber:   buildEntry("amber"),
  // ...
};`,
            note: 'Compat shim — código legado consome COLOR_MAP, mas o source of truth é o helper.',
          },
          {
            file: 'src/app/(authenticated)/calendar/briefing-domain.ts',
            snippet: `// Mesma estrutura — delega para getEventColorClasses
export const COLOR_MAP = { sky: _buildBriefingEntry("sky"), ... }`,
          },
        ]}
      />
    </div>
  )
}
