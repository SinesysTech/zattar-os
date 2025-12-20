"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useDyteClient } from "@dytesdk/react-web-core";
import { DyteUiProvider, DyteMeeting } from "@dytesdk/react-ui-kit";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { actionIniciarAudioCall } from "../../actions/dyte-actions";

interface CallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salaId: number;
  salaNome: string;
}

export function CallDialog({ open, onOpenChange, salaId, salaNome }: CallDialogProps) {
  const [meeting, initMeeting] = useDyteClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !meeting && !loading) {
      const startCall = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await actionIniciarAudioCall(salaId, salaNome);
          if (result.success && result.data) {
            await initMeeting({
              authToken: result.data.authToken,
              defaults: {
                audio: true,
                video: false,
              },
            });
          } else {
            setError(result.error || result.message);
          }
        } catch (e: any) {
          setError(e.message || "Erro ao iniciar chamada.");
        } finally {
          setLoading(false);
        }
      };
      startCall();
    }
  }, [open, salaId, salaNome, meeting, initMeeting, loading]);

  useEffect(() => {
    if (!open && meeting) {
      meeting.self.leave();
    }
  }, [open, meeting]);

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
            <DyteUiProvider value={meeting}>
              <DyteMeeting mode="fill" showSetupScreen={true} />
            </DyteUiProvider>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}