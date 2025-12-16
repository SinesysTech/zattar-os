import { PageShell } from '@/components/shared/page-shell';
import { ProcessosTableWrapper } from '@/features/processos';
import { listarProcessos } from '@/features/processos/service';

export default async function ProcessosPage() {
  const result = await listarProcessos({ pagina: 1, limite: 50 });

  const initialData = result.success ? result.data.data : [];
  const initialPagination = result.success
    ? {
        page: result.data.pagination.page,
        limit: result.data.pagination.limit,
        total: result.data.pagination.total,
        totalPages: result.data.pagination.totalPages,
        hasMore: result.data.pagination.hasMore,
      }
    : null;

  return (
    <PageShell>
      <ProcessosTableWrapper
        initialData={initialData}
        initialPagination={initialPagination}
      />
    </PageShell>
  );
}
