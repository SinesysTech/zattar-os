"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useDyteClient } from "@dytesdk/react-web-core";
import { DyteMeeting } from "@dytesdk/react-ui-kit";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { actionEntrarNaChamada, actionSairDaChamada } from "../../actions/chamadas-actions";
import { SelectedDevices } from "../../domain";

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
  onCallEnd
}: CallDialogProps) {
  const [meeting, initMeeting] = useDyteClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const joinedRef = useRef(false);

  const startCall = useCallback(async () => {
    if (initialized || loading) return;
    if (!initialAuthToken) {
       setError("Token de autenticação não fornecido.");
       return;
    }

    setLoading(true);
    setError(null);
    try {
      if (chamadaId && !joinedRef.current) {
        await actionEntrarNaChamada(chamadaId);
        joinedRef.current = true;
      }

      await initMeeting({
        authToken: initialAuthToken,
        defaults: {
          audio: selectedDevices?.audioInput ?? true,
          video: false,
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
          // For audio calls, we only care about audio input/output
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
      <DialogContent className="max-w-md p-0 overflow-hidden bg-gray-900 border-none text-white h-[400px]">
        <VisuallyHidden>
          <DialogTitle>Audio Call: {salaNome}</DialogTitle>
        </VisuallyHidden>

        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p>Iniciando chamada de áudio...</p>
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
          <div className="w-full h-full">
            <DyteMeeting
              meeting={meeting}
              mode="fill"
              showSetupScreen={false}
              leaveOnUnmount={true}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
