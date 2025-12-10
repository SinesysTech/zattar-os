'use client';

/**
 * Lista de salas de chat (componente auxiliar)
 */

import * as React from 'react';
import { Hash, Lock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBadge, SidebarNotification } from '@/components/chat/notification-badge';
import { cn } from '@/lib/utils';
import type { SalaChatComInfo } from '@/backend/types/documentos/types';

interface RoomListProps {
  salas: SalaChatComInfo[];
  salaAtualId?: number | null;
  onSalaSelect: (sala: SalaChatComInfo) => void;
}

export function RoomList({ salas, salaAtualId, onSalaSelect }: RoomListProps) {
  const getRoomIcon = (tipo: string) => {
    switch (tipo) {
      case 'geral':
        return <Hash className="h-4 w-4" />;
      case 'privado':
        return <Lock className="h-4 w-4" />;
      case 'documento':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-1">
      {salas.map((sala) => {
        const roomId = sala.id.toString();
        const isSelected = salaAtualId === sala.id;
        
        return (
          <Button
            key={sala.id}
            variant={isSelected ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2 h-auto p-3"
            onClick={() => onSalaSelect(sala)}
          >
            {getRoomIcon(sala.tipo)}
            <span className="truncate flex-1 text-left">{sala.nome}</span>
            <NotificationBadge 
              roomId={roomId} 
              className="ml-auto"
              maxCount={9}
            />
          </Button>
        );
      })}
    </div>
  );
}

// Versão alternativa com SidebarNotification para funcionalidades avançadas
export function RoomListAdvanced({ salas, salaAtualId, onSalaSelect }: RoomListProps) {
  const getRoomIcon = (tipo: string) => {
    switch (tipo) {
      case 'geral':
        return <Hash className="h-4 w-4 text-muted-foreground" />;
      case 'privado':
        return <Lock className="h-4 w-4 text-muted-foreground" />;
      case 'documento':
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-1">
      {salas.map((sala) => {
        const roomId = sala.id.toString();
        const isSelected = salaAtualId === sala.id;
        
        return (
          <div
            key={sala.id}
            className={cn(
              "w-full h-auto p-3 cursor-pointer hover:bg-muted/50 rounded-md transition-colors",
              isSelected ? "bg-muted" : ""
            )}
            onClick={() => onSalaSelect(sala)}
          >
            <SidebarNotification
              roomId={roomId}
              roomName={sala.nome}
              icon={getRoomIcon(sala.tipo)}
              className="w-full"
            />
          </div>
        );
      })}
    </div>
  );
}
