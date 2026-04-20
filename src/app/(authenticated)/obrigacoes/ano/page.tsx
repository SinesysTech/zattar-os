import { Suspense } from 'react';

import { ObrigacoesContent } from '@/app/(authenticated)/obrigacoes';
import { ObrigacoesLoading } from '@/app/(authenticated)/obrigacoes/components/obrigacoes-loading';
import { obterResumoObrigacoes } from '@/app/(authenticated)/obrigacoes/service';
import type { ResumoObrigacoesDB } from '@/app/(authenticated)/obrigacoes/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ObrigacoesAnoPage() {
  let initialResumo: ResumoObrigacoesDB | null = null;
  try {
    initialResumo = await obterResumoObrigacoes();
  } catch (error) {
    console.error('[obrigacoes/ano] falha ao pré-buscar resumo:', error);
  }

  return (
    <Suspense fallback={<ObrigacoesLoading view="ano" />}>
      <ObrigacoesContent visualizacao="ano" initialResumo={initialResumo} />
    </Suspense>
  );
}
