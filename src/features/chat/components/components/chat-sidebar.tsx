"use client";

import React, { useEffect } from "react";
import { Search } from "lucide-react";
import useChatStore from "../useChatStore";
import { ChatItem } from "../../domain";

import { Input } from "@/components/ui/input";
import { ChatListItem } from "./chat-list-item";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ActionDropdown } from "./action-dropdown";

interface ChatSidebarProps {
  salas: ChatItem[];
  salaAtiva: ChatItem | null;
  onSelecionarSala: (sala: ChatItem) => void;
}

export function ChatSidebar({ salas, salaAtiva, onSelecionarSala }: ChatSidebarProps) {
  const [filteredChats, setFilteredChats] = React.useState<ChatItem[]>(salas);

  useEffect(() => {
    setFilteredChats(salas);
  }, [salas]);

  const changeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    
    if (!searchTerm) {
      setFilteredChats(salas);
      return;
    }

    const filteredItems = salas.filter((chat) => {
      const name = chat.name || chat.nome || "";
      return name.toLowerCase().includes(searchTerm);
    });
    setFilteredChats(filteredItems);
  };

  return (
    <Card className="w-full pb-0 lg:w-96 flex flex-col h-full border-r rounded-none">
      <CardHeader>
        <CardTitle className="font-display text-xl lg:text-2xl">Chats</CardTitle>
        <CardAction>
          <ActionDropdown />
        </CardAction>
        <CardDescription className="relative col-span-2 mt-4 flex w-full items-center">
          <Search className="text-muted-foreground absolute start-4 size-4" />
          <Input
            type="text"
            className="ps-10"
            placeholder="Buscar conversas..."
            onChange={changeHandle}
          />
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        <div className="block min-w-0 divide-y">
          {filteredChats.length ? (
            filteredChats.map((chat) => (
              <ChatListItem
                chat={chat}
                key={chat.id}
                active={salaAtiva?.id === chat.id}
                onClick={() => onSelecionarSala(chat)}
              />
            ))
          ) : (
            <div className="text-muted-foreground mt-4 text-center text-sm">Nenhuma conversa encontrada</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}