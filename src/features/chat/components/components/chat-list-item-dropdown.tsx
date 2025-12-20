"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import useChatStore from "../useChatStore";
import { ChatItem } from "../../domain";
import { actionArquivarSala, actionDeletarSala } from "../../actions/chat-actions"; 

interface ChatUserDropdownProps {
  children: React.ReactNode;
  chat?: ChatItem;
}

export function ChatUserDropdown({ children, chat }: ChatUserDropdownProps) {
  const { toggleProfileSheet, setSelectedChat } = useChatStore();

  const handleArchive = async () => {
    if (!chat) return;
    // TODO: Call actionArquivarSala(chat.id)
    // Needs user ID? Action handles it.
    // However, action signature in plan was actionArquivarSala(id, usuarioId) in SERVICE.
    // In ACTION it should be actionArquivarSala(id).
    // I haven't implemented actionArquivarSala in action file yet.
    // I will implement it in Step 12.
    // For now I will assume it exists or comment it out.
    // console.log("Archiving", chat.id);
  };

  const handleDelete = async () => {
    if (!chat) return;
    if (confirm("Tem certeza que deseja deletar esta conversa?")) {
      await actionDeletarSala(chat.id);
      setSelectedChat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => toggleProfileSheet(true)}>Ver perfil</DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive}>Arquivar</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Bloquear</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-500">Deletar</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}