import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Skeleton } from '@/components/ui/skeleton';
import {
  createChatService,
  ChatLayout,
  ChatSidebar,
  ChatWindow,
  type MensagemComUsuario,
} from '@/features/chat';

async function getCurrentUserId(): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('usuarios')
    .select('id, nome_completo, nome_exibicao')
    .eq('auth_user_id', user.id)
    .single();

  return data?.id || null;
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ channelId?: string }>;
}) {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) redirect('/login');

  // Criar instância do service
  const chatService = await createChatService();

  // Buscar lista de salas
  const salasResult = await chatService.listarSalasDoUsuario(usuarioId, { limite: 50 });
  if (salasResult.isErr()) {
    return <div>Erro ao carregar salas: {salasResult.error.message}</div>;
  }

  const salas = salasResult.value.data;

  // Determinar sala ativa (via URL ou Sala Geral)
  const params = await searchParams;
  const channelId = params.channelId ? parseInt(params.channelId) : null;
  let salaAtiva = channelId ? salas.find((s) => s.id === channelId) : null;

  if (!salaAtiva) {
    const salaGeralResult = await chatService.buscarSalaGeral();
    if (salaGeralResult.isOk() && salaGeralResult.value) {
      salaAtiva = salaGeralResult.value;
    } else {
      salaAtiva = salas[0] || null;
    }
  }

  // Buscar histórico inicial da sala ativa
  let initialMessages: MensagemComUsuario[] = [];
  if (salaAtiva) {
    const historicoResult = await chatService.buscarUltimasMensagens(salaAtiva.id, 100);
    if (historicoResult.isOk()) {
      initialMessages = historicoResult.value;
    }
  }

  // Buscar dados do usuário
  const supabase = await createClient();
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nome_completo, nome_exibicao')
    .eq('id', usuarioId)
    .single();

  const currentUserName = usuario?.nome_exibicao || usuario?.nome_completo || 'Usuário';

  return (
    <div className="flex h-full flex-col">
      <ChatLayout
        sidebar={
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <ChatSidebar salas={salas} salaAtiva={salaAtiva} />
          </Suspense>
        }
        main={
          salaAtiva ? (
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <ChatWindow
                salaId={salaAtiva.id}
                initialMessages={initialMessages}
                currentUserId={usuarioId}
                currentUserName={currentUserName}
              />
            </Suspense>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Selecione uma sala para começar</p>
            </div>
          )
        }
      />
    </div>
  );
}
