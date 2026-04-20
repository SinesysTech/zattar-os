import { notFound } from 'next/navigation';

import { buscarAcordoPorId } from '@/app/(authenticated)/obrigacoes/service';
import { AcordoDetalhesClient } from './acordo-detalhes-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AcordoDetalhesPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página de detalhes do acordo — Server Component.
 *
 * Pré-busca o acordo no servidor e delega o render para o client component
 * (que gerencia tabs, dialogs e state). Se o acordo não existir, dispara 404.
 */
export default async function AcordoDetalhesPage({ params }: AcordoDetalhesPageProps) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  if (Number.isNaN(id)) notFound();

  let acordo;
  try {
    acordo = await buscarAcordoPorId(id);
  } catch (error) {
    console.error('[obrigacoes/[id]] falha ao buscar acordo:', error);
    throw error;
  }

  if (!acordo) notFound();

  return <AcordoDetalhesClient initialAcordo={acordo} acordoId={id} />;
}
