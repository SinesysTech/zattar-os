'use client';

import { MessageSquare, Globe, FileText, Users } from 'lucide-react';
import { ScrollArea } from ' @/components/ui/scroll-area';
import { cn } from ' @/lib/utils';
import { SalaChat, TipoSalaChat } from ' @/core/chat/domain';

interface RoomListProps {
  salas: SalaChat[];
  salaAtiva: SalaChat | null;
  onSelectSala: (sala: SalaChat) => void;
}

export function RoomList({ salas, salaAtiva, onSelectSala }: RoomListProps) {
  const getTipoIcon = (tipo: TipoSalaChat) => {
    switch (tipo) {
      case TipoSalaChat.Geral:
        return <Globe className="h-4 w-4" />;
      case TipoSalaChat.Documento:
        return <FileText className="h-4 w-4" />;
      case TipoSalaChat.Privado:
        return <Users className="h-4 w-4" />;
      case TipoSalaChat.Grupo:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {salas.map((sala) => (
          <button
            key={sala.id}
            type="button"
            onClick={() => onSelectSala(sala)}
            className={cn(
              'w-full text-left px-3 py-3 rounded-lg transition-colors',
              'hover:bg-muted/50',
              salaAtiva?.id === sala.id && 'bg-muted'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">{getTipoIcon(sala.tipo)}</div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm truncate block">
                  {sala.tipo === TipoSalaChat.Geral ? 'Sala Geral' : sala.nome}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
