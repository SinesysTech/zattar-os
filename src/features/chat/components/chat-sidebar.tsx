'use client';

/**
 * CHAT FEATURE - ChatSidebar Component
 *
 * Sidebar do chat com lista de salas e navegação.
 */

import { useRouter } from 'next/navigation';
import { RoomList } from './room-list';
import type { SalaChat } from '../types';

interface ChatSidebarProps {
  /** Lista de salas disponíveis */
  salas: SalaChat[];
  /** Sala atualmente selecionada */
  salaAtiva: SalaChat | null;
}

/**
 * Sidebar do chat com lista de salas.
 * Ao selecionar uma sala, navega para a URL correspondente.
 */
export function ChatSidebar({ salas, salaAtiva }: ChatSidebarProps) {
  const router = useRouter();

  const handleSelectSala = (sala: SalaChat) => {
    router.push(`/chat?channelId=${sala.id}`);
  };

  return <RoomList salas={salas} salaAtiva={salaAtiva} onSelectSala={handleSelectSala} />;
}
