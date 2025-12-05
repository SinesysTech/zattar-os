'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';

interface NotificationBadgeProps {
  roomId: string;
  className?: string;
  showZero?: boolean;
  maxCount?: number;
}

export function NotificationBadge({ 
  roomId, 
  className,
  showZero = false,
  maxCount = 99 
}: NotificationBadgeProps) {
  const { unreadCounts } = useNotifications();
  const count = unreadCounts[roomId] || 0;

  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <Badge 
      variant="destructive"
      className={cn(
        'h-5 min-w-[20px] px-1.5 text-xs font-bold flex items-center justify-center',
        className
      )}
    >
      {count > maxCount ? `${maxCount}+` : count}
    </Badge>
  );
}

// Componente para exibir badge no título da sala
interface RoomTitleBadgeProps {
  roomId: string;
  roomName: string;
  className?: string;
}

export function RoomTitleBadge({ roomId, roomName, className }: RoomTitleBadgeProps) {
  const { unreadCounts, markRoomAsRead } = useNotifications();
  const count = unreadCounts[roomId] || 0;

  const handleClick = () => {
    if (count > 0) {
      markRoomAsRead(roomId);
    }
  };

  if (count === 0) {
    return <span className={className}>{roomName}</span>;
  }

  return (
    <span 
      className={cn('flex items-center gap-2 cursor-pointer hover:underline', className)}
      onClick={handleClick}
      title={count === 1 ? '1 mensagem não lida' : `${count} mensagens não lidas`}
    >
      {roomName}
      <Badge 
        variant="destructive"
        className="h-4 min-w-[16px] px-1 text-xs font-bold"
      >
        {count > 9 ? '9+' : count}
      </Badge>
    </span>
  );
}

// Componente para indicador de notificação na sidebar
interface SidebarNotificationProps {
  roomId: string;
  roomName: string;
  icon?: React.ReactNode;
  className?: string;
}

export function SidebarNotification({ 
  roomId, 
  roomName, 
  icon, 
  className 
}: SidebarNotificationProps) {
  const { unreadCounts, markRoomAsRead } = useNotifications();
  const count = unreadCounts[roomId] || 0;

  const handleClick = () => {
    if (count > 0) {
      markRoomAsRead(roomId);
    }
  };

  return (
    <div 
      className={cn(
        'relative flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-colors',
        className
      )}
      onClick={handleClick}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{roomName}</p>
        {count > 0 && (
          <p className="text-xs text-muted-foreground">
            {count === 1 ? '1 nova mensagem' : `${count} novas mensagens`}
          </p>
        )}
      </div>
      
      {count > 0 && (
        <Badge 
          variant="destructive"
          className="h-4 min-w-[16px] px-1 text-xs font-bold animate-pulse"
        >
          {count > 9 ? '9+' : count}
        </Badge>
      )}
    </div>
  );
}

// Indicador visual para notificação (ponto vermelho)
export function NotificationDot({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        'absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse',
        className
      )}
    />
  );
}

// Badge para indicar que há notificações sem ler (ícone de sino)
export function NotificationBell({ className }: { className?: string }) {
  const { totalUnread } = useNotifications();
  const { requestPermission } = useNotifications();

  const handleClick = () => {
    if (totalUnread > 0) {
      // Aqui você pode abrir um painel de notificações
      console.log('Abrir painel de notificações');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative p-2 rounded-full transition-colors hover:bg-muted',
        className
      )}
      title={`${totalUnread} notificações não lidas`}
    >
      <svg 
        className="h-5 w-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 17h5l-5-5V9a6 6 0 10-12 0v3l-5 5h5m7 0v1a3 3 0 11-6 0v-1m6 0H9" 
        />
      </svg>
      
      {totalUnread > 0 && (
        <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {totalUnread > 9 ? '9+' : totalUnread}
        </div>
      )}
    </button>
  );
}