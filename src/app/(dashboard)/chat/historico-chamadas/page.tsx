import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { 
  actionListarHistoricoGlobal,
  CallHistoryList,
  TipoChamada, 
  StatusChamada
} from '@/features/chat';
import { PageShell } from '@/components/shared/page-shell';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    tipo?: string;
    status?: string;
  }>;
}

export default async function HistoricoChamadasPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');

  const result = await actionListarHistoricoGlobal({
    pagina: page,
    limite: limit,
    tipo: params.tipo as TipoChamada,
    status: params.status as StatusChamada,
    // Se não for admin, o action já deve forçar o usuarioId
  });

  if (!result.success) {
    return (
      <PageShell title="Histórico de Chamadas" description="Visualize todas as chamadas realizadas.">
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">
          Erro ao carregar histórico: {result.message}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell 
      title="Histórico de Chamadas" 
      description="Visualize e gerencie o histórico de chamadas de áudio e vídeo."
    >
      <CallHistoryList 
        initialData={result.data.data} 
        initialPagination={result.data.pagination}
      />
    </PageShell>
  );
}
