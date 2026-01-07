import { Metadata } from 'next';
import { ExpedientesContent } from '@/features/expedientes';
import { PageShell } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Expedientes | Mês',
  description: 'Visualização mensal de expedientes',
};

export const dynamic = 'force-dynamic';

export default function ExpedientesMesPage() {
  return (
    <PageShell>
      <ExpedientesContent visualizacao="mes" />
    </PageShell>
  );
}
