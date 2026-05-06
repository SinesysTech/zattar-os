import React, { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { Heading, Text } from '@/components/ui/typography';
import { cn } from "@/lib/utils";

import { LoadingSpinner } from "@/components/ui/loading-state"
export type LoadingStage = 'connecting' | 'initializing' | 'joining' | 'reconnecting';

interface CallLoadingStateProps {
  stage: LoadingStage;
  message?: string;
  onCancel?: () => void;
  className?: string;
}

export function CallLoadingState({
  stage,
  message,
  onCancel,
  className
}: CallLoadingStateProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let targetProgress = 0;

    switch (stage) {
      case 'connecting':
        targetProgress = 30;
        break;
      case 'initializing':
        targetProgress = 60;
        break;
      case 'joining':
        targetProgress = 90;
        break;
      case 'reconnecting':
        targetProgress = 45;
        break;
    }

    // Smooth progress animation
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= targetProgress) return targetProgress;
        return prev + Math.random() * 5; // Random increment for "real" feel
      });
    }, 200);

    return () => clearInterval(timer);
  }, [stage]);

  const defaultMessages = {
    connecting: "Conectando ao servidor...",
    initializing: "Preparando dispositivos...",
    joining: "Entrando na sala...",
    reconnecting: "Tentando reconectar..."
  };

  return (
    <div className={cn("flex flex-col items-center justify-center h-full w-full bg-video-bg text-video-text inset-dialog", className)}>
      <div className={cn("w-full max-w-sm flex flex-col items-center inline-loose")}>
        <div className="relative">
          <div className="absolute inset-0 bg-info/20 blur-xl rounded-full" />
          <LoadingSpinner className="size-16 text-info relative z-10" />
        </div>

        <div className={cn("text-center stack-tight w-full")}>
          <Heading level="card">
            {message || defaultMessages[stage]}
          </Heading>
          <p className={cn("text-body-sm text-video-muted")}>
            Aguarde um momento...
          </p>
        </div>

        <div className={cn("w-full stack-tight")}>
          <Progress value={progress} className="h-2" />
          <Text variant="caption" className="text-right text-video-muted">{Math.round(progress)}%</Text>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className={cn("mt-4 text-body-sm text-video-muted hover:text-video-text transition-colors underline decoration-dotted")}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
