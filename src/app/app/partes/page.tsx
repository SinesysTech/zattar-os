import { Suspense } from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { PartesTabsContent } from '@/features/partes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Página de Partes
 *
 * Página principal com tabs para navegação entre tipos de partes:
 * Clientes | Partes Contrárias | Terceiros | Representantes
 */
export default function PartesPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
        <PartesTabsContent />
      </Suspense>
    </PageShell>
  );
}
