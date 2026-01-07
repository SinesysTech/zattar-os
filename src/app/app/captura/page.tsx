import { Suspense } from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { CapturaTabsContent } from '@/features/captura';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Página de Captura
 *
 * Página principal com tabs para navegação no módulo de captura:
 * Histórico | Agendamentos | Credenciais | Tribunais
 */
export default function CapturaPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
        <CapturaTabsContent />
      </Suspense>
    </PageShell>
  );
}