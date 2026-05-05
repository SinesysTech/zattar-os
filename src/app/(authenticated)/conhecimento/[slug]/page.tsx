import { notFound } from 'next/navigation';
import { buscarBasePorSlug, listarDocumentosDaBase } from '../repository';
import { ConhecimentoDetalheClient } from './conhecimento-detalhe-client';
import { getCurrentUser } from '@/lib/auth/server';

export default async function ConhecimentoDetalhePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = await buscarBasePorSlug(slug);
  if (!base) notFound();
  const [documentos, user] = await Promise.all([
    listarDocumentosDaBase(base.id),
    getCurrentUser(),
  ]);
  return (
    <ConhecimentoDetalheClient
      base={base}
      documentos={documentos}
      isSuperAdmin={!!user?.roles.includes('admin')}
    />
  );
}
