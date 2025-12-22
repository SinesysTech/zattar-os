"use client";

import { useEffect, useState } from "react";
import useChatStore from "./useChatStore";
import { ChatHeader } from "./components/chat-header";
import { ChatContent } from "./components/chat-content";
import { ChatFooter } from "./components/chat-footer";
import { VideoCallDialog } from "./components/video-call-dialog";
import { CallDialog } from "./components/call-dialog";
import { IncomingCallDialog } from "./components/incoming-call-dialog";
import { UserDetailSheet } from "./components/user-detail-sheet";
import { useChatSubscription } from "../hooks/use-chat-subscription";
import { useTypingIndicator } from "../hooks/use-typing-indicator";
import { useCallNotifications } from "../hooks/use-call-notifications";
import { actionEnviarMensagem, actionBuscarHistorico, actionIniciarChamada } from "../actions/chat-actions";
import { actionIniciarChamada as actionIniciarChamadaNova } from "../actions/chamadas-actions"; // Ensure correct import
import type { MensagemComUsuario, ChatMessageData } from "../domain";
import { TipoChamada } from "../domain";

interface ChatWindowNewProps {
  currentUserId: number;
  currentUserName: string;
}

interface ActiveCallState {
  chamadaId: number;
  authToken: string;
  type: TipoChamada;
}

export function ChatWindowNew({ currentUserId, currentUserName }: ChatWindowNewProps) {
  const { selectedChat, mensagens, setMensagens, adicionarMensagem } = useChatStore();
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [audioCallOpen, setAudioCallOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);

  // Notifications Hook
  const { 
    incomingCall, 
    acceptCall, 
    rejectCall, 
    notifyCallStart 
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
        const msgs = (result.data.data as MensagemComUsuario[]).map(msg => ({
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
  useChatSubscription({
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
    await actionEnviarMensagem(selectedChat.id, conteudo, tipo, data);
  };

  const handleStartCall = async (tipo: TipoChamada) => {
    if (!selectedChat) return;

    try {
      const result = await actionIniciarChamadaNova(selectedChat.id, tipo);
      
      if (result.success && result.data) {
        const { chamadaId, meetingId, authToken } = result.data;
        
        // Broadcast notification
        await notifyCallStart(chamadaId, tipo, meetingId);

        // Set active call state
        setActiveCall({ chamadaId, authToken, type: tipo });
        
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
        type: incomingCall.tipo
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

      <VideoCallDialog 
        open={videoCallOpen} 
        onOpenChange={setVideoCallOpen}
        salaId={selectedChat.id}
        salaNome={selectedChat.name || "Chat"}
        chamadaId={activeCall?.chamadaId}
        initialAuthToken={activeCall?.type === TipoChamada.Video ? activeCall.authToken : undefined}
      />

      <CallDialog 
        open={audioCallOpen} 
        onOpenChange={setAudioCallOpen}
        salaId={selectedChat.id}
        salaNome={selectedChat.name || "Chat"}
        chamadaId={activeCall?.chamadaId}
        initialAuthToken={activeCall?.type === TipoChamada.Audio ? activeCall.authToken : undefined}
      />

      <IncomingCallDialog 
        open={!!incomingCall}
        callData={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onReject={rejectCall}
      />
    </div>
  );
}