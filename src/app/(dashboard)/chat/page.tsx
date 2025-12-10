import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { chatService } from ' @/core/chat';
import { getSupabase } from ' @/core/app/_lib/supabase';
import { ChatLayout } from ' @/components/modules/chat/chat-layout';
import { RoomList } from ' @/components/modules/chat/room-list';
import { ChatWindow } from ' @/components/modules/chat/chat-window';
import { Skeleton } from ' @/components/ui/skeleton';

async function getCurrentUserId(): Promise<number | null> {
  const { supabase } = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
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
  searchParams: { channelId?: string };
}) {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) redirect('/login');

  // Buscar lista de salas
  const salasResult = await chatService.listarSalasDoUsuario(usuarioId, { limite: 50 });
  if (salasResult.isErr()) {
    return <div>Erro ao carregar salas: {salasResult.error.message}</div>;
  }

  const salas = salasResult.value.data;

  // Determinar sala ativa (via URL ou Sala Geral)
  const channelId = searchParams.channelId ? parseInt(searchParams.channelId) : null;
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
  let initialMessages: any[] = [];
  if (salaAtiva) {
    const historicoResult = await chatService.buscarUltimasMensagens(salaAtiva.id, 100);
    if (historicoResult.isOk()) {
      initialMessages = historicoResult.value;
    }
  }

  // Buscar dados do usuário
  const { supabase } = getSupabase();
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
            <RoomList
              salas={salas}
              salaAtiva={salaAtiva}
              onSelectSala={(sala) => {
                window.location.href = `/chat?channelId=${sala.id}`;
              }}
            />
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