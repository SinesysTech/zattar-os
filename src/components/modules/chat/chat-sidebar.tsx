'use client';

import { useRouter } from 'next/navigation';
import { RoomList } from './room-list';
import { SalaChat } from ' @/core/chat/domain';

interface ChatSidebarProps {
  salas: SalaChat[];
  salaAtiva: SalaChat | null;
}

export function ChatSidebar({ salas, salaAtiva }: ChatSidebarProps) {
  const router = useRouter();

  const handleSelectSala = (sala: SalaChat) => {
    router.push(`/chat?channelId=${sala.id}`);
  };

  return <RoomList salas={salas} salaAtiva={salaAtiva} onSelectSala={handleSelectSala} />;
}
