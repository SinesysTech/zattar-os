"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Monitor, MonitorOff, FileText } from "lucide-react";
import { useDyteClient } from "@dytesdk/react-web-core";
import { DyteMeeting } from "@dytesdk/react-ui-kit";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { actionEntrarNaChamada, actionSairDaChamada, actionSalvarTranscricao } from "../../actions/chamadas-actions";
import { SelectedDevices } from "../../domain";
import { useScreenshare, useTranscription } from "../../hooks";
import { ScreenshareBanner } from "./screenshare-banner";
import { LiveTranscriptPanel } from "./live-transcript-panel";
import { cn } from "@/lib/utils";

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salaId: number;
  salaNome: string;
  chamadaId?: number;
  initialAuthToken?: string;
  isInitiator?: boolean;
  selectedDevices?: SelectedDevices;
  onCallEnd?: () => Promise<void>;
  onScreenshareStart?: () => void;
  onScreenshareStop?: () => void;
}

export function VideoCallDialog({ 
  open, 
  onOpenChange, 
  salaId, 
  salaNome, 
  chamadaId, 
  initialAuthToken,
  isInitiator,
  selectedDevices,
  onCallEnd,
  onScreenshareStart,
  onScreenshareStop
}: VideoCallDialogProps) {
  const [meeting, initMeeting] = useDyteClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const joinedRef = useRef(false);

  // Screenshare hook
  const {
    isScreensharing,
    isLoading: isScreenshareLoading,
    error: screenshareError,
    canScreenshare,
    startScreenshare,
    stopScreenshare,
    screenShareParticipant
  } = useScreenshare(meeting);

  // Transcription hook
  const { transcripts, isTranscribing } = useTranscription(meeting || null);
  const [showTranscript, setShowTranscript] = useState(false);
  // Store transcripts in ref to access them in cleanup/unmount
  const transcriptsRef = useRef(transcripts);
  
  // Update ref whenever transcripts change
  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);

  // Notify parent about screenshare events
  useEffect(() => {
    if (isScreensharing) {
      onScreenshareStart?.();
    } else {
      onScreenshareStop?.();
    }
  }, [isScreensharing, onScreenshareStart, onScreenshareStop]);

  const startCall = useCallback(async () => {
    if (initialized || loading) return;
    if (!initialAuthToken) {
       setError("Token de autenticação não fornecido.");
       return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Register entry in DB
      if (chamadaId && !joinedRef.current) {
        await actionEntrarNaChamada(chamadaId);
        joinedRef.current = true;
      }

      // 2. Init Dyte
      await initMeeting({
        authToken: initialAuthToken,
        defaults: {
          audio: !!selectedDevices?.audioInput,
          video: !!selectedDevices?.videoDevice,
        },
      });
      setInitialized(true);
      
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar chamada.");
    } finally {
      setLoading(false);
    }
  }, [chamadaId, initialAuthToken, initMeeting, initialized, loading, selectedDevices]);

  // Apply selected devices after meeting initialization
  useEffect(() => {
    const applyDevices = async () => {
      if (meeting && selectedDevices && initialized) {
        try {
          if (selectedDevices.videoDevice) {
             // Type assertion as Dyte types might be generic
             await (meeting.self as any).setDevice('video', selectedDevices.videoDevice);
          }
          if (selectedDevices.audioInput) {
             await (meeting.self as any).setDevice('audio', selectedDevices.audioInput);
          }
          if (selectedDevices.audioOutput) {
             await (meeting.self as any).setDevice('speaker', selectedDevices.audioOutput);
          }
        } catch (err) {
          console.error("Error applying selected devices:", err);
        }
      }
    };
    
    applyDevices();
  }, [meeting, selectedDevices, initialized]);

  useEffect(() => {
    if (open && !initialized && initialAuthToken) {
      startCall();
    }
  }, [open, initialized, initialAuthToken, startCall]);

  // Handle exit
  const handleExit = useCallback(async () => {
    if (meeting) {
      meeting.leave();
    }
    
    // Save transcription if exists
    if (chamadaId && transcriptsRef.current.length > 0) {
      const fullTranscript = transcriptsRef.current
        .filter(t => t.isFinal) // Only save final transcripts? Or all? Let's save finals to be clean.
        .map(t => {
          const time = new Date(t.timestamp).toLocaleTimeString();
          return `[${time}] ${t.participantName}: ${t.text}`;
        })
        .join('\n');
        
      if (fullTranscript.trim()) {
        // Fire and forget (or await if critical, but we want to close fast)
        // We await to ensure data integrity
        try {
          await actionSalvarTranscricao(chamadaId, fullTranscript);
        } catch (err) {
          console.error("Failed to save transcription:", err);
        }
      }
    }

    if (chamadaId && joinedRef.current) {
      await actionSairDaChamada(chamadaId);
      joinedRef.current = false;
    }
    
    // If initiator leaves/cancels, signal end of call
    if (isInitiator && onCallEnd) {
      await onCallEnd();
    }

    setInitialized(false);
    setError(null);
    setShowTranscript(false);
  }, [meeting, chamadaId, isInitiator, onCallEnd]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      handleExit();
    }
  }, [open, handleExit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden bg-black border-none text-white relative group">
        <VisuallyHidden>
          <DialogTitle>Video Call: {salaNome}</DialogTitle>
        </VisuallyHidden>

        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p>Iniciando chamada...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <p className="text-red-500 text-xl font-semibold">Erro</p>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition"
            >
              Fechar
            </button>
          </div>
        )}

        {!loading && !error && meeting && (
          <div className="w-full h-full relative">
            <ScreenshareBanner 
              isScreensharing={isScreensharing}
              participantName={screenShareParticipant}
              onStop={stopScreenshare}
              isSelf={isScreensharing}
            />
            
            <DyteMeeting
              meeting={meeting}
              mode="fill"
              showSetupScreen={false} // Setup screen is handled by our custom dialog
              leaveOnUnmount={true}
            />

            <LiveTranscriptPanel 
              transcripts={transcripts} 
              isVisible={showTranscript} 
              onClose={() => setShowTranscript(false)}
            />

            {/* Controls Overlay at bottom left */}
            <div className="absolute bottom-4 left-4 z-50 flex gap-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
               <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isScreensharing ? "destructive" : "secondary"}
                      size="icon"
                      className="rounded-full w-10 h-10 shadow-lg bg-gray-800/80 hover:bg-gray-700 border border-gray-600"
                      onClick={isScreensharing ? stopScreenshare : startScreenshare}
                      disabled={isScreenshareLoading || (!canScreenshare && !isScreensharing)}
                    >
                      {isScreenshareLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isScreensharing ? (
                        <MonitorOff className="h-4 w-4" />
                      ) : (
                        <Monitor className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{isScreensharing ? "Parar compartilhamento" : "Compartilhar tela"}</p>
                    {screenshareError && <p className="text-xs text-red-400 mt-1">{screenshareError}</p>}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showTranscript ? "default" : "secondary"}
                      size="icon"
                      className={cn(
                        "rounded-full w-10 h-10 shadow-lg border border-gray-600",
                        showTranscript ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-800/80 hover:bg-gray-700"
                      )}
                      onClick={() => setShowTranscript(!showTranscript)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{showTranscript ? "Ocultar transcrição" : "Mostrar transcrição"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
