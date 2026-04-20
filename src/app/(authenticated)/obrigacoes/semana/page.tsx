import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

import { ObrigacoesContent } from '@/app/(authenticated)/obrigacoes';
import { obterResumoObrigacoes } from '@/app/(authenticated)/obrigacoes/service';
import type { ResumoObrigacoesDB } from '@/app/(authenticated)/obrigacoes/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ObrigacoesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-100 w-full" />
    </div>
  );
}

export default async function ObrigacoesSemanaPage() {
  let initialResumo: ResumoObrigacoesDB | null = null;
  try {
    initialResumo = await obterResumoObrigacoes();
  } catch (error) {
    console.error('[obrigacoes/semana] falha ao pré-buscar resumo:', error);
  }

  return (
    <Suspense fallback={<ObrigacoesLoading />}>
      <ObrigacoesContent visualizacao="semana" initialResumo={initialResumo} />
    </Suspense>
  );
}
