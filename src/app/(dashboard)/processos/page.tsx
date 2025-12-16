import { PageShell } from '@/components/shared/page-shell';
import { ProcessosTableWrapper } from '@/features/processos';

import { listarProcessos, buscarUsuariosRelacionados, listarTribunais } from '@/features/processos/service';

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

  const [initialDataResult, tribunaisResult] = await Promise.all([
    Promise.resolve(result),
    listarTribunais(),
  ]);

  const initialData = initialDataResult.success ? initialDataResult.data.data : [];
  const initialPagination = initialDataResult.success
    ? {
      page: initialDataResult.data.pagination.page,
      limit: initialDataResult.data.pagination.limit,
      total: initialDataResult.data.pagination.total,
      totalPages: initialDataResult.data.pagination.totalPages,
      hasMore: initialDataResult.data.pagination.hasMore,
    }
    : null;
  const initialTribunais = tribunaisResult.success ? tribunaisResult.data : [];

  // Buscar usuarios relacionados
  const initialUsers = await buscarUsuariosRelacionados(initialData);

  return (
    <PageShell>
      <ProcessosTableWrapper
        initialData={initialData}
        initialPagination={initialPagination}
        initialUsers={initialUsers}
        initialTribunais={initialTribunais}
      />
    </PageShell>
  );
}
