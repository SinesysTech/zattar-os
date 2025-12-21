"use client";

import React from "react";
import { ChatItem } from "../domain";
import { ChatSidebar } from "./components/chat-sidebar";
import useChatStore from "./useChatStore";

interface ChatSidebarNewProps {
  salas: ChatItem[];
}

export function ChatSidebarNew({ salas }: ChatSidebarNewProps) {
  const { selectedChat, setSelectedChat } = useChatStore();

  const handleSelectSala = (sala: ChatItem) => {
    setSelectedChat(sala);
  };

  return (
    <ChatSidebar
      salas={salas}
      salaAtiva={selectedChat}
      onSelecionarSala={handleSelectSala}
    />
  );
}
