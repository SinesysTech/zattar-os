import { Metadata } from 'next';
import { ExpedientesContent } from '@/features/expedientes';
import { PageShell } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Expedientes | Semanal',
  description: 'Visualização semanal de expedientes',
};

export const dynamic = 'force-dynamic';

export default function ExpedientesSemanaPage() {
  return (
    <PageShell>
      <ExpedientesContent visualizacao="semana" />
    </PageShell>
  );
}