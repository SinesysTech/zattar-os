'use client';

import * as React from 'react';
import { RoomTitleBadge } from '@/components/chat/notification-badge';

interface RoomTitleWithBadgeProps {
  roomId: string;
  roomName: string;
  className?: string;
  showBadge?: boolean;
  maxCount?: number;
}

export function RoomTitleWithBadge({
  roomId,
  roomName,
  className,
  showBadge = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parâmetro reservado para uso futuro
  maxCount = 9,
}: RoomTitleWithBadgeProps) {
  if (showBadge) {
    return (
      <RoomTitleBadge
        roomId={roomId}
        roomName={roomName}
        className={className}
      />
    );
  }

  return <span className={className}>{roomName}</span>;
}

// Componente para título da sala no header do chat
interface ChatHeaderTitleProps {
  roomId: string;
  roomName: string;
  tipo?: 'geral' | 'documento' | 'privado' | 'grupo';
  compact?: boolean;
  className?: string;
}

export function ChatHeaderTitle({
  roomId,
  roomName,
  tipo,
  compact = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parâmetro reservado para uso futuro
  className,
}: ChatHeaderTitleProps) {
  return (
    <div className="flex items-center gap-2">
      <h3 className={compact ? 'text-sm font-semibold' : 'font-semibold'}>
        <RoomTitleWithBadge
          roomId={roomId}
          roomName={roomName}
          maxCount={9}
        />
      </h3>
      
      {/* Indicador de tipo de sala */}
      {tipo && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {tipo.toUpperCase()}
        </span>
      )}
    </div>
  );
}

// Componente para título responsivo da sala
interface ResponsiveRoomTitleProps {
  roomId: string;
  roomName: string;
  tipo?: 'geral' | 'documento' | 'privado' | 'grupo';
  showNotificationCount?: boolean;
  className?: string;
  mobileTitle?: string;
}

export function ResponsiveRoomTitle({
  roomId,
  roomName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parâmetro reservado para uso futuro
  tipo,
  showNotificationCount = true,
  className,
  mobileTitle,
}: ResponsiveRoomTitleProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const displayTitle = isMobile && mobileTitle ? mobileTitle : roomName;

  return (
    <RoomTitleWithBadge
      roomId={roomId}
      roomName={displayTitle}
      showBadge={showNotificationCount}
      className={className}
    />
  );
}