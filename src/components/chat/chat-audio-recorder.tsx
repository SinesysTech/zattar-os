'use client';

import * as React from 'react';
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ChatAudioRecorderProps {
  onAudioRecorded: (audioInfo: {
    blob: Blob;
    duration: number;
    size: number;
  }) => void;
  className?: string;
  disabled?: boolean;
}

export function ChatAudioRecorder({ 
  onAudioRecorded, 
  className,
  disabled = false 
}: ChatAudioRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [recordedAudio, setRecordedAudio] = React.useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const [audioURL, setAudioURL] = React.useState<string | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        startTimer();
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        stopTimer();
        pausedTimeRef.current = recordingDuration;
      }
    }
  };

  const playRecording = () => {
    if (audioURL && audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    setRecordedAudio(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
    audioChunksRef.current = [];
  };

  const sendRecording = () => {
    if (recordedAudio) {
      const durationInSeconds = Math.round(recordingDuration / 1000);
      const size = recordedAudio.size;
      
      onAudioRecorded({
        blob: recordedAudio,
        duration: durationInSeconds,
        size,
      });
      
      // Limpar estado
      deleteRecording();
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Estados da UI
  if (recordedAudio) {
    // Player de áudio gravado
    return (
      <div className={cn('p-4 border rounded-lg bg-muted/20', className)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Áudio gravado</span>
            <span className="text-xs text-muted-foreground">
              {formatTime(recordingDuration)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={playRecording}
            className="flex-1"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isPlaying ? 'Pausar' : 'Reproduzir'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={deleteRecording}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={sendRecording}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar
          </Button>
        </div>
        
        {audioURL && (
          <audio
            ref={audioPlayerRef}
            src={audioURL}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="hidden"
          />
        )}
      </div>
    );
  }

  if (isRecording) {
    // Interface de gravação ativa
    return (
      <div className={cn('p-4 border rounded-lg bg-red-50 border-red-200', className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-700">
              {isPaused ? 'Gravação pausada' : 'Gravando...'}
            </span>
          </div>
          <span className="text-sm font-mono text-red-600">
            {formatTime(recordingDuration)}
          </span>
        </div>
        
        <Progress 
          value={Math.min((recordingDuration / 60000) * 100, 100)} 
          className="mb-3 h-2"
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant={isPaused ? "default" : "outline"}
            size="sm"
            onClick={pauseRecording}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Continuar
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </>
            )}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={stopRecording}
          >
            <Square className="h-4 w-4 mr-2" />
            Parar
          </Button>
        </div>
      </div>
    );
  }

  // Botão para iniciar gravação
  return (
    <div className={cn('p-4 border rounded-lg bg-muted/20', className)}>
      <Button
        onClick={startRecording}
        disabled={disabled}
        className="w-full bg-red-600 hover:bg-red-700 text-white"
      >
        <Mic className="h-4 w-4 mr-2" />
        Gravar áudio
      </Button>
      
      {!disabled && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Clique para começar a gravar (máx. 1 minuto)
        </p>
      )}
    </div>
  );
}