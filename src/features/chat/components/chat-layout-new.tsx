"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import useChatStore from "./useChatStore";
import { ChatSidebarNew } from "./chat-sidebar-new";
import { ChatWindowNew } from "./chat-window-new";
import { ChatItem } from "../domain";

interface ChatLayoutNewProps {
  salas: ChatItem[];
  currentUserId: number;
  currentUserName: string;
  initialSelectedChat?: ChatItem | null;
}

export function ChatLayoutNew({ salas, currentUserId, currentUserName, initialSelectedChat }: ChatLayoutNewProps) {
  const { selectedChat, setSelectedChat } = useChatStore();

  useEffect(() => {
    // Only set if not set (or force? usually init only)
    // If deep linking is important, we force it.
    if (initialSelectedChat && !selectedChat) {
      setSelectedChat(initialSelectedChat);
    }
  }, [initialSelectedChat, selectedChat, setSelectedChat]);

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background border rounded-lg shadow-sm">
      {/* Sidebar - Hidden on mobile if chat selected */}
      <div 
        className={cn(
          "h-full w-full lg:w-96 border-r shrink-0 transition-all duration-300",
          selectedChat ? "hidden lg:block" : "block"
        )}
      >
        <ChatSidebarNew salas={salas} currentUserId={currentUserId} />
      </div>

      {/* Window - Hidden on mobile if no chat selected */}
      <div 
        className={cn(
          "h-full flex-1 min-w-0 bg-background transition-all duration-300",
          !selectedChat ? "hidden lg:flex" : "flex"
        )}
      >
        <ChatWindowNew currentUserId={currentUserId} currentUserName={currentUserName} />
      </div>
    </div>
  );
}