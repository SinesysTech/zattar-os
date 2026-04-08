'use client';

import { Suspense } from 'react';
import { ComunicaCNJTabsContent } from '@/app/(authenticated)/captura';

export const dynamic = 'force-dynamic';

/**
 * Página do Diário Oficial
 * Consulta comunicações processuais na API do CNJ e lista as já capturadas
 */
export default function DiarioOficialPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
      <ComunicaCNJTabsContent />
    </Suspense>
  );
}
