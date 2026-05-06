import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { X, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading, Text } from '@/components/ui/typography';
import { TranscriptSegment } from "../hooks/use-transcription";

interface LiveTranscriptPanelProps {
  transcripts: TranscriptSegment[];
  isVisible: boolean;
  onClose: () => void;
}

export function LiveTranscriptPanel({ transcripts, isVisible, onClose }: LiveTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (isVisible && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcripts, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute right-2 top-16 bottom-20 w-[calc(100%-1rem)] sm:right-4 sm:top-20 sm:bottom-24 sm:w-80 bg-black/80 backdrop-blur-md border border-video-surface-hover rounded-lg shadow-lg flex flex-col z-50 transition-all duration-300 animate-in slide-in-from-right-10">
      <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex items-center justify-between p-3 border-b border-video-surface-hover")}>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 text-video-text")}>
          <MessageSquareText className="w-4 h-4" />
          <Heading level="widget">Transcrição em Tempo Real</Heading>
        </div>
        <Button
          variant="ghost"
          size="icon" aria-label="Fechar"
          className="h-6 w-6 text-video-muted hover:text-video-text"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "flex-1 p-4")} ref={scrollRef}>
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex flex-col gap-3")}>
          {transcripts.length === 0 ? (
            <div className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; py-8 padding direcional sem Inset equiv. */ "text-center text-video-muted text-sm py-8")}>
              Aguardando fala...
            </div>
          ) : (
            transcripts.map((segment) => (
              <div key={segment.id} className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col gap-1")}>
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center justify-between gap-2")}>
                  <Text variant="caption" className="font-bold text-info truncate max-w-37.5">
                    {segment.participantName}
                  </Text>
                  <span className="text-[10px] text-video-muted">
                    {new Date(segment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className={cn(
                  /* design-system-escape: text-sm → migrar para <Text variant="body-sm">; leading-relaxed sem token DS */ "text-sm leading-relaxed wrap-break-word",
                  segment.isFinal ? "text-video-text" : "text-video-muted italic"
                )}>
                  {segment.text}
                </p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
