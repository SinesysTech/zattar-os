import { cn } from "@/lib/utils";
import { generateAvatarFallback } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MensagemComUsuario } from "../domain";
import { ChatBubble } from "./chat-bubbles";

interface MessageGroupProps {
  messages: MensagemComUsuario[];
  isOwn: boolean;
  isGroupChat: boolean; // true for tipo === 'grupo' || tipo === 'geral'
}

export function MessageGroup({ messages, isOwn, isGroupChat }: MessageGroupProps) {
  if (messages.length === 0) return null;

  const lastMessage = messages[messages.length - 1];
  const firstMessage = messages[0];
  const usuario = lastMessage.usuario;
  const displayName = usuario.nomeExibicao || usuario.nomeCompleto;
  const fallback = generateAvatarFallback(displayName);

  return (
    <div
      className={cn(
        "flex gap-[0.625rem] max-w-[70%]",
        isOwn ? "self-end flex-row-reverse" : "self-start"
      )}
    >
      {/* Avatar column — 28px, aligned to bottom, invisible for own messages */}
      <div className="self-end shrink-0">
        <Avatar
          className={cn(
            "size-7 rounded-lg",
            isOwn && "invisible"
          )}
        >
          <AvatarImage src={usuario.avatar} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-primary text-[0.625rem] font-semibold rounded-lg">
            {fallback}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Messages column */}
      <div className="flex flex-col gap-1">
        {/* Sender name — only for group chats, only on first bubble */}
        {isGroupChat && !isOwn && (
          <p className="text-[0.625rem] font-semibold text-primary opacity-60 mb-1 pl-[0.125rem]">
            {firstMessage.usuario.nomeExibicao || firstMessage.usuario.nomeCompleto}
          </p>
        )}

        {/* Render each message bubble */}
        {messages.map((msg, index) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isFirstInGroup={index === 0}
            isLastInGroup={index === messages.length - 1}
            showTimestamp={index === messages.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
