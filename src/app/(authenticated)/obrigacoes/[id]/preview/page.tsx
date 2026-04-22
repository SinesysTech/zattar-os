import { AcordoDetalhesV2Client } from '../_v2/acordo-detalhes-v2-client';
import { MOCK_ACORDO } from '../_v2/mock-data';

export const dynamic = 'force-static';

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Preview visual da nova página de detalhes de obrigação.
 *
 * Rota temporária — remover após aprovação do redesign (ver [id]/_v2/).
 * Não bate no banco: usa mock inline em `_v2/mock-data.ts` para isolar
 * a review visual da conexão de backend.
 */
export default async function ObrigacaoDetalhesPreviewPage({
  params,
}: PreviewPageProps) {
  const resolvedParams = await params;
  const acordoId = parseInt(resolvedParams.id, 10) || MOCK_ACORDO.id;

  return (
    <div className="relative">
      <PreviewBanner />
      <AcordoDetalhesV2Client
        initialAcordo={MOCK_ACORDO}
        acordoId={acordoId}
        readOnly
      />
    </div>
  );
}

function PreviewBanner() {
  return (
    <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 min-w-0">
        <span className="size-1.5 rounded-full bg-primary animate-pulse shrink-0" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/80 shrink-0">
          Preview · Glass Briefing
        </p>
        <p className="text-[11px] text-muted-foreground/70 truncate">
          Nova página de detalhes com dados mocados. Mutações desabilitadas.
        </p>
      </div>
    </div>
  );
}
