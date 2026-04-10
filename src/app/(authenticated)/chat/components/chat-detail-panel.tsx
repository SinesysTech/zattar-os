"use client";

import React from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { generateAvatarFallback } from "@/lib/utils";
import useChatStore from "../hooks/use-chat-store";
import { UsuarioChat } from "../domain";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getSemanticBadgeVariant, type BadgeVisualVariant } from "@/lib/design-system";

/**
 * Maps online status to semantic text color classes.
 * Duplicated locally from user-detail-sheet.tsx to avoid cross-component deep imports.
 */
function getOnlineStatusColor(status: string): string {
  const variant = getSemanticBadgeVariant("online_status", status);

  const colorMap: Record<BadgeVisualVariant, string> = {
    success: "text-success",
    warning: "text-warning",
    neutral: "text-muted-foreground",
    destructive: "text-destructive",
    info: "text-info",
    default: "text-muted-foreground",
    secondary: "text-muted-foreground",
    outline: "text-muted-foreground",
    accent: "text-primary",
  };

  return colorMap[variant] || "text-muted-foreground";
}

interface ChatDetailPanelProps {
  user?: UsuarioChat;
}

export function ChatDetailPanel({ user }: ChatDetailPanelProps) {
  const { toggleProfileSheet } = useChatStore();

  if (!user) return null;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Panel header: title + close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <span className="text-sm font-semibold text-foreground">Perfil</span>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-muted-foreground/55 hover:bg-foreground/[0.04] hover:text-foreground"
          onClick={() => toggleProfileSheet(false)}
          aria-label="Fechar perfil"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Scrollable body */}
      <ScrollArea className="flex-1 px-4 py-4">
        {/* Avatar section — 56px centered */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <Avatar className="size-14 overflow-visible">
            <AvatarImage src={user.avatar} alt={user.nomeCompleto} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {generateAvatarFallback(user.nomeCompleto)}
            </AvatarFallback>
            <AvatarIndicator
              variant={user.onlineStatus || "offline"}
              className="h-4 w-4 border-2"
            />
          </Avatar>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{user.nomeCompleto}</p>
            <p className={cn("text-xs", getOnlineStatusColor(user.onlineStatus || "offline"))}>
              {user.onlineStatus === "online"
                ? "Online"
                : user.lastSeen
                  ? `Visto ${new Date(user.lastSeen).toLocaleString()}`
                  : "Offline"}
            </p>
          </div>
        </div>

        {/* Info sections — glass card style */}
        <div className="space-y-3">
          {user.about && (
            <div className="bg-foreground/[0.02] rounded-xl p-4">
              <h5 className="text-xs font-semibold uppercase text-muted-foreground/60 mb-2">
                Sobre
              </h5>
              <p className="text-sm text-muted-foreground">{user.about}</p>
            </div>
          )}
          {user.phone && (
            <div className="bg-foreground/[0.02] rounded-xl p-4">
              <h5 className="text-xs font-semibold uppercase text-muted-foreground/60 mb-2">
                Telefone
              </h5>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            </div>
          )}
          {user.country && (
            <div className="bg-foreground/[0.02] rounded-xl p-4">
              <h5 className="text-xs font-semibold uppercase text-muted-foreground/60 mb-2">
                País
              </h5>
              <p className="text-sm text-muted-foreground">{user.country}</p>
            </div>
          )}
          {user.medias && user.medias.length > 0 && (
            <div className="bg-foreground/[0.02] rounded-xl p-4">
              <h5 className="text-xs font-semibold uppercase text-muted-foreground/60 mb-3">
                Mídia
              </h5>
              <ScrollArea className="w-full">
                <div className="flex gap-2 *:shrink-0">
                  {user.medias.map(
                    (item, i) =>
                      item.type === "image" && (
                        <Image
                          key={i}
                          src={item.url}
                          alt="media"
                          width={56}
                          height={56}
                          className="size-14 rounded-lg object-cover"
                          unoptimized
                        />
                      )
                  )}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
          {user.website && (
            <div className="bg-foreground/[0.02] rounded-xl p-4">
              <h5 className="text-xs font-semibold uppercase text-muted-foreground/60 mb-2">
                Website
              </h5>
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-primary hover:underline truncate block"
              >
                {user.website}
              </a>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
