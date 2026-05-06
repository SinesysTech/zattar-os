/**
 * @component CustomParticipantList
 * @description Lista de participantes para chamadas Dyte
 * @note Este componente é lazy-loaded via next/dynamic no parent (VideoCallDialog/CallDialog)
 *       que carrega CustomMeetingUI de forma assíncrona para otimização de bundle
 * @see src/features/chat/components/video-call-dialog.tsx
 */
import { useDyteSelector } from "@dytesdk/react-web-core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { Heading, Text } from '@/components/ui/typography';
import { cn } from "@/lib/utils";
import { Mic, MicOff, Users, Video, VideoOff } from "lucide-react";
import { memo, useMemo } from "react";

interface DyteParticipant {
  id: string;
  name?: string;
  picture?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface CustomParticipantListProps {
  isVisible: boolean;
  className?: string;
}

export const CustomParticipantList = memo(function CustomParticipantList({ isVisible, className }: CustomParticipantListProps) {
  const joinedParticipants = useDyteSelector((m) => m.participants.joined);
  const participants = useMemo(() => [...joinedParticipants.toArray()], [joinedParticipants]);
  const self = useDyteSelector((m) => m.self);

  // Add self to list if not already there (Dyte usually separates self)
  const allParticipants = useMemo(() => [self, ...participants].filter(Boolean), [self, participants]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "absolute right-4 top-4 bottom-24 w-64 bg-video-surface/90 backdrop-blur-md rounded-lg border border-video-border shadow-lg z-30 flex flex-col",
      "animate-in slide-in-from-right-10 duration-300",
      className
    )}>
      <div className={cn("inset-card-compact border-b border-video-border flex justify-between items-center")}>
        <Heading level="widget" className="text-video-text">Participantes ({allParticipants.length})</Heading>
        {/* Close button for mobile could go here */}
      </div>

      <ScrollArea className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex-1 p-2")}>
        {allParticipants.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sem participantes"
            description="Aguardando participantes entrarem na chamada."
            className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv.; [&_h3]:text-sm sem equivalente DS; [&_p]:text-xs sem equivalente DS */ "py-6 [&_h3]:text-sm [&_h3]:text-video-text [&_p]:text-xs [&_p]:text-video-muted [&>div:first-child]:mb-2 [&>div:first-child]:h-12 [&>div:first-child]:w-12 [&_svg]:h-6 [&_svg]:w-6 [&>div:first-child]:bg-video-surface-hover")}
          />
        ) : (
          <div className={cn("stack-micro")}>
            {allParticipants.map((p: DyteParticipant) => (
              <div key={p.id} className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex items-center inline-medium p-3 hover:bg-video-surface-hover/50 transition-colors rounded-lg group")}>
                {/* Avatar */}
                <div className={cn(
                   "w-10 h-10 rounded-full flex items-center justify-center text-body-sm font-bold text-video-text shadow-sm",
                  "bg-linear-to-br from-info to-primary",
                  p.audioEnabled && "ring-2 ring-success"
                )}>
                  {p.picture ? (

                    <img src={p.picture} alt={p.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{p.name?.charAt(0)?.toUpperCase() ?? "?"}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn( "text-body-sm font-medium text-video-text truncate")}>
                    {p.name} {p.id === self?.id && "(Você)"}
                  </p>
                  <Text variant="caption" className="text-video-muted">
                    {p.id === self?.id ? "Conectado" : "Na chamada"}
                  </Text>
                </div>

                {/* Status Icons */}
                <div className={cn("flex inline-tight")}>
                  {p.audioEnabled ? (
                    <Mic className="w-3 h-3 text-success" />
                  ) : (
                    <MicOff className="w-3 h-3 text-destructive" />
                  )}
                  {p.videoEnabled ? (
                    <Video className="w-3 h-3 text-info" />
                  ) : (
                    <VideoOff className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});
