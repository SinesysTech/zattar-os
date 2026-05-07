'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';

interface GazetteAlertBannerProps {
  count: number;
  descricao: string;
  onVerPrazos: () => void;
}

export function GazetteAlertBanner({ count, descricao, onVerPrazos }: GazetteAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || count === 0) return null;

  return (
    <div className={cn("flex items-center inline-medium border-b border-destructive/15 bg-destructive/5 px-4 py-2.5")}>
      {/* Icon */}
      <div className={cn("flex shrink-0 items-center justify-center rounded-lg bg-destructive/10 inset-snug")}>
        <AlertTriangle className="size-3.5 text-destructive" aria-hidden />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <Text variant="caption" weight="medium" className="leading-none text-destructive">
          {count} prazo{count !== 1 ? 's' : ''} crítico{count !== 1 ? 's' : ''}
        </Text>
        <Text variant="micro-caption" className={cn("mt-0.5 leading-tight text-destructive/70")}>
          {descricao}
        </Text>
      </div>

      {/* Actions */}
      <div className={cn("flex shrink-0 items-center inline-tight")}>
        <Button
          variant="outline"
          size="sm"
          onClick={onVerPrazos}
          className={cn("h-7 border-destructive/30 px-3 text-caption text-destructive hover:bg-destructive/10 hover:text-destructive")}
        >
          Ver Prazos
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex size-6 items-center justify-center rounded text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Fechar alerta"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
