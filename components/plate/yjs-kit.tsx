/**
 * Kit Yjs para Plate.js com utilitários
 *
 * Funções auxiliares para configuração do Yjs com Plate.
 */

'use client';

// Re-exportar YjsPlugin do pacote correto
export { YjsPlugin } from '@platejs/yjs/react';

/**
 * Cores para cursores de usuários
 */
export const CURSOR_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

/**
 * Gera cor única baseada no ID do usuário
 */
export function getUserColor(userId: number): string {
  return CURSOR_COLORS[userId % CURSOR_COLORS.length];
}

/**
 * Cria dados do cursor para o usuário atual
 */
export function createCursorData(user: {
  id: number;
  name: string;
  email?: string;
}): { name: string; color: string } {
  return {
    name: user.name,
    color: getUserColor(user.id),
  };
}
