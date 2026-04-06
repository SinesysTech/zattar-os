import { authenticateRequest } from '@/lib/auth/session';
import { ProcessosClient } from './processos-client';
import { listarProcessos, buscarUsuariosRelacionados, listarTribunais } from './service';
import { obterEstatisticasProcessos } from './service-estatisticas';

interface ProcessosPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProcessosPage({ searchParams: _ }: ProcessosPageProps) {
  const session = await authenticateRequest();

  const [processosResult, tribunaisResult, stats] = await Promise.all([
    listarProcessos({ pagina: 1, limite: 200, unified: true }),
    listarTribunais(),
    obterEstatisticasProcessos(),
  ]);

  const processos = processosResult.success ? ((processosResult as any).data?.data || []) : [];
  const total = processosResult.success ? ((processosResult as any).data?.pagination?.total ?? processos.length) : 0;
  const tribunaisRaw = tribunaisResult.success ? ((tribunaisResult as any).data || []) : [];
  const tribunais: string[] = tribunaisRaw.map((t: any) => (typeof t === 'string' ? t : t.codigo));

  // Resolve user names from processos array
  const usersRecord = processos.length > 0
    ? await buscarUsuariosRelacionados(processos)
    : {};

  const usuarios = Object.entries(usersRecord).map(([id, u]: [string, any]) => ({
    id: Number(id),
    nomeExibicao: u.nome,
    avatarUrl: u.avatarUrl ?? null,
  }));

  return (
    <div className="max-w-350 mx-auto space-y-5 py-6">
      <ProcessosClient
        initialProcessos={processos}
        initialTotal={total}
        initialStats={stats}
        tribunais={tribunais}
        usuarios={usuarios}
        currentUserId={session?.id ?? 0}
      />
    </div>
  );
}
