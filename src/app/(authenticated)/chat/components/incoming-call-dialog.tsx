'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Heading, Text } from '@/components/ui/typography';
import { IncomingCallData } from '../hooks/use-call-notifications';
import { TipoChamada } from '../domain';

interface IncomingCallDialogProps {
  open: boolean;
  callData: IncomingCallData | null;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}

// Generates a ringtone pattern using Web Audio API (no external file needed)
function createRingtone(audioCtx: AudioContext): { start: () => void; stop: () => void } {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let currentOscillator: OscillatorNode | null = null;
  let currentGain: GainNode | null = null;

  const playTone = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    // Two-tone ring pattern (similar to phone ring)
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.setValueAtTime(480, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.8);

    currentOscillator = osc;
    currentGain = gain;
  };

  return {
    start: () => {
      playTone();
      // Ring pattern: 0.8s tone, 1.2s silence (2s cycle)
      intervalId = setInterval(playTone, 2000);
    },
    stop: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (currentOscillator) {
        try { currentOscillator.stop(); } catch { /* already stopped */ }
        currentOscillator = null;
      }
      if (currentGain) {
        currentGain.disconnect();
        currentGain = null;
      }
    },
  };
}

export function IncomingCallDialog({
  open,
  callData,
  onAccept,
  onReject,
}: IncomingCallDialogProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const ringtoneRef = React.useRef<{ start: () => void; stop: () => void } | null>(null);

  // Play ringtone when open
  React.useEffect(() => {
    if (open) {
      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const ringtone = createRingtone(ctx);
        ringtoneRef.current = ringtone;
        ringtone.start();
      } catch (err) {
        console.error('Error creating ringtone:', err);
      }
    } else {
      ringtoneRef.current?.stop();
      ringtoneRef.current = null;
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    }

    return () => {
      ringtoneRef.current?.stop();
      ringtoneRef.current = null;
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [open]);

  // Auto-close after 45 seconds if no answer
  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (open) {
      timeout = setTimeout(() => {
        onReject();
      }, 45000);
    }
    return () => clearTimeout(timeout);
  }, [open, onReject]);

  const handleAccept = async () => {
    setIsProcessing(true);
    ringtoneRef.current?.stop();
    await onAccept();
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    ringtoneRef.current?.stop();
    await onReject();
    setIsProcessing(false);
  };

  if (!callData) return null;

  const isVideo = callData.tipo === TipoChamada.Video;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-none shadow-lg bg-linear-to-b from-background to-muted/20">
        {/* Ringing Animation Effect */}
        <div className="absolute inset-0 z-[-1] overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-primary/5 animate-pulse" />
        </div>

        <DialogHeader className={cn("flex flex-col items-center inline-default py-6")}>
          <DialogTitle className="sr-only">Recebendo chamada</DialogTitle>
          
          <div className="relative">
            <Avatar size="3xl" className="border-4 border-background shadow-lg">
              <AvatarImage src={callData.iniciadorAvatar} />
              <AvatarFallback className={cn(/* design-system-escape: text-2xl → migrar para <Heading level="..."> */ "text-2xl")}>
                {callData.iniciadorNome?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className={cn("absolute bottom-0 right-0 bg-background rounded-full inset-snug shadow-md")}>
              {isVideo ? (
                <Video className="h-5 w-5 text-primary" />
              ) : (
                <Phone className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>

          <div className={cn("flex flex-col text-center stack-micro")}>
            <Heading level="card">
              {callData.iniciadorNome}
            </Heading>
            <p className={cn("text-body-sm text-muted-foreground animate-pulse")}>
              Chamada de {isVideo ? 'vídeo' : 'áudio'} recebida...
            </p>
          </div>
        </DialogHeader>

        <DialogFooter className={cn("flex flex-row justify-center inline-extra-loose sm:justify-center pb-6")}>
          <div className={cn("flex flex-col items-center inline-tight")}>
            <Button
              variant="destructive"
              size="icon" aria-label="Desligar"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-lg hover:opacity-90 transition-all duration-200"
              onClick={handleReject}
              disabled={isProcessing}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Text variant="caption">Recusar</Text>
          </div>

          <div className={cn("flex flex-col items-center inline-tight")}>
            <Button
              variant="default"
              size="icon" aria-label="Câmera"
              className="h-14 w-14 rounded-full bg-success hover:bg-success transition-all duration-200 shadow-lg hover:shadow-lg"
              onClick={handleAccept}
              disabled={isProcessing}
            >
              {isVideo ? (
                <Video className="h-6 w-6" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </Button>
            <Text variant="caption">Aceitar</Text>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
