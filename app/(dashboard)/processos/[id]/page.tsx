/**
 * Página de Visualização de Processo com Timeline
 *
 * Exibe detalhes completos do processo incluindo timeline de movimentações
 * e documentos capturados do PJE-TRT.
 */

import { Metadata } from 'next';
import { ProcessoVisualizacao } from './processo-visualizacao';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Gera metadata dinâmica para a página
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  // Validar ID
  const acervoId = parseInt(id);
  if (isNaN(acervoId)) {
    return {
      title: 'Processo Inválido | Sinesys',
      description: 'ID de processo inválido',
    };
  }

  try {
    // Buscar dados do processo para metadata
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/acervo/${acervoId}`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        const processo = data.data;
        return {
          title: `Processo ${processo.numero_processo} | Sinesys`,
          description: `Processo trabalhista ${processo.numero_processo} no ${processo.trt} - ${processo.classe_judicial || 'Processo'}`,
        };
      }
    }
  } catch (error) {
    console.error('Erro ao buscar metadata do processo:', error);
  }

  // Fallback
  return {
    title: 'Processo | Sinesys',
    description: 'Visualização de processo no Sinesys',
  };
}

/**
 * Página do processo (Server Component)
 */
export default async function ProcessoPage({ params }: PageProps) {
  const { id } = await params;

  // Validar ID
  const acervoId = parseInt(id);

  if (isNaN(acervoId) || acervoId <= 0) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="text-center space-y-4 py-12">
          <h1 className="text-2xl font-bold text-destructive">ID de Processo Inválido</h1>
          <p className="text-muted-foreground">
            O ID fornecido não é válido. Você será redirecionado em instantes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <ProcessoVisualizacao acervoId={acervoId} />
    </div>
  );
}
