/**
 * Página de Obrigações Financeiras
 * Visão consolidada de acordos e contas a pagar/receber
 *
 * Server Component que renderiza o wrapper client-side.
 * Os dados são carregados via SWR no wrapper.
 */

import { PageShell } from '@/components/shared/page-shell';
import { ObrigacoesTableWrapper } from '@/features/financeiro';

export default function ObrigacoesPage() {
  return (
    <PageShell
      title="Obrigações"
      description="Gerenciamento de acordos, condenações e obrigações financeiras"
    >
      <ObrigacoesTableWrapper
        initialData={[]}
        initialPagination={null}
        initialResumo={null}
        initialAlertas={null}
      />
    </PageShell>
  );
}
