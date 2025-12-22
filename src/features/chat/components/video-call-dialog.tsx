"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useDyteClient, DyteProvider } from "@dytesdk/react-web-core";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { actionEntrarNaChamada, actionSairDaChamada, actionSalvarTranscricao } from "../../actions/chamadas-actions";
import { SelectedDevices } from "../../domain";
import { useScreenshare, useTranscription, useRecording, useAdaptiveQuality } from "../../hooks";
import { CustomMeetingUI } from "./custom-meeting-ui";
import { handleCallError } from "../../utils/call-error-handler";
import { CallLoadingState, LoadingStage } from "./call-loading-state";

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
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [meetingId, setMeetingId] = useState<string | undefined>(undefined);
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

  // Get meetingId from meeting.meta when available, or fetch from server
  useEffect(() => {
    if (meeting?.meta?.meetingId) {
      setMeetingId(meeting.meta.meetingId);
    } else if (chamadaId && !meetingId) {
      // Fallback: fetch meetingId from server if not available in meeting.meta
      (async () => {
        try {
          const { actionBuscarChamadaPorId } = await import("../../actions/chamadas-actions");
          const result = await actionBuscarChamadaPorId(chamadaId);
          if (result.success && result.data?.meetingId) {
            setMeetingId(result.data.meetingId);
          }
        } catch (err) {
          handleCallError(err);
        }
      })();
    }
  }, [meeting, chamadaId, meetingId]);

  // Recording hook - use actual meetingId instead of roomName
  const {
    isRecording,
    isLoading: isRecordingLoading,
    error: recordingError,
    canRecord,
    recordingId,
    startRecording,
    stopRecording,
  } = useRecording(
    meeting,
    meetingId, // Use actual meetingId from state (from meeting.meta.meetingId or server)
    (recId) => {
       // Recording started callback
    },
    async (recId) => {
      // Ao parar gravação, salvar URL após processamento
      if (chamadaId && recId) {
        // Aguardar alguns segundos para o Dyte processar
        setTimeout(async () => {
          const { actionSalvarUrlGravacao } = await import("../../actions/chamadas-actions");
          await actionSalvarUrlGravacao(chamadaId, recId);
        }, 5000);
      }
    }
  );

  // Adaptive Quality Hook
  useAdaptiveQuality(meeting || undefined, {
    autoSwitch: false,
    threshold: 2 // Poor connection
  });

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
    setLoadingStage('connecting');
    setError(null);
    try {
      // 1. Register entry in DB
      if (chamadaId && !joinedRef.current) {
        await actionEntrarNaChamada(chamadaId);
        joinedRef.current = true;
      }

      setLoadingStage('initializing');

      // 2. Init Dyte
      await initMeeting({
        authToken: initialAuthToken,
        defaults: {
          audio: !!selectedDevices?.audioInput,
          video: !!selectedDevices?.videoDevice,
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
          if (selectedDevices.videoDevice) {
             await (meeting.self as any).setDevice('video', selectedDevices.videoDevice);
          }
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

  // Handle exit
  const handleExit = useCallback(async () => {
    // Stop recording if active before leaving
    if (isRecording && recordingId) {
      try {
        await stopRecording();
      } catch (err) {
        handleCallError(err);
      }
    }

    if (meeting) {
      meeting.leave();
    }

    // Save transcription if exists
    if (chamadaId && transcriptsRef.current.length > 0) {
      const fullTranscript = transcriptsRef.current
        .filter(t => t.isFinal)
        .map(t => {
          const time = new Date(t.timestamp).toLocaleTimeString();
          return `[${time}] ${t.participantName}: ${t.text}`;
        })
        .join('\n');

      if (fullTranscript.trim()) {
        try {
          await actionSalvarTranscricao(chamadaId, fullTranscript);
        } catch (err) {
          handleCallError(err);
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
  }, [meeting, chamadaId, isInitiator, onCallEnd, isRecording, recordingId, stopRecording]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      handleExit();
    }
  }, [open, handleExit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden bg-black border-none text-white relative">
        <VisuallyHidden>
          <DialogTitle>Video Call: {salaNome}</DialogTitle>
        </VisuallyHidden>

        {loading && (
          <CallLoadingState 
            stage={loadingStage} 
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
              transcripts={transcripts}
              showTranscript={showTranscript}
              onToggleTranscript={() => setShowTranscript(!showTranscript)}
              canRecord={isInitiator ?? false}
            />
          </DyteProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
