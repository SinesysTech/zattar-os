'use client';

/**
 * Componente que exibe cursores remotos de colaboradores
 * Mostra indicadores visuais de onde outros usuários estão trabalhando
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import type { RemoteCursor } from '@/hooks/use-realtime-collaboration';

interface RemoteCursorsOverlayProps {
  cursors: RemoteCursor[];
}

export function RemoteCursorsOverlay({ cursors }: RemoteCursorsOverlayProps) {
  if (cursors.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {cursors.map((cursor) => (
        <RemoteCursorIndicator key={cursor.userId} cursor={cursor} />
      ))}
    </div>
  );
}

interface RemoteCursorIndicatorProps {
  cursor: RemoteCursor;
}

function RemoteCursorIndicator({ cursor }: RemoteCursorIndicatorProps) {
  // O indicador é exibido como um pequeno badge flutuante
  // A posição exata do cursor seria calculada pelo editor Plate
  // Por ora, mostramos apenas um indicador de que o usuário está ativo

  return (
    <div
      className={cn(/* design-system-escape: gap-1 gap sem token DS; px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ /* design-system-escape: px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "absolute top-2 left-2 flex items-center inline-micro rounded-full px-2 py-1 text-caption font-medium text-white shadow-md animate-pulse")}
      style={{ backgroundColor: cursor.color }}
    >
      <span className="h-2 w-2 rounded-full bg-white/80" />
      <span>{cursor.userName}</span>
    </div>
  );
}
