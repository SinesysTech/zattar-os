import { useState, useCallback, useEffect } from 'react';
import type { DyteClient } from '@dytesdk/web-core';

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

    const handleParticipantUpdate = (participant: any) => {
      if (participant.screenShareEnabled) {
        setScreenShareParticipant(participant.name);
      }
    };

    // Check existing participants
    meeting.participants.active.forEach((p: any) => {
      if (p.screenShareEnabled) {
        setScreenShareParticipant(p.name);
      }
    });

    const handleParticipantJoined = (participant: any) => {
      participant.on('screenShareUpdate', ({ screenShareEnabled }: { screenShareEnabled: boolean }) => {
        if (screenShareEnabled) {
          setScreenShareParticipant(participant.name);
        } else if (screenShareParticipant === participant.name) {
          setScreenShareParticipant(null);
        }
      });
    };

    const handleParticipantLeft = (participant: any) => {
      // If the participant who left was sharing screen, reset state
      // We check by name since that's what we store
      if (screenShareParticipant && participant.name === screenShareParticipant) {
        setScreenShareParticipant(null);
      }
    };

    meeting.participants.joined.on('participantJoined', handleParticipantJoined);
    meeting.participants.joined.on('participantLeft', handleParticipantLeft);

    // Also listen to updates from already joined participants
    const updateListeners: Array<{ p: any, listener: any }> = [];
    
    meeting.participants.active.forEach((p: any) => {
      const listener = ({ screenShareEnabled }: { screenShareEnabled: boolean }) => {
        if (screenShareEnabled) {
          setScreenShareParticipant(p.name);
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
    } catch (err: any) {
      console.error('Error starting screen share:', err);
      setIsLoading(false);
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setError('Permissão para compartilhar tela foi negada.');
      } else if (err.name === 'NotSupportedError') {
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
