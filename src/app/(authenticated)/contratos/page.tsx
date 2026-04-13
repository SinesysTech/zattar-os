import type { Metadata } from 'next';
import { ContratosContent } from './components/contratos-content';

export const metadata: Metadata = {
  title: 'Contratos',
  description: 'Pipeline de contratos com visualizacao de conversao e gestao de portfolio.',
};

/**
 * ContratosPage — Server Component
 *
 * Delega toda interatividade ao ContratosContent, que orquestra:
 * Header, PulseStrip, InsightBanners, PipelineStepper e TableWrapper.
 */
export default async function ContratosPage() {
  return <ContratosContent />;
}
