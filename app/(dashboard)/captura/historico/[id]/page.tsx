/**
 * Página de Visualização de Captura
 *
 * Rota: /captura/historico/[id]
 *
 * Exibe detalhes completos de uma captura do histórico.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CapturaVisualizacao } from './captura-visualizacao';

interface CapturaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: CapturaPageProps): Promise<Metadata> {
  const { id } = await params;

  // Validar ID
  const capturaId = parseInt(id);
  if (isNaN(capturaId)) {
    return {
      title: 'Captura não encontrada',
    };
  }

  return {
    title: `Captura #${capturaId} - Sinesys`,
    description: 'Detalhes da captura de dados do PJE-TRT',
  };
}

export default async function CapturaPage({ params }: CapturaPageProps) {
  const { id } = await params;

  // Validar ID
  const capturaId = parseInt(id);
  if (isNaN(capturaId)) {
    notFound();
  }

  return <CapturaVisualizacao id={capturaId} />;
}
