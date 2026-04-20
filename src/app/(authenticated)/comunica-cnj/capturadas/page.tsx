'use client';

import { Suspense } from 'react';
import { ComunicaCNJTabsContent } from '../components';

export const dynamic = 'force-dynamic';

/**
 * Página de Gestão — Comunicações Capturadas
 *
 * Painel operacional com KPIs, filtros, listagem, prazos e vinculação
 * a expedientes. Destino das buscas e atalhos da página raiz `/comunica-cnj`.
 */
export default function CapturadasPage() {
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
