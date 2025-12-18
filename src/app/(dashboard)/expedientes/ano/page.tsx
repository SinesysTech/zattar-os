import { Metadata } from 'next';
import { ExpedientesContent } from '@/features/expedientes';
import { PageShell } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Expedientes | Ano',
  description: 'Visualização anual de expedientes',
};

export const dynamic = 'force-dynamic';

export default function ExpedientesAnoPage() {
  return (
    <PageShell>
      <ExpedientesContent visualizacao="ano" />
    </PageShell>
  );
}
