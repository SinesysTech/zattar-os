/**
 * Página Kanban de Contratos (Server Component)
 *
 * Exibe o quadro Kanban de contratos por segmento e pipeline.
 * A seleção de segmento é feita no cliente; os dados do kanban
 * são carregados dinamicamente.
 */

import { Suspense } from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanContratosClient } from './page-client';

function KanbanLoading() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 min-w-70">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ContratosKanbanPage() {
  return (
    <PageShell>
      <Suspense fallback={<KanbanLoading />}>
        <KanbanContratosClient />
      </Suspense>
    </PageShell>
  );
}
