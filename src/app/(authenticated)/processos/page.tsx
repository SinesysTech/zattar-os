import { authenticateRequest } from '@/lib/auth/session';
import { ProcessosClient } from './processos-client';
import { listarProcessos } from './service';
import { obterEstatisticasProcessos } from './service-estatisticas';
import { usuarioRepository } from '@/app/(authenticated)/usuarios/repository';
import type { ProcessoUnificado } from './domain';

interface ProcessosPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProcessosPage({ searchParams: _ }: ProcessosPageProps) {
  const session = await authenticateRequest();

  const [processosResult, stats, usuariosResult] = await Promise.all([
    listarProcessos({ pagina: 1, limite: 50, unified: true }),
    obterEstatisticasProcessos(),
    usuarioRepository.findAll({ ativo: true }),
  ]);

  const processos: ProcessoUnificado[] = processosResult.success
    ? (processosResult.data.data as ProcessoUnificado[])
    : [];
  const total = processosResult.success ? processosResult.data.pagination.total : 0;

  const usuarios = usuariosResult.usuarios.map((u) => ({
    id: u.id,
    nomeExibicao: u.nomeExibicao,
    avatarUrl: u.avatarUrl ?? null,
  }));

  return (
    <ProcessosClient
      initialProcessos={processos}
      initialTotal={total}
      initialStats={stats}
      usuarios={usuarios}
      currentUserId={session?.id ?? 0}
    />
  );
}
