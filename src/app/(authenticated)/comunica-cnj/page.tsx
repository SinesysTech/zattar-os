import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PesquisaClient } from './pesquisa-client';

export const dynamic = 'force-dynamic';

function PesquisaLoading() {
  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <Skeleton className="h-9 w-60 rounded-xl" />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5">
        <Skeleton className="size-14 rounded-2xl" />
        <Skeleton className="h-9 w-80 rounded" />
        <Skeleton className="h-4 w-96 rounded" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Página raiz do Diário Oficial — pesquisa na base pública do Comunica CNJ.
 * Destino direto do menu principal; redireciona para `/capturadas` via
 * subnav quando o usuário quer gerir comunicações já persistidas.
 */
export default function DiarioOficialPage() {
  return (
    <Suspense fallback={<PesquisaLoading />}>
      <PesquisaClient />
    </Suspense>
  );
}
