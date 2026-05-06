import { cn } from "@/lib/utils";
import { generateAvatarFallback } from "@/lib/avatar-url";
import { ChatItem } from "../domain";
import { Ellipsis } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatUserDropdown } from "./chat-list-item-dropdown";

interface ChatListItemProps {
  chat: ChatItem;
  active: boolean;
  onClick: () => void;
}

export function ChatListItem({ chat, active, onClick }: ChatListItemProps) {
  const unreadCount = chat.unreadCount || 0;

  return (
    <div
      className={cn(
        /* design-system-escape: gap-3 gap sem token DS; p-3 → usar <Inset> */ "group/item flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
        "border border-transparent relative",
        active
          ? "bg-chat-sidebar-active border-primary/8"
          : "hover:bg-foreground/3"
      )}
      onClick={onClick}
    >
      {/* Active rail — Glass Briefing: 3px left bar indicator (kit pattern) */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-2 bottom-2 w-0.75rounded-r-full bg-primary transition-opacity duration-200",
          active ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Avatar circular 32px (spec Glass Briefing ChatPanel.jsx) */}
      <div className="relative size-8 shrink-0">
        <div className="size-full rounded-full overflow-hidden">
          {chat.image ? (
            <img src={chat.image} alt={chat.name || chat.nome} className="size-full object-cover" />
          ) : (
            <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "size-full flex items-center justify-center bg-primary/12 text-primary text-[11px] font-semibold")}>
              {generateAvatarFallback(chat.name || chat.nome)}
            </div>
          )}
        </div>
        {/* Online indicator dot — outside overflow-hidden so it's not clipped */}
        <div className={cn(
          "absolute -bottom-px -right-px size-2 rounded-full border-2 border-surface-container-low z-10",
          chat.usuario?.onlineStatus === 'online' ? "bg-success" : "bg-muted-foreground/30"
        )} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className={cn("flex items-center justify-between inline-tight")}>
          <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[0.8rem] font-semibold text-foreground truncate")}>
            {chat.name || chat.nome}
          </span>
          <span className="text-[0.6rem] text-muted-foreground/65 tabular-nums shrink-0">
            {chat.date ? new Date(chat.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <div className={cn("flex items-center justify-between inline-tight mt-1")}>
          <span className="text-[0.7rem] text-muted-foreground/70 truncate flex-1">
            {chat.lastMessage}
          </span>
          {unreadCount > 0 && (
            <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; px-1 padding direcional sem Inset equiv. */ "min-w-4.5 h-[h-4.5unded-full bg-primary text-white text-[0.6rem] font-semibold flex items-center justify-center px-1 shrink-0")}>
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Hover dropdown (keep existing) */}
      <div
        className="absolute inset-e-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <ChatUserDropdown chat={chat}>
          <Button size="icon" aria-label="Mais opcoes" variant="ghost" className="rounded-full h-8 w-8">
            <Ellipsis className="h-4 w-4" />
          </Button>
        </ChatUserDropdown>
      </div>
    </div>
  );
}
