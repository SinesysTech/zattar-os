"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import useChatStore from "./useChatStore";
import { ChatHeader } from "./chat-header";
import { ChatContent } from "./chat-content";
import { ChatFooter } from "./chat-footer";
import { IncomingCallDialog } from "./incoming-call-dialog";
import { MeetingSkeleton } from "./meeting-skeleton";

// Lazy load heavy call components
const VideoCallDialog = lazy(() => 
  import('./video-call-dialog').then(m => ({ default: m.VideoCallDialog }))
);

const CallDialog = lazy(() => 
  import('./call-dialog').then(m => ({ default: m.CallDialog }))
);
import { CallSetupDialog } from "./call-setup-dialog";
import { UserDetailSheet } from "./user-detail-sheet";
import { useChatSubscription } from "../hooks/use-chat-subscription";
import { useTypingIndicator } from "../hooks/use-typing-indicator";
import { useCallNotifications } from "../hooks/use-call-notifications";
import { actionEnviarMensagem, actionBuscarHistorico } from "../actions/chat-actions";
import { actionIniciarChamada } from "../actions/chamadas-actions"; 
import type { MensagemComUsuario, MensagemChat, ChatMessageData, SelectedDevices, PaginatedResponse } from "../domain";
import { TipoChamada } from "../domain";

interface ChatWindowProps {
  currentUserId: number;
  currentUserName: string;
}

interface ActiveCallState {
  chamadaId: number;
  authToken: string;
  type: TipoChamada;
  isInitiator?: boolean;
}

