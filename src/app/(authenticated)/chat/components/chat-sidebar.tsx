"use client";

import { cn } from '@/lib/utils';
import React from "react";
import { MessageCircle, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/dashboard/search-input";
import { TabPills, type TabPillOption } from "@/components/dashboard/tab-pills";
import { Heading } from "@/components/ui/typography";
import { NovoChatDialog } from "./novo-chat-dialog";
import { ChatItem } from "../domain";
import { ChatListItem } from "./chat-list-item";

interface ChatSidebarProps {
  fixadas: ChatItem[];
  recentes: ChatItem[];
  salaAtiva: ChatItem | null;
  onSelecionarSala: (sala: ChatItem) => void;
  tabs: TabPillOption[];
  activeTab: string;
  onTabChange: (id: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  novoChatOpen: boolean;
  onNovoChatOpenChange: (open: boolean) => void;
  onlineCount?: number;
}

export function ChatSidebar({
  fixadas,
  recentes,
  salaAtiva,
  onSelecionarSala,
  tabs,
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  novoChatOpen,
  onNovoChatOpenChange,
  onlineCount,
}: ChatSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(/* design-system-escape: px-5 padding direcional sem Inset equiv.; pt-5 padding direcional sem Inset equiv. */ "px-5 pt-5 stack-default")}>
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <Heading level="page">Mensagens</Heading>
            <p className={cn( "text-[0.65rem] uppercase tracking-[0.08em] text-muted-foreground/70 font-medium")}>
              {onlineCount !== undefined ? `${onlineCount} online agora` : "Comunicacao da equipe"}
            </p>
          </div>
          <button
            onClick={() => onNovoChatOpenChange(true)}
            className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv.; */ "flex items-center inline-snug px-4 py-1 rounded-xl bg-primary text-primary-foreground text-[0.7rem] font-semibold shadow-sm hover:bg-primary/90 hover:-translate-y-px transition-all cursor-pointer")}
          >
            <Plus className="size-3" />
            Nova
          </button>
        </div>

        {/* Search (SIDE-03) */}
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Buscar conversas, pessoas..."
          className="w-full"
        />

        {/* Tab pills (SIDE-02) */}
        <TabPills tabs={tabs} active={activeTab} onChange={onTabChange} />
      </div>

      {/* Conversation list */}
      <div className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv. */ "flex-1 overflow-y-auto px-2 scrollbar-thin")}>
        {fixadas.length > 0 && (
          <>
            <p className={cn(/* design-system-escape: tracking-widest sem token DS; px-2 padding direcional sem Inset equiv.; pt-4 padding direcional sem Inset equiv.; pb-2 padding direcional sem Inset equiv. */ "text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground/55 px-2 pt-4 pb-2")}>
              Fixadas
            </p>
            {fixadas.map(sala => (
              <ChatListItem
                key={sala.id}
                chat={sala}
                active={salaAtiva?.id === sala.id}
                onClick={() => onSelecionarSala(sala)}
              />
            ))}
          </>
        )}
        {(fixadas.length > 0 || recentes.length > 0) && (
          <p className={cn(/* design-system-escape: tracking-widest sem token DS; px-2 padding direcional sem Inset equiv.; pt-4 padding direcional sem Inset equiv.; pb-2 padding direcional sem Inset equiv. */ "text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground/55 px-2 pt-4 pb-2")}>
            Recentes
          </p>
        )}
        {recentes.length > 0 ? (
          recentes.map(sala => (
            <ChatListItem
              key={sala.id}
              chat={sala}
              active={salaAtiva?.id === sala.id}
              onClick={() => onSelecionarSala(sala)}
            />
          ))
        ) : fixadas.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Nenhuma conversa"
            description="Nenhuma conversa encontrada. Inicie uma nova conversa."
            className={cn(/* design-system-escape: py-8 padding direcional sem Inset equiv. */ "py-8")}
          />
        ) : null}
      </div>

      {/* NovoChatDialog (triggered by button above) */}
      <NovoChatDialog open={novoChatOpen} onOpenChange={onNovoChatOpenChange} />
    </div>
  );
}
