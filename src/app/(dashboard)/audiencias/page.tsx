import { AudienciasContent } from '@/features/audiencias';
import { PageShell } from '@/components/shared';

export const dynamic = 'force-dynamic';

export default function AudienciasPage() {
  return (
    <PageShell
      title="Audiências"
      description="Gerencie suas audiências e compromissos."
    >
      <AudienciasContent visualizacao="semana" />
    </PageShell>
  );
}
