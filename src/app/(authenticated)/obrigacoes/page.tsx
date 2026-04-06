import { Suspense } from 'react';
import { ObrigacoesClient } from './obrigacoes-client';

export const dynamic = 'force-dynamic';

export default function ObrigacoesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground animate-pulse">Carregando Obrigações...</div>}>
      <ObrigacoesClient />
    </Suspense>
  );
}
