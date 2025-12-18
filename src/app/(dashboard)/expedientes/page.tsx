import { ExpedientesContent } from '@/features/expedientes';
import { PageShell } from '@/components/shared';

export const dynamic = 'force-dynamic';

/**
 * Página raiz de Expedientes
 * Renderiza visualização unificada com alternância entre semana, mês, ano e lista
 */
export default function ExpedientesPage() {
  return (
    <PageShell>
      <ExpedientesContent visualizacao="semana" />
    </PageShell>
  );
}
