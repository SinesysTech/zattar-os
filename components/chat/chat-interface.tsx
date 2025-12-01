'use client';

/**
 * Interface principal do chat interno
 * Usa Supabase Realtime para mensagens em tempo real
 */

import * as React from 'react';
import { MessageSquare, Plus, Hash, Lock, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { createClient } from '@/app/_lib/supabase/client';
import { RoomList } from '@/components/chat/room-list';
import { ChatRoom } from '@/components/chat/chat-room';
import { CreateRoomDialog } from '@/components/chat/create-room-dialog';
import type { SalaChatComInfo } from '@/backend/types/documentos/types';

export function ChatInterface() {
  const supabase = createClient();

  const [salas, setSalas] = React.useState<SalaChatComInfo[]>([]);
  const [salaAtual, setSalaAtual] = React.useState<SalaChatComInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [createRoomOpen, setCreateRoomOpen] = React.useState(false);

  // Carregar salas
  React.useEffect(() => {
    async function fetchSalas() {
      try {
        const response = await fetch('/api/chat/salas');
        const data = await response.json();

        if (data.success) {
          setSalas(data.data);

          // Selecionar Sala Geral automaticamente
          const salaGeral = data.data.find((s: SalaChatComInfo) => s.tipo === 'geral');
          if (salaGeral) {
            setSalaAtual(salaGeral);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar salas:', error);
        toast.error('Erro ao carregar salas de chat');
      } finally {
        setLoading(false);
      }
    }

    fetchSalas();
  }, []);

  // Subscribe a mudanças nas salas (Realtime)
  React.useEffect(() => {
    const channel = supabase
      .channel('salas_chat_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salas_chat',
        },
        (payload) => {
          console.log('Sala change:', payload);

          if (payload.eventType === 'INSERT') {
            // Nova sala criada
            const novaSala = payload.new as any;
            setSalas((prev) => [...prev, novaSala]);
          } else if (payload.eventType === 'DELETE') {
            // Sala deletada
            setSalas((prev) => prev.filter((s) => s.id !== payload.old.id));
            if (salaAtual?.id === payload.old.id) {
              setSalaAtual(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, salaAtual]);

  const handleSalaSelect = (sala: SalaChatComInfo) => {
    setSalaAtual(sala);
  };

  const handleRoomCreated = () => {
    // Recarregar salas
    fetch('/api/chat/salas')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSalas(data.data);
        }
      });
  };

  if (loading) {
    return (
      <div className="flex flex-1">
        <div className="w-64 border-r p-4 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar - Lista de salas */}
      <div className="w-64 border-r bg-muted/10">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">Salas de Chat</h2>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {salas.map((sala) => (
                <Button
                  key={sala.id}
                  variant={salaAtual?.id === sala.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2"
                  onClick={() => handleSalaSelect(sala)}
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
          </ScrollArea>

          <div className="border-t p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setCreateRoomOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Sala
            </Button>
          </div>
        </div>
      </div>

      {/* Main - Chat da sala */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {salaAtual ? (
          <ChatRoom sala={salaAtual} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Selecione uma sala</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Escolha uma sala para começar a conversar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Usuários online (opcional) */}
      <div className="w-64 border-l bg-muted/10">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Online
            </h2>
          </div>
          <div className="flex-1 p-4">
            <p className="text-sm text-muted-foreground text-center">
              Lista de usuários online
            </p>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateRoomDialog
        open={createRoomOpen}
        onOpenChange={setCreateRoomOpen}
        onSuccess={handleRoomCreated}
      />
    </div>
  );
}
