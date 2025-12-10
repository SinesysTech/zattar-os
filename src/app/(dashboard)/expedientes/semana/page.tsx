import { Metadata } from 'next';
import { ExpedientesCalendar } from '@/features/expedientes/components/expedientes-calendar';
import { PageShell } from '@/components/shared/page-shell';

export const metadata: Metadata = {
  title: 'Expedientes | Semanal',
  description: 'Visualização semanal de expedientes',
};

export default function ExpedientesSemanaPage() {
  return (
    <PageShell
        title="Expedientes (Semana)"
        breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Expedientes', href: '/expedientes' },
            { label: 'Semana', href: '/expedientes/semana', active: true },
        ]}
    >
      <ExpedientesCalendar />
    </PageShell>
  );
}