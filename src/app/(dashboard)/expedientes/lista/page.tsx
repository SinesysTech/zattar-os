import { Metadata } from 'next';
import { ExpedientesList, actionListarExpedientes } from '@/features/expedientes';
import { PageShell } from '@/components/shared/page-shell';

export const metadata: Metadata = {
  title: 'Expedientes | Lista',
  description: 'Lista de expedientes e intimações',
};

export default async function ExpedientesListaPage() {
  // Pre-fetch data serverside (optional)
  const initialData = await actionListarExpedientes({ page: 1, limit: 10 }, { pendentes: true });

  return (
    <PageShell
        title="Expedientes"
        breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Expedientes', href: '/expedientes' },
            { label: 'Lista', href: '/expedientes/lista', active: true },
        ]}
    >
      <ExpedientesList initialData={initialData.success ? initialData.data : undefined} />
    </PageShell>
  );
}
