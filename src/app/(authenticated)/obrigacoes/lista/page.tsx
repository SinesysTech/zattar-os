import { Suspense } from 'react';

import { ObrigacoesContent } from '@/app/(authenticated)/obrigacoes';
import { ObrigacoesLoading } from '@/app/(authenticated)/obrigacoes/components/obrigacoes-loading';
import { obterResumoObrigacoes } from '@/app/(authenticated)/obrigacoes/service';
import type { ResumoObrigacoesDB } from '@/app/(authenticated)/obrigacoes/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Página de Lista de Obrigações.
 *
 * O resumo (Pulse Strip + Alertas) é pré-buscado no servidor para eliminar
 * flash de skeleton no primeiro render. Se a busca falhar (DB indisponível,
 * etc.), passa null — o hook no client faz fallback com fetch próprio.
 */
export default async function ObrigacoesListaPage() {
  let initialResumo: ResumoObrigacoesDB | null = null;
  try {
    initialResumo = await obterResumoObrigacoes();
  } catch (error) {
    console.error('[obrigacoes/lista] falha ao pré-buscar resumo:', error);
  }

  return (
    <Suspense fallback={<ObrigacoesLoading view="lista" />}>
      <ObrigacoesContent visualizacao="lista" initialResumo={initialResumo} />
    </Suspense>
  );
}