export function ChatWindow({ currentUserId, currentUserName }: ChatWindowProps) {
  const { selectedChat, mensagens, setMensagens, adicionarMensagem, atualizarMensagem } = useChatStore();
  
  // States for Call Dialogs
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [audioCallOpen, setAudioCallOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);

  // States for Setup Dialog
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [setupCallType, setSetupCallType] = useState<TipoChamada>(TipoChamada.Video);
  const [selectedDevices, setSelectedDevices] = useState<SelectedDevices | undefined>(undefined);

  // Notifications Hook
  const { 
    incomingCall, 
    acceptCall, 
    rejectCall, 
    notifyCallStart,
    notifyCallEnded,
    notifyScreenshareStart,
    notifyScreenshareStop
  } = useCallNotifications({
    salaId: selectedChat?.id || 0,
    currentUserId,
    currentUserName,
    enabled: !!selectedChat
  });

  // Typing Indicator
  const { typingIndicatorText, startTyping, stopTyping } = useTypingIndicator(
    selectedChat?.id || 0,
    currentUserId,
    currentUserName
  );

  // Carregar histórico ao selecionar sala
  useEffect(() => {
    if (!selectedChat) {
      setMensagens([]);
      return;
    }

    let cancelled = false;

    actionBuscarHistorico(selectedChat.id, 50).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        const paginatedData = result.data as PaginatedResponse<MensagemComUsuario>;
        const msgs = paginatedData.data.map(msg => ({
          ...msg,
          ownMessage: msg.usuarioId === currentUserId
        }));
        setMensagens(msgs);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.id, setMensagens, currentUserId]);

  // Subscription Realtime
  const { broadcastNewMessage } = useChatSubscription({
    salaId: selectedChat?.id || 0,
    onNewMessage: (msg) => {
       adicionarMensagem(msg);
    },
    enabled: !!selectedChat,
    currentUserId
  });

  const handleEnviarMensagem = async (conteudo: string, tipo: string = 'texto', data?: ChatMessageData | null) => {
    if (!selectedChat) return;
    stopTyping();

    // 1. Criar mensagem temporária (optimistic update)
    const tempId = -Date.now(); // ID negativo para identificar como temporário
    const now = new Date().toISOString();
    const tempMessage: MensagemComUsuario = {
      id: tempId,
      salaId: selectedChat.id,
      usuarioId: currentUserId,
      conteudo,
      tipo: tipo as MensagemComUsuario['tipo'],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      status: 'sending',
      ownMessage: true,
      data: data ?? undefined,
      usuario: {
        id: currentUserId,
        nomeCompleto: currentUserName,
        nomeExibicao: currentUserName,
        emailCorporativo: null,
      }
    };

    // 2. Adicionar ao store imediatamente
    adicionarMensagem(tempMessage);

    // 3. Enviar ao servidor
    const result = await actionEnviarMensagem(selectedChat.id, conteudo, tipo, data);

    if (!result.success) {
      // 4a. Erro: marcar como falha
      atualizarMensagem(tempId, { status: 'failed' });
      console.error('Erro ao enviar mensagem:', result.message);
      return;
    }

    // 4b. Sucesso: atualizar com dados reais do servidor
    // O Realtime também vai receber, mas o store vai substituir automaticamente
    if (result.data) {
      const mensagemData = result.data as MensagemChat;
      atualizarMensagem(tempId, {
        id: mensagemData.id,
        status: 'sent',
        createdAt: mensagemData.createdAt
      });

      // Fallback de entrega: broadcast para destinatários (não depende de Postgres Changes)
      await broadcastNewMessage({
        id: mensagemData.id,
        salaId: mensagemData.salaId,
        usuarioId: mensagemData.usuarioId,
        conteudo: mensagemData.conteudo,
        tipo: mensagemData.tipo as MensagemComUsuario['tipo'],
        createdAt: mensagemData.createdAt,
        updatedAt: mensagemData.updatedAt,
        deletedAt: mensagemData.deletedAt,
        status: mensagemData.status ?? 'sent',
        data: mensagemData.data ?? undefined,
      });
    }
  };

  const handleStartCall = (tipo: TipoChamada) => {
    setSetupCallType(tipo);
    setSetupDialogOpen(true);
  };

  const handleJoinFromSetup = async (devices: SelectedDevices) => {
    if (!selectedChat) return;
    
    setSelectedDevices(devices);
    // Setup dialog will be closed by its onOpenChange prop logic or here if needed, 
    // but usually we close it after success or let the dialog handle it.
    // The dialog logic calls this then closes itself via prop or we close it here.
    // Let's close it here to be sure.
    setSetupDialogOpen(false);

    const tipo = setupCallType;

    try {
      const result = await actionIniciarChamada(selectedChat.id, tipo);
      
      if (result.success && result.data) {
        const { chamadaId, meetingId, authToken } = result.data;
        
        // Broadcast notification
        await notifyCallStart(chamadaId, tipo, meetingId);
        
        // Set active call state
        setActiveCall({ chamadaId, authToken, type: tipo, isInitiator: true });
        
        if (tipo === TipoChamada.Video) {
          setVideoCallOpen(true);
        } else {
          setAudioCallOpen(true);
        }
      } else {
        console.error("Erro ao iniciar chamada:", result.message);
        // TODO: Show toast error
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    
    const result = await acceptCall();
    if (result) {
      setActiveCall({
        chamadaId: incomingCall.chamadaId,
        authToken: result.authToken,
        type: incomingCall.tipo,
        isInitiator: false
      });
      
      if (incomingCall.tipo === TipoChamada.Video) {
        setVideoCallOpen(true);
      } else {
        setAudioCallOpen(true);
      }
    }
  };

  if (!selectedChat) {
    return (
      <div className="hidden h-full flex-1 items-center justify-center lg:flex bg-muted/20">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col flex-1 relative bg-background">
      <ChatHeader
        sala={selectedChat}
        onVideoCall={() => handleStartCall(TipoChamada.Video)}
        onAudioCall={() => handleStartCall(TipoChamada.Audio)}
      />
      
      <ChatContent
        mensagens={mensagens}
        salaAtiva={selectedChat}
      />
      
      <ChatFooter 
        salaId={selectedChat.id} 
        onEnviarMensagem={handleEnviarMensagem}
        onTyping={startTyping}
        typingIndicatorText={typingIndicatorText}
      />

      <UserDetailSheet user={selectedChat.usuario} />

      <CallSetupDialog
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
        tipo={setupCallType}
        salaNome={selectedChat.name || "Chat"}
        onJoinCall={handleJoinFromSetup}
      />

      <Suspense fallback={<MeetingSkeleton />}>
        <VideoCallDialog 
          open={videoCallOpen} 
          onOpenChange={setVideoCallOpen}
          salaId={selectedChat.id}
          salaNome={selectedChat.name || "Chat"}
          chamadaId={activeCall?.chamadaId}
          initialAuthToken={activeCall?.type === TipoChamada.Video ? activeCall.authToken : undefined}
          isInitiator={activeCall?.isInitiator}
          selectedDevices={selectedDevices}
          onCallEnd={activeCall?.chamadaId ? () => notifyCallEnded(activeCall.chamadaId) : undefined}
          onScreenshareStart={activeCall?.chamadaId ? () => notifyScreenshareStart(activeCall.chamadaId) : undefined}
          onScreenshareStop={activeCall?.chamadaId ? () => notifyScreenshareStop(activeCall.chamadaId) : undefined}
        />
      </Suspense>

      <Suspense fallback={<MeetingSkeleton />}>
        <CallDialog 
          open={audioCallOpen} 
          onOpenChange={setAudioCallOpen}
          salaId={selectedChat.id}
          salaNome={selectedChat.name || "Chat"}
          chamadaId={activeCall?.chamadaId}
          initialAuthToken={activeCall?.type === TipoChamada.Audio ? activeCall.authToken : undefined}
          isInitiator={activeCall?.isInitiator}
          selectedDevices={selectedDevices}
          onCallEnd={activeCall?.chamadaId ? () => notifyCallEnded(activeCall.chamadaId) : undefined}
          onScreenshareStart={activeCall?.chamadaId ? () => notifyScreenshareStart(activeCall.chamadaId) : undefined}
          onScreenshareStop={activeCall?.chamadaId ? () => notifyScreenshareStop(activeCall.chamadaId) : undefined}
        />
      </Suspense>

      <IncomingCallDialog 
        open={!!incomingCall}
        callData={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onReject={rejectCall}
      />
    </div>
  );
}