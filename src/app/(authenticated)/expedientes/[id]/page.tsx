import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { MOCK_DATA_BUNDLE } from './mocks';
import { ExpedienteDetalhesClient } from './expediente-detalhes-client';

export const dynamic = 'force-dynamic';

interface ExpedientePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ExpedientePageProps): Promise<Metadata> {
  const { id } = await params;
  const expedienteId = Number.parseInt(id, 10);
  if (Number.isNaN(expedienteId)) return { title: 'Expediente não encontrado' };
  return {
    title: `Expediente #${expedienteId} · ZattarOS`,
    description: 'Visualização detalhada do expediente com edição inline, arquivos e histórico.',
  };
}

export default async function ExpedientePage({ params }: ExpedientePageProps) {
  const { id } = await params;
  const expedienteId = Number.parseInt(id, 10);
  if (Number.isNaN(expedienteId)) notFound();

  return <ExpedienteDetalhesClient bundle={MOCK_DATA_BUNDLE} expedienteId={expedienteId} />;
}
