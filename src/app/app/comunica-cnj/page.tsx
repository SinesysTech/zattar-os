'use client';

import { Suspense } from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { ComunicaCNJTabsContent } from '@/features/captura';

export const dynamic = 'force-dynamic';

/**
 * Página principal do Diário Oficial (antigo Comunica CNJ)
 * Contém duas tabs: Consulta (busca na API) e Capturadas (lista do banco)
 */
export default function ComunicaCNJPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
        <ComunicaCNJTabsContent />
      </Suspense>
    </PageShell>
  );
}
