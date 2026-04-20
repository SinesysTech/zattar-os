'use client';

import { Suspense } from 'react';
import { ComunicaCNJTabsContent } from './components';

export const dynamic = 'force-dynamic';

/**
 * Página do Diário Oficial
 *
 * Consulta a API pública do Comunica CNJ e lista comunicações processuais
 * capturadas, com vinculação a expedientes, views salvas e métricas.
 */
export default function DiarioOficialPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          Carregando...
        </div>
      }
    >
      <ComunicaCNJTabsContent />
    </Suspense>
  );
}
