/**
 * Página de Clientes (Server Component)
 *
 * Lista e gerencia clientes do escritório.
 * Dados são carregados no servidor para melhor performance e SEO.
 */

import { Suspense } from 'react';
import { listarClientes } from '@/core/partes/service';
import { PageShell } from '@/components/shared/page-shell';
import { ClientesTableWrapper } from '@/components/modules/partes/clientes-table-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

function ClientesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-3xl" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default async function ClientesPage() {
  // Fetch inicial no servidor
  const result = await listarClientes({
    pagina: 1,
    limite: 50,
  });

  const clientes = result.success ? result.data.data : [];
  const pagination = result.success ? result.data.pagination : null;

  return (
    <PageShell
      title="Gestão de Clientes"
      description="Gerencie seus clientes PF e PJ"
    >
      <Suspense fallback={<ClientesLoading />}>
        <ClientesTableWrapper
          initialData={clientes}
          initialPagination={pagination}
        />
      </Suspense>
    </PageShell>
  );
}
