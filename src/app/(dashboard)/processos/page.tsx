import { PageShell } from '@/components/shared/page-shell';
import { ProcessosTableWrapper } from '@/features/processos';

import { listarProcessos, buscarUsuariosRelacionados, listarTribunais } from '@/features/processos/service';

interface ProcessosPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProcessosPage({ searchParams }: ProcessosPageProps) {
  const params = await searchParams;
  const pagina = Number(params?.page) || 1;
  const limite = Number(params?.limit) || 50;
  const busca = typeof params?.search === 'string' ? params.search : undefined;
  const trt = typeof params?.trt === 'string' && params.trt !== 'all' ? params.trt : undefined;
  const origem = typeof params?.origem === 'string' && params.origem !== 'all' ? (params.origem as 'acervo_geral' | 'arquivado') : undefined;

  const result = await listarProcessos({
    pagina,
    limite,
    busca,
    trt,
    origem,
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
