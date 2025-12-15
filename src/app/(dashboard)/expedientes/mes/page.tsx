import { Metadata } from 'next';
import { ExpedientesCalendarMonth } from '@/features/expedientes';
import { PageShell } from '@/components/shared/page-shell';

export const metadata: Metadata = {
  title: 'Expedientes | Mês',
  description: 'Visualização mensal de expedientes',
};

export default function ExpedientesMesPage() {
  return (
    <PageShell
        title="Expedientes (Mês)"
        breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Expedientes', href: '/expedientes' },
            { label: 'Mês', href: '/expedientes/mes', active: true },
        ]}
    >
      <ExpedientesCalendarMonth />
    </PageShell>
  );
}
