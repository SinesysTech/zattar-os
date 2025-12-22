"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useDyteClient, DyteProvider } from "@dytesdk/react-web-core";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { actionEntrarNaChamada, actionSairDaChamada } from "../actions/chamadas-actions";
import { SelectedDevices } from "../domain";
import { useScreenshare, useRecording } from "../hooks";
import { CustomMeetingUI } from "./custom-meeting-ui";
import { cn } from "@/lib/utils";
import { handleCallError } from "../utils/call-error-handler";
import { CallLoadingState, LoadingStage } from "./call-loading-state";

interface CallDialogProps {
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

export function CallDialog({ 
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
}: CallDialogProps) {
  const [meeting, initMeeting] = useDyteClient();
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('connecting');
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

  // Recording hook
  const {
    isRecording,
    isLoading: isRecordingLoading,
    error: recordingError,
    canRecord,
    startRecording,
    stopRecording,
  } = useRecording(
    meeting,
    meeting?.meta?.meetingId,
    (recId) => {},
    async (recId) => {
      if (chamadaId && recId) {
        setTimeout(async () => {
          const { actionSalvarUrlGravacao } = await import("../actions/chamadas-actions");
          await actionSalvarUrlGravacao(chamadaId, recId);
        }, 5000);
      }
    }
  );

  const showLarge = isScreensharing || !!screenShareParticipant;

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
    setLoadingStage('connecting');
    setError(null);
    try {
      if (chamadaId && !joinedRef.current) {
        await actionEntrarNaChamada(chamadaId);
        joinedRef.current = true;
      }
      
      setLoadingStage('initializing');

      await initMeeting({
        authToken: initialAuthToken,
        defaults: {
          audio: selectedDevices?.audioInput ?? true,
          video: false,
        },
      });
      
      setLoadingStage('joining');
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
          if (selectedDevices.audioInput) {
             await (meeting.self as any).setDevice('audio', selectedDevices.audioInput);
          }
          if (selectedDevices.audioOutput) {
             await (meeting.self as any).setDevice('speaker', selectedDevices.audioOutput);
          }
        } catch (err) {
          handleCallError(err);
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

  const handleExit = useCallback(async () => {
    if (meeting) {
      meeting.leave();
    }
    if (chamadaId && joinedRef.current) {
      await actionSairDaChamada(chamadaId);
      joinedRef.current = false;
    }

    if (isInitiator && onCallEnd) {
      await onCallEnd();
    }

    setInitialized(false);
    setError(null);
  }, [meeting, chamadaId, isInitiator, onCallEnd]);

  useEffect(() => {
    if (!open) {
      handleExit();
    }
  }, [open, handleExit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "p-0 overflow-hidden bg-gray-900 border-none text-white transition-all duration-300",
        showLarge ? "max-w-4xl h-[80vh]" : "max-w-md h-[500px]"
      )}>
        <VisuallyHidden>
          <DialogTitle>Audio Call: {salaNome}</DialogTitle>
        </VisuallyHidden>

        {loading && (
          <CallLoadingState 
            stage={loadingStage} 
            message="Iniciando chamada de áudio..."
            onCancel={() => onOpenChange(false)}
          />
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
          <DyteProvider meeting={meeting}>
            <CustomMeetingUI
              meeting={meeting}
              onLeave={handleExit}
              chamadaId={chamadaId}
              isRecording={isRecording}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              isScreensharing={isScreensharing}
              screenShareParticipant={screenShareParticipant}
              onStartScreenshare={startScreenshare}
              onStopScreenshare={stopScreenshare}
              transcripts={[]} // No transcription for audio calls for now
              showTranscript={false}
              onToggleTranscript={() => {}}
              audioOnly={true}
            />
          </DyteProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}