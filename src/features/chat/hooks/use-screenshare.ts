import { useState, useCallback, useEffect } from 'react';
import type DyteClient from '@dytesdk/web-core';

interface UseScreenshareReturn {
  isScreensharing: boolean;
  isLoading: boolean;
  error: string | null;
  canScreenshare: boolean;
  startScreenshare: () => Promise<void>;
  stopScreenshare: () => Promise<void>;
  screenShareParticipant: string | null;
}

export const useScreenshare = (meeting?: DyteClient): UseScreenshareReturn => {
  const [isScreensharing, setIsScreensharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenShareParticipant, setScreenShareParticipant] = useState<string | null>(null);

  // Check if browser supports screen sharing
  const canScreenshare = typeof navigator !== 'undefined' && 
    !!navigator.mediaDevices && 
    !!navigator.mediaDevices.getDisplayMedia;

  // Monitor local screen share state
  useEffect(() => {
    if (!meeting) return;

    const handleSelfScreenShareUpdate = ({ screenShareEnabled }: { screenShareEnabled: boolean }) => {
      setIsScreensharing(screenShareEnabled);
      setIsLoading(false);
    };

    meeting.self.on('screenShareUpdate', handleSelfScreenShareUpdate);

    // Initial state check
    if (meeting.self.screenShareEnabled) {
      setIsScreensharing(true);
    }

    return () => {
      meeting.self.removeListener('screenShareUpdate', handleSelfScreenShareUpdate);
    };
  }, [meeting]);

  // Monitor remote participants screen share
  useEffect(() => {
    if (!meeting) return;


    // Check existing participants
    meeting.participants.active.forEach((p: { screenShareEnabled?: boolean; name?: string }) => {
      if (p.screenShareEnabled) {
        setScreenShareParticipant(p.name || null);
      }
    });

    const handleParticipantJoined = (participant: { name?: string; on: (event: string, handler: (data: { screenShareEnabled: boolean }) => void) => void }) => {
      participant.on('screenShareUpdate', ({ screenShareEnabled }: { screenShareEnabled: boolean }) => {
        if (screenShareEnabled) {
          setScreenShareParticipant(participant.name);
        } else if (screenShareParticipant === participant.name) {
          setScreenShareParticipant(null);
        }
      });
    };

    const handleParticipantLeft = (participant: { name?: string }) => {
      // If the participant who left was sharing screen, reset state
      // We check by name since that's what we store
      if (screenShareParticipant && participant.name === screenShareParticipant) {
        setScreenShareParticipant(null);
      }
    };

    meeting.participants.joined.on('participantJoined', handleParticipantJoined);
    meeting.participants.joined.on('participantLeft', handleParticipantLeft);

    // Also listen to updates from already joined participants
    const updateListeners: Array<{ p: { name?: string; on: (event: string, handler: (data: { screenShareEnabled: boolean }) => void) => void; removeListener: (event: string, handler: (data: { screenShareEnabled: boolean }) => void) => void }, listener: (data: { screenShareEnabled: boolean }) => void }> = [];
    
    meeting.participants.active.forEach((p: { name?: string; on: (event: string, handler: (data: { screenShareEnabled: boolean }) => void) => void; removeListener: (event: string, handler: (data: { screenShareEnabled: boolean }) => void) => void }) => {
      const listener = ({ screenShareEnabled }: { screenShareEnabled: boolean }) => {
        if (screenShareEnabled) {
          setScreenShareParticipant(p.name || null);
        } else if (screenShareParticipant === p.name) {
          setScreenShareParticipant(null);
        }
      };
      p.on('screenShareUpdate', listener);
      updateListeners.push({ p, listener });
    });

    return () => {
      meeting.participants.joined.removeListener('participantJoined', handleParticipantJoined);
      meeting.participants.joined.removeListener('participantLeft', handleParticipantLeft);
      updateListeners.forEach(({ p, listener }) => {
        p.removeListener('screenShareUpdate', listener);
      });
    };
  }, [meeting, screenShareParticipant]);

  const startScreenshare = useCallback(async () => {
    if (!meeting || !canScreenshare) return;

    setIsLoading(true);
    setError(null);

    try {
      await meeting.self.enableScreenShare();
    } catch (err: unknown) {
      console.error('Error starting screen share:', err);
      setIsLoading(false);
      
      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
        setError('Permissão para compartilhar tela foi negada.');
      } else if (error.name === 'NotSupportedError') {
        setError('Seu navegador não suporta compartilhamento de tela.');
      } else {
        setError('Erro ao iniciar compartilhamento de tela.');
      }
    }
  }, [meeting, canScreenshare]);

  const stopScreenshare = useCallback(async () => {
    if (!meeting) return;

    setIsLoading(true);
    try {
      await meeting.self.disableScreenShare();
    } catch (err) {
      console.error('Error stopping screen share:', err);
      setError('Erro ao parar compartilhamento de tela.');
    } finally {
      setIsLoading(false);
    }
  }, [meeting]);

  return {
    isScreensharing,
    isLoading,
    error,
    canScreenshare,
    startScreenshare,
    stopScreenshare,
    screenShareParticipant
  };
};
