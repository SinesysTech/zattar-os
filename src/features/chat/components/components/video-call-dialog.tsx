"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useDyteClient } from "@dytesdk/react-web-core";
import { DyteUiProvider, DyteMeeting } from "@dytesdk/react-ui-kit";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { actionIniciarVideoCall } from "../../actions/dyte-actions";

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salaId: number;
  salaNome: string;
}

export function VideoCallDialog({ open, onOpenChange, salaId, salaNome }: VideoCallDialogProps) {
  const [meeting, initMeeting] = useDyteClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !meeting && !loading) {
      const startCall = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await actionIniciarVideoCall(salaId, salaNome);
          if (result.success && result.data) {
            await initMeeting({
              authToken: result.data.authToken,
              defaults: {
                audio: true,
                video: true,
              },
            });
          } else {
            setError(result.error || result.message);
          }
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Erro ao iniciar chamada.");
        } finally {
          setLoading(false);
        }
      };
      startCall();
    }
  }, [open, salaId, salaNome, meeting, initMeeting, loading]);

  // Limpar meeting ao fechar
  useEffect(() => {
    if (!open && meeting) {
      // Opcional: leave meeting logic if needed directly on client, 
      // but DyteMeeting UI handles leaving mostly.
      // Se quisermos forçar o leave:
      meeting.self.leave();
    }
  }, [open, meeting]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden bg-black border-none text-white">
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