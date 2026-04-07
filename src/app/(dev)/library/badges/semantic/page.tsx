import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
} from '../../_components/demo-section'

export default function SemanticBadgePage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Badges"
        title="SemanticBadge"
        description="Wrapper canônico que mapeia categorias de domínio (tribunal, status, parte, polo, audiencia_*, expediente_tipo, captura_status) para variants visuais. Use SEMPRE este em vez de Badge crua em código de feature."
      />

      <DemoSection title="API">
        <DemoCanvas>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code>{`import { SemanticBadge } from '@/components/ui/semantic-badge'

<SemanticBadge category="tribunal" value="TRT1">TRT1</SemanticBadge>
<SemanticBadge category="status" value="ATIVO">Ativo</SemanticBadge>
<SemanticBadge category="parte" value="PERITO" autoLabel />
<SemanticBadge category="audiencia_status" value="Marcada">Marcada</SemanticBadge>`}</code>
          </pre>
        </DemoCanvas>
      </DemoSection>

      <DemoSection title="8 categorias suportadas">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li><code>tribunal</code> — TRT1, TST, TJSP, etc.</li>
          <li><code>status</code> — ATIVO, ARQUIVADO, etc.</li>
          <li><code>grau</code> — primeiro_grau, segundo_grau</li>
          <li><code>parte</code> — PERITO, TESTEMUNHA, etc. (autoLabel disponível)</li>
          <li><code>polo</code> — ATIVO/PASSIVO, AUTOR/REU</li>
          <li><code>audiencia_status</code> — Marcada, Finalizada, Cancelada</li>
          <li><code>audiencia_modalidade</code> — Virtual, Presencial, Híbrida</li>
          <li><code>expediente_tipo</code> — por ID numérico</li>
          <li><code>captura_status</code> — pending, in_progress, completed, failed</li>
        </ul>
      </DemoSection>

      <DemoSection title="Wrappers especializados (atalhos)">
        <DemoCanvas>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code>{`<TribunalSemanticBadge value="TRT1" />
<StatusSemanticBadge value="ATIVO" />
<GrauSemanticBadge value="primeiro_grau" />
<PoloSemanticBadge value="ATIVO" />
<ParteTipoSemanticBadge value="PERITO" />
<AudienciaStatusSemanticBadge value="Marcada" />
<AudienciaModalidadeSemanticBadge value="Virtual" />`}</code>
          </pre>
        </DemoCanvas>
      </DemoSection>
    </div>
  )
}
