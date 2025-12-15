import { Metadata } from 'next';
import { ExpedientesCalendarYear } from '@/features/expedientes';
import { PageShell } from '@/components/shared/page-shell';

export const metadata: Metadata = {
  title: 'Expedientes | Ano',
  description: 'Visualização anual de expedientes',
};

export default function ExpedientesAnoPage() {
  return (
    <PageShell
        title="Expedientes (Ano)"
        breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Expedientes', href: '/expedientes' },
            { label: 'Ano', href: '/expedientes/ano', active: true },
        ]}
    >
      <ExpedientesCalendarYear />
    </PageShell>
  );
}
