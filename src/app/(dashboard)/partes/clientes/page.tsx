'use client';

/**
 * Página de Clientes
 * Lista e gerencia clientes do escritório
 */

import { Suspense } from 'react';
import { ClientesTab } from '../components/clientes-tab';
import { Skeleton } from '@/components/ui/skeleton';

function ClientesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-3xl" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function ClientesPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<ClientesLoading />}>
        <ClientesTab />
      </Suspense>
    </div>
  );
}

