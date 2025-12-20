"use client";

import React, { useEffect, useState } from "react";
import useChatStore from "./useChatStore";
import { ChatHeader } from "./components/chat-header";
import { ChatContent } from "./components/chat-content";
import { ChatFooter } from "./components/chat-footer";
import { VideoCallDialog } from "./components/video-call-dialog";
import { CallDialog } from "./components/call-dialog";
import { UserDetailSheet } from "./components/user-detail-sheet";
import { useChatSubscription } from "../hooks/use-chat-subscription";
import { useTypingIndicator } from "../hooks/use-typing-indicator";
import { actionEnviarMensagem, actionBuscarHistorico } from "../actions/chat-actions";
import { ChatItem, MensagemComUsuario } from "../domain";

interface ChatWindowNewProps {
  currentUserId: number;
  currentUserName: string;
}

export function ChatWindowNew({ currentUserId, currentUserName }: ChatWindowNewProps) {
  const { selectedChat, mensagens, setMensagens, adicionarMensagem } = useChatStore();
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [audioCallOpen, setAudioCallOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Typing Indicator
  const { typingIndicatorText, startTyping, stopTyping } = useTypingIndicator(
    selectedChat?.id || 0,
    currentUserId,
    currentUserName
  );

  // Carregar histórico ao selecionar sala
  useEffect(() => {
    if (selectedChat) {
      setLoadingHistory(true);
      actionBuscarHistorico(selectedChat.id, 50).then((result) => {
        if (result.success && result.data) {
          const msgs = (result.data.data as MensagemComUsuario[]).map(msg => ({
            ...msg,
            ownMessage: msg.usuarioId === currentUserId
          }));
          setMensagens(msgs);
        }
        setLoadingHistory(false);
      });
    } else {
      setMensagens([]);
    }
  }, [selectedChat, setMensagens, currentUserId]);

  // Subscription Realtime
  useChatSubscription({
    salaId: selectedChat?.id || 0,
    onNewMessage: (msg) => {
       adicionarMensagem(msg);
    },
    enabled: !!selectedChat,
    currentUserId
  });

  const handleEnviarMensagem = async (conteudo: string, tipo: string = 'texto', data?: any) => {
    if (!selectedChat) return;
    
    // Parar indicador de digitação imediatamente ao enviar
    stopTyping();

    await actionEnviarMensagem(selectedChat.id, conteudo, tipo, data);
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
        currentUserId={currentUserId}
        onVideoCall={() => setVideoCallOpen(true)}
        onAudioCall={() => setAudioCallOpen(true)}
      />
      
      <ChatContent 
        mensagens={mensagens} 
        currentUserId={currentUserId} 
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
      />

      <CallDialog 
        open={audioCallOpen} 
        onOpenChange={setAudioCallOpen}
        salaId={selectedChat.id}
        salaNome={selectedChat.name || "Chat"}
      />
    </div>
  );
}