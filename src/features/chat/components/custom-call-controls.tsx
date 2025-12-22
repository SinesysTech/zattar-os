import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  Circle, PhoneOff, FileText, Users
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { NetworkQualityIndicator } from "./network-quality-indicator";
import type DyteClient from "@dytesdk/web-core";

interface CustomCallControlsProps {
  meeting: DyteClient | null;
  onLeave: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isScreensharing: boolean;
  onStartScreenshare: () => void;
  onStopScreenshare: () => void;
  showTranscript: boolean;
  onToggleTranscript: () => void;
  onToggleParticipants?: () => void;
  showParticipants?: boolean;
  canRecord?: boolean;
  networkQuality?: 'excellent' | 'good' | 'poor' | 'unknown';
  networkScore?: number;
}

export function CustomCallControls({
  meeting,
  onLeave,
  isRecording,
  onStartRecording,
  onStopRecording,
  isScreensharing,
  onStartScreenshare,
  onStopScreenshare,
  showTranscript,
  onToggleTranscript,
  onToggleParticipants,
  showParticipants,
  canRecord = false,
  networkQuality = 'unknown',
  networkScore = -1,
}: CustomCallControlsProps) {
  // Use lazy initialization to get initial values from meeting
  const [audioEnabled, setAudioEnabled] = useState(
    () => meeting?.self?.audioEnabled ?? false
  );
  const [videoEnabled, setVideoEnabled] = useState(
    () => meeting?.self?.videoEnabled ?? false
  );

  // Track if we've synced initial state to avoid duplicate setState
  const hasSyncedRef = useRef(false);

  // Sync state with Dyte via event listeners only
  useEffect(() => {
    if (!meeting?.self) return;

    // Sync initial state only once after meeting becomes available
    // (handles case where meeting wasn't available during initial render)
    if (!hasSyncedRef.current) {
      hasSyncedRef.current = true;
      // Use queueMicrotask to avoid synchronous setState in effect body
      queueMicrotask(() => {
        setAudioEnabled(meeting.self.audioEnabled);
        setVideoEnabled(meeting.self.videoEnabled);
      });
    }

    const onAudioUpdate = () => setAudioEnabled(meeting.self.audioEnabled);
    const onVideoUpdate = () => setVideoEnabled(meeting.self.videoEnabled);

    meeting.self.addListener('audioUpdate', onAudioUpdate);
    meeting.self.addListener('videoUpdate', onVideoUpdate);

    return () => {
      meeting.self.removeListener('audioUpdate', onAudioUpdate);
      meeting.self.removeListener('videoUpdate', onVideoUpdate);
    };
  }, [meeting]);

  const toggleAudio = async () => {
    if (!meeting) return;
    if (audioEnabled) await meeting.self.disableAudio();
    else await meeting.self.enableAudio();
  };

  const toggleVideo = async () => {
    if (!meeting) return;
    if (videoEnabled) await meeting.self.disableVideo();
    else await meeting.self.enableVideo();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 p-4 md:p-6">
      <div className="relative flex items-center justify-center gap-2 md:gap-4 max-w-7xl mx-auto">
        
        {/* Network Indicator (Absolute Left) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:block">
          <NetworkQualityIndicator quality={networkQuality} score={networkScore} showLabel />
        </div>
        
        <TooltipProvider>
          {/* Audio */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={audioEnabled ? "default" : "destructive"}
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all",
                  audioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
                )}
                onClick={toggleAudio}
              >
                {audioEnabled ? <Mic className="h-5 w-5 md:h-6 md:w-6" /> : <MicOff className="h-5 w-5 md:h-6 md:w-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{audioEnabled ? "Desativar microfone" : "Ativar microfone"}</p></TooltipContent>
          </Tooltip>

          {/* Video */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={videoEnabled ? "default" : "destructive"}
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all",
                  videoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
                )}
                onClick={toggleVideo}
              >
                {videoEnabled ? <Video className="h-5 w-5 md:h-6 md:w-6" /> : <VideoOff className="h-5 w-5 md:h-6 md:w-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{videoEnabled ? "Desativar câmera" : "Ativar câmera"}</p></TooltipContent>
          </Tooltip>

          <div className="w-px h-8 bg-gray-700 mx-2" />

          {/* Screenshare */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreensharing ? "destructive" : "secondary"}
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all",
                  isScreensharing ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                )}
                onClick={isScreensharing ? onStopScreenshare : onStartScreenshare}
              >
                {isScreensharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isScreensharing ? "Parar compartilhamento" : "Compartilhar tela"}</p></TooltipContent>
          </Tooltip>

          {/* Recording */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all",
                  isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-gray-700 hover:bg-gray-600 text-gray-300",
                  !canRecord && !isRecording && "opacity-50 cursor-not-allowed"
                )}
                onClick={isRecording ? onStopRecording : onStartRecording}
                disabled={!canRecord && !isRecording}
              >
                <Circle className={cn("h-5 w-5", isRecording && "fill-current")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!canRecord && !isRecording 
                  ? "Apenas o iniciador pode gravar" 
                  : isRecording 
                    ? "Parar gravação" 
                    : "Gravar reunião"}
              </p>
            </TooltipContent>
          </Tooltip>

           {/* Transcript */}
           <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showTranscript ? "default" : "secondary"}
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all",
                  showTranscript ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                )}
                onClick={onToggleTranscript}
              >
                <FileText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{showTranscript ? "Ocultar transcrição" : "Ver transcrição"}</p></TooltipContent>
          </Tooltip>
          
          {/* Participants Toggle (Mobile/Tablet) */}
          {onToggleParticipants && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant={showParticipants ? "default" : "secondary"}
                    size="icon"
                    className={cn(
                    "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all lg:hidden",
                    showParticipants ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    )}
                    onClick={onToggleParticipants}
                >
                    <Users className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Participantes</p></TooltipContent>
            </Tooltip>
          )}

          <div className="w-px h-8 bg-gray-700 mx-2" />

          {/* Settings - Placeholder for now */}
          {/* <Button size="icon" variant="ghost" className="rounded-full text-gray-400 hover:text-white hover:bg-gray-800">
            <Settings className="h-6 w-6" />
          </Button> */}

          {/* Leave */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg bg-red-600 hover:bg-red-700 ml-2"
                onClick={onLeave}
              >
                <PhoneOff className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Sair da chamada</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
