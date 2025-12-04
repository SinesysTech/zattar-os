/**
 * Kit Yjs para Plate.js com Supabase Realtime
 *
 * Integra CRDT via Yjs para edição colaborativa em tempo real.
 * Usa Supabase Realtime como transporte ao invés de Hocuspocus/WebRTC.
 */

'use client';

import { YjsPlugin as BaseYjsPlugin } from '@platejs/yjs';
import { withPlaceholder } from '@platejs/yjs/react';
import { CursorOverlay, type CursorData } from '@slate-yjs/react';
import * as React from 'react';

export { CursorOverlay, type CursorData };

/**
 * Cria plugin Yjs para uso com Plate
 *
 * @param ydoc - Documento Yjs já configurado
 * @param cursorData - Dados do cursor do usuário atual
 */
export function createYjsPlugin(options: {
  cursorData?: CursorData;
}) {
  return BaseYjsPlugin.configure({
    render: {
      afterEditable: options.cursorData
        ? () => <CursorOverlay />
        : undefined,
    },
    options: {
      cursorOptions: options.cursorData
        ? {
            data: options.cursorData,
          }
        : undefined,
    },
  });
}

/**
 * HOC para adicionar placeholder em elementos Yjs
 */
export { withPlaceholder };

/**
 * Gera cor única baseada no ID do usuário
 */
export function getUserColor(userId: number): string {
  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];
  return colors[userId % colors.length];
}

/**
 * Cria dados do cursor para o usuário atual
 */
export function createCursorData(user: {
  id: number;
  name: string;
  email?: string;
}): CursorData {
  return {
    name: user.name,
    color: getUserColor(user.id),
  };
}
