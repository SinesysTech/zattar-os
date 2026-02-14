'use client';

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
import { IncomingCallData } from '../hooks/use-call-notifications';
import { TipoChamada } from '../domain';

interface IncomingCallDialogProps {
  open: boolean;
  callData: IncomingCallData | null;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}

export function IncomingCallDialog({
  open,
  callData,
  onAccept,
  onReject,
}: IncomingCallDialogProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Play ringtone when open
  React.useEffect(() => {
    if (open && !audioRef.current) {
      audioRef.current = new Audio('/sounds/ringtone.mp3'); // Ensure this file exists or use a default URL
      audioRef.current.loop = true;
      audioRef.current.play().catch(err => console.error('Error playing ringtone:', err));
    } else if (!open && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
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
    if (audioRef.current) audioRef.current.pause();
    await onAccept();
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    if (audioRef.current) audioRef.current.pause();
    await onReject();
    setIsProcessing(false);
  };

  if (!callData) return null;

  const isVideo = callData.tipo === TipoChamada.Video;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-none shadow-2xl bg-linear-to-b from-background to-muted/20">
        {/* Ringing Animation Effect */}
        <div className="absolute inset-0 z-[-1] overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-primary/5 animate-pulse" />
        </div>

        <DialogHeader className="flex flex-col items-center gap-4 py-6">
          <DialogTitle className="sr-only">Recebendo chamada</DialogTitle>
          
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={callData.iniciadorAvatar} />
              <AvatarFallback className="text-2xl">
                {callData.iniciadorNome?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-background rounded-full p-1.5 shadow-md">
              {isVideo ? (
                <Video className="h-5 w-5 text-primary" />
              ) : (
                <Phone className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <h3 className="font-semibold text-xl tracking-tight">
              {callData.iniciadorNome}
            </h3>
            <p className="text-sm text-muted-foreground animate-pulse">
              Chamada de {isVideo ? 'vídeo' : 'áudio'} recebida...
            </p>
          </div>
        </DialogHeader>

        <DialogFooter className="flex flex-row justify-center gap-8 sm:justify-center pb-6">
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="destructive"
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200"
              onClick={handleReject}
              disabled={isProcessing}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <span className="text-xs text-muted-foreground">Recusar</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button
              variant="default"
              size="icon"
              className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={handleAccept}
              disabled={isProcessing}
            >
              {isVideo ? (
                <Video className="h-6 w-6" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </Button>
            <span className="text-xs text-muted-foreground">Aceitar</span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
