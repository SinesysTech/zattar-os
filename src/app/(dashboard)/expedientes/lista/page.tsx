import { Metadata } from 'next';
import { ExpedientesContent } from '@/features/expedientes';
import { PageShell } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Expedientes | Lista',
  description: 'Lista de expedientes e intimações',
};

export const dynamic = 'force-dynamic';

export default function ExpedientesListaPage() {
  return (
    <PageShell>
      <ExpedientesContent visualizacao="lista" />
    </PageShell>
  );
}
