import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/session';
import { buscarProgressoDiario, type ProgressoDiario } from './repositories/progresso-diario';
import { actionListarLembretes } from './actions';
import * as tarefasService from '@/app/app/tarefas/service';
import type { Task } from '@/app/app/tarefas/domain';
import type { Lembrete } from './domain';
import { DashboardUnificada } from './components/dashboard-unificada';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Dashboard',
    description: 'Visão geral do sistema com indicadores e painéis principais.',
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUserId = 0;
  let currentUserName = 'Usuário';

  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nome_exibicao, nome_completo')
      .eq('auth_user_id', user.id)
      .single();

    if (usuario) {
      currentUserId = usuario.id;
      currentUserName = usuario.nome_exibicao || usuario.nome_completo || 'Usuário';
    }
  }

  // Fetch server-side data in parallel
  const authUser = await authenticateRequest();

  const [progressoResult, lembretesResult, tarefasResult] = await Promise.allSettled([
    buscarProgressoDiario(currentUserId),
    actionListarLembretes({ concluido: false, limite: 10 }),
    authUser ? tarefasService.listarTarefas(authUser.id, { limit: 5 }) : Promise.resolve({ success: true as const, data: [] as Task[] }),
  ]);

  const defaultProgresso: ProgressoDiario = {
    total: 0, concluidos: 0, percentual: 0,
    detalhes: {
      audiencias: { total: 0, concluidas: 0 },
      expedientes: { total: 0, concluidos: 0 },
      pericias: { total: 0, concluidas: 0 },
      tarefas: { total: 0, concluidas: 0 },
    },
  };

  const progresso: ProgressoDiario =
    progressoResult.status === 'fulfilled' ? progressoResult.value : defaultProgresso;

  const lembretes: Lembrete[] =
    lembretesResult.status === 'fulfilled' && lembretesResult.value.success
      ? (lembretesResult.value.data ?? [])
      : [];

  const tarefas: Task[] =
    tarefasResult.status === 'fulfilled' && tarefasResult.value.success
      ? (tarefasResult.value.data ?? [])
      : [];

  return (
    <DashboardUnificada
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      initialProgresso={progresso}
      initialLembretes={lembretes}
      initialTarefas={tarefas}
    />
  );
}
