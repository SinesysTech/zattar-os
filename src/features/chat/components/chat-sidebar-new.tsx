"use client";

import React, { useEffect } from "react";
import { ChatItem } from "../domain";
import { ChatSidebar } from "./components/chat-sidebar";
import useChatStore from "./useChatStore";

interface ChatSidebarNewProps {
  salas: ChatItem[];
  currentUserId: number;
}

export function ChatSidebarNew({ salas: salasIniciais, currentUserId }: ChatSidebarNewProps) {
  const { selectedChat, setSelectedChat, salas, setSalas } = useChatStore();

  // Inicializar salas no store quando o componente montar
  useEffect(() => {
    setSalas(salasIniciais);
  }, [salasIniciais, setSalas]);

  const handleSelectSala = (sala: ChatItem) => {
    setSelectedChat(sala);
  };

  // Usar salas do store (reativas) ou as iniciais se o store ainda não foi populado
  const salasParaExibir = salas.length > 0 ? salas : salasIniciais;

  return (
    <ChatSidebar
      salas={salasParaExibir}
      salaAtiva={selectedChat}
      onSelecionarSala={handleSelectSala}
      currentUserId={currentUserId}
    />
  );
}
