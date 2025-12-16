import { ExpedientesContent } from '@/features/expedientes';
import { PageShell } from '@/components/shared';

export const dynamic = 'force-dynamic';

/**
 * Página raiz de Expedientes
 * Renderiza visualização unificada com alternância entre semana, mês, ano e lista
 */
export default function ExpedientesPage() {
  return (
    <PageShell
      title="Expedientes"
      description="Gerencie seus expedientes e intimações."
    >
      <ExpedientesContent visualizacao="semana" />
    </PageShell>
  );
}
