"use client";

import React from "react";
import { ArrowLeft, Ellipsis, VideoIcon, PhoneMissedIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAvatarFallback } from "@/lib/utils";
import useChatStore from "../useChatStore";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatUserDropdown } from "./chat-list-item-dropdown";
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator } from "@/components/ui/avatar";
import { ChatItem } from "../../domain";

interface ChatHeaderProps {
  sala: ChatItem;
  currentUserId: number;
  onVideoCall: () => void;
  onAudioCall: () => void;
}

export function ChatHeader({ sala, currentUserId, onVideoCall, onAudioCall }: ChatHeaderProps) {
  const { setSelectedChat } = useChatStore();

  const isGroup = sala.tipo === 'grupo' || sala.tipo === 'geral';
  const name = sala.name;
  const image = sala.image;
  const onlineStatus = sala.usuario?.onlineStatus || 'offline';
  const lastSeen = sala.usuario?.lastSeen;

  return (
    <div className="flex justify-between gap-4 lg:px-4 p-2 border-b">
      <div className="flex gap-4 items-center">
        <Button
          size="sm"
          variant="outline"
          className="flex size-10 p-0 lg:hidden"
          onClick={() => setSelectedChat(null)}>
          <ArrowLeft />
        </Button>
        <Avatar className="overflow-visible lg:size-10">
          <AvatarImage src={image} alt={name} />
          {!isGroup && <AvatarIndicator variant={onlineStatus} />}
          <AvatarFallback>{generateAvatarFallback(name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{name}</span>
          {!isGroup && (
            onlineStatus === "online" ? (
              <span className="text-xs text-green-500">Online</span>
            ) : (
              <span className="text-muted-foreground text-xs">
                {lastSeen ? `Visto por último ${new Date(lastSeen).toLocaleString()}` : 'Offline'}
              </span>
            )
          )}
          {isGroup && (
            <span className="text-muted-foreground text-xs">
               {sala.tipo === 'geral' ? 'Sala Geral' : 'Grupo'}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="hidden lg:flex lg:gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" onClick={onVideoCall}>
                  <VideoIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Video Call</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" onClick={onAudioCall}>
                  <PhoneMissedIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Audio Call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <ChatUserDropdown chat={sala}>
          <Button size="icon" variant="ghost">
            <Ellipsis />
          </Button>
        </ChatUserDropdown>
      </div>
    </div>
  );
}