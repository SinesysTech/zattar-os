'use client';

import * as React from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/app/_lib/supabase/client';

interface AudioRecordButtonProps {
  onAudioRecorded: (audioInfo: {
    url: string;
    name: string;
    size: number;
    type: string;
    category: string;
    duration: number;
  }) => void;
  onAudioReady: (audioFile: {
    blob: Blob;
    duration: number;
    size: number;
  }) => void;
  disabled?: boolean;
  className?: string;
}

export function AudioRecordButton({
  onAudioRecorded,
  onAudioReady,
  disabled = false,
  className,
}: AudioRecordButtonProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [, setIsPaused] = React.useState(false);
  const [recordedAudio, setRecordedAudio] = React.useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const [audioURL, setAudioURL] = React.useState<string | null>(null);
  const [, setIsPlaying] = React.useState(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordingTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = React.useRef<number>(0);
  const pausedTimeRef = React.useRef<number>(0);

  React.useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const startTimer = React.useCallback(() => {
    recordingStartTimeRef.current = Date.now() - pausedTimeRef.current;
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(Date.now() - recordingStartTimeRef.current);
    }, 100);
  }, []);

  const stopTimer = React.useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm' 
        });
        setRecordedAudio(audioBlob);
        
        if (audioURL) {
          URL.revokeObjectURL(audioURL);
        }
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      pausedTimeRef.current = 0;
      startTimer();

    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert('Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
      
      // Aguardar um pouco para o blob ser criado
      setTimeout(async () => {
        if (recordedAudio) {
          const durationInSeconds = Math.round(recordingDuration / 1000);
          const size = recordedAudio.size;
          
          // Upload automático e notificação
          try {
            const supabase = createClient();
            
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(7);
            const uniqueName = `chat/audio/${timestamp}-${randomId}.webm`;

            const { error } = await supabase.storage
              .from('chat-files')
              .upload(uniqueName, recordedAudio, {
                cacheControl: '3600',
                upsert: false,
              });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
              .from('chat-files')
              .getPublicUrl(uniqueName);

            const audioFileInfo = {
              url: publicUrl,
              name: `gravação-${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.webm`,
              size: size,
              type: 'audio/webm',
              category: 'audio' as const,
              duration: durationInSeconds,
            };

            onAudioRecorded(audioFileInfo);
            onAudioReady({
              blob: recordedAudio,
              duration: durationInSeconds,
              size: size,
            });
            
            // Limpar estado
            clearRecording();
            
          } catch (error) {
            console.error('Erro ao processar áudio gravado:', error);
            alert('Erro ao processar áudio gravado');
          }
        }
      }, 100);
    }
  };

  const clearRecording = () => {
    setRecordedAudio(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
    audioChunksRef.current = [];
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Durante gravação - mostrar botão de parar
  if (isRecording) {
    return (
      <Button
        onClick={stopRecording}
        disabled={disabled}
        size="sm"
        className={cn(
          'bg-red-600 hover:bg-red-700 text-white animate-pulse',
          className
        )}
      >
        <Square className="h-4 w-4 mr-2" />
        Parar ({formatTime(recordingDuration)})
      </Button>
    );
  }

  // Botão principal de gravação
  return (
    <Button
      onClick={startRecording}
      disabled={disabled}
      size="sm"
      variant="outline"
      className={cn('transition-all duration-300', className)}
    >
      <Mic className="h-4 w-4 mr-2" />
      Gravar
    </Button>
  );
}