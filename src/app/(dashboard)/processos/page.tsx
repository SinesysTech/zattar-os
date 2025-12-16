import { PageShell } from '@/components/shared/page-shell';
import { ProcessosTableWrapper } from '@/features/processos';
import { listarProcessos, buscarUsuariosRelacionados } from '@/features/processos/service';

interface ProcessosPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProcessosPage({ searchParams }: ProcessosPageProps) {
  const pagina = Number(searchParams.page) || 1;
  const limite = Number(searchParams.limit) || 50;
  const busca = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const trt = typeof searchParams.trt === 'string' && searchParams.trt !== 'all' ? searchParams.trt : undefined;
  const status = typeof searchParams.status === 'string' && searchParams.status !== 'all' ? searchParams.status : undefined;

  const result = await listarProcessos({
    pagina,
    limite,
    busca,
    trt,
    codigoStatusProcesso: status,
  });

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

  // Buscar usuarios relacionados
  const initialUsers = await buscarUsuariosRelacionados(initialData);

  return (
    <PageShell>
      <ProcessosTableWrapper
        initialData={initialData}
        initialPagination={initialPagination}
        initialUsers={initialUsers}
      />
    </PageShell>
  );
}
