import React from 'react';
import { Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScreenshareBannerProps {
  isScreensharing: boolean;
  participantName: string | null;
  onStop?: () => void;
  isSelf?: boolean;
}

export function ScreenshareBanner({
  isScreensharing,
  participantName,
  onStop,
  isSelf = false
}: ScreenshareBannerProps) {
  if (!isScreensharing && !participantName) return null;

  return (
    <div className={cn(
      /* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "absolute top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between text-body-sm shadow-md transition-transform duration-300 transform",
      isSelf ? "bg-info text-white" : "bg-video-surface-hover text-video-text"
    )}>
      <div className={cn("flex items-center inline-tight")}>
        <Monitor className="w-4 h-4" />
        <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>
          {isSelf ? "Você está compartilhando sua tela" : `${participantName} está compartilhando a tela`}
        </span>
      </div>

      {isSelf && onStop && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onStop}
          className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv. */ "h-7 px-2 hover:bg-white/20 text-white hover:text-white")}
        >
          Parar
        </Button>
      )}
    </div>
  );
}
