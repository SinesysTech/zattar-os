'use client';

/**
 * Lista de salas de chat (componente auxiliar)
 */

import * as React from 'react';
import { Hash, Lock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SalaChatComInfo } from '@/backend/types/documentos/types';

interface RoomListProps {
  salas: SalaChatComInfo[];
  salaAtualId?: number | null;
  onSalaSelect: (sala: SalaChatComInfo) => void;
}

export function RoomList({ salas, salaAtualId, onSalaSelect }: RoomListProps) {
  return (
    <div className="space-y-1">
      {salas.map((sala) => (
        <Button
          key={sala.id}
          variant={salaAtualId === sala.id ? 'secondary' : 'ghost'}
          className="w-full justify-start gap-2"
          onClick={() => onSalaSelect(sala)}
        >
          {sala.tipo === 'geral' && <Hash className="h-4 w-4" />}
          {sala.tipo === 'privado' && <Lock className="h-4 w-4" />}
          {sala.tipo === 'documento' && <MessageSquare className="h-4 w-4" />}
          <span className="truncate">{sala.nome}</span>
          {sala.total_nao_lidas ? (
            <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {sala.total_nao_lidas}
            </span>
          ) : null}
        </Button>
      ))}
    </div>
  );
}
