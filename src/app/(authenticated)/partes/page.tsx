import type { Metadata } from 'next';
import { PartesClient } from './partes-client';
import { actionContarPartesPorTipo } from './actions/partes-stats-actions';

export const metadata: Metadata = {
  title: 'Partes',
  description: 'Gestão de clientes, partes contrárias, terceiros e representantes.',
};

export default async function PartesPage() {
  const statsResult = await actionContarPartesPorTipo();
  const initialStats = statsResult.success
    ? {
        clientes: { ...statsResult.data.clientes, ativos: statsResult.data.clientes.total },
        partesContrarias: { ...statsResult.data.partesContrarias, ativos: statsResult.data.partesContrarias.total },
        terceiros: { ...statsResult.data.terceiros, ativos: statsResult.data.terceiros.total },
        representantes: { ...statsResult.data.representantes, ativos: statsResult.data.representantes.total },
      }
    : undefined;

  return <PartesClient initialStats={initialStats} />;
}
