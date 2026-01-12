import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { actionBuscarContratoCompleto } from '@/features/contratos';
import { LancamentosRepository } from '@/features/financeiro/repository/lancamentos';
import { ContratoDetalhesClient } from './contrato-detalhes-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Contrato #${id}`,
    description: 'Detalhes do contrato',
  };
}

export default async function ContratoDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  const contratoId = parseInt(id, 10);

  if (isNaN(contratoId) || contratoId <= 0) {
    notFound();
  }

  // Fetch contrato completo
  const result = await actionBuscarContratoCompleto(contratoId);

  if (!result.success || !result.data) {
    notFound();
  }

  const { contrato, cliente, responsavel, segmento, stats } = result.data;

  // Fetch lançamentos financeiros
  let lancamentos: Awaited<ReturnType<typeof LancamentosRepository.listar>> = [];
  try {
    lancamentos = await LancamentosRepository.listar({
      contratoId: contratoId,
      limite: 50,
    });
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
  }

  return (
    <ContratoDetalhesClient
      contrato={contrato}
      cliente={cliente}
      responsavel={responsavel}
      segmento={segmento}
      stats={stats}
      lancamentos={lancamentos}
    />
  );
}
