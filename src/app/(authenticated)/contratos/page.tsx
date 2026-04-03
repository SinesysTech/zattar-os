import type { Metadata } from 'next';
import { ContratosClient } from './contratos-client';

export const metadata: Metadata = {
  title: 'Contratos',
  description: 'Pipeline de contratos com visualizacao de conversao e gestao de portfolio.',
};

/**
 * ContratosPage — Server Component
 *
 * Delega toda interatividade ao ContratosClient.
 *
 * TODO: Buscar initialStats no servidor quando actionContratosStats estiver
 * disponivel para evitar o loading state inicial do FinancialStrip.
 */
export default async function ContratosPage() {
  return <ContratosClient />;
}
