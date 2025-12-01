'use client';

/**
 * Componente de sala de chat
 * Exibe mensagens em tempo real usando Supabase Realtime
 */

import * as React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { createClient } from '@/app/_lib/supabase/client';
import type { SalaChatComInfo, MensagemChatComUsuario } from '@/backend/types/documentos/types';

interface ChatRoomProps {
  sala: SalaChatComInfo;
}

export function ChatRoom({ sala }: ChatRoomProps) {
  const supabase = createClient();

  const [mensagens, setMensagens] = React.useState<MensagemChatComUsuario[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [novaMensagem, setNovaMensagem] = React.useState('');

  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Carregar mensagens iniciais
  React.useEffect(() => {
    async function fetchMensagens() {
      setLoading(true);
      try {
        const response = await fetch(`/api/chat/salas/${sala.id}/mensagens?modo=ultimas&limite=50`);
        const data = await response.json();

        if (data.success) {
          setMensagens(data.data);
          // Scroll para o final
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        toast.error('Erro ao carregar mensagens');
      } finally {
        setLoading(false);
      }
    }

    fetchMensagens();
  }, [sala.id]);

  // Subscribe a novas mensagens (Realtime)
  React.useEffect(() => {
    const channel = supabase
      .channel(`sala_${sala.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_chat',
          filter: `sala_id=eq.${sala.id}`,
        },
        async (payload) => {
          console.log('Nova mensagem:', payload);

          // Buscar dados completos da mensagem (com usuário)
          const response = await fetch(`/api/chat/salas/${sala.id}/mensagens?modo=ultimas&limite=1`);
          const data = await response.json();

          if (data.success && data.data.length > 0) {
            const novaMensagem = data.data[data.data.length - 1];

            setMensagens((prev) => {
              // Evitar duplicatas
              if (prev.some((m) => m.id === novaMensagem.id)) {
                return prev;
              }
              return [...prev, novaMensagem];
            });

            // Scroll para o final
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sala.id, supabase]);

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaMensagem.trim() || sending) return;

    setSending(true);

    try {
      const response = await fetch(`/api/chat/salas/${sala.id}/mensagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo: novaMensagem.trim(),
          tipo: 'texto',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      setNovaMensagem('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header da sala */}
      <div className="border-b p-4">
        <h2 className="font-semibold">{sala.nome}</h2>
        {sala.documento && (
          <p className="text-sm text-muted-foreground">Documento: {sala.documento.titulo}</p>
        )}
      </div>

      {/* Lista de mensagens */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Seja o primeiro!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mensagens.map((mensagem) => (
              <div key={mensagem.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {mensagem.usuario.nomeCompleto.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-sm">
                      {mensagem.usuario.nomeExibicao || mensagem.usuario.nomeCompleto}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(mensagem.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 break-words">{mensagem.conteudo}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input de mensagem */}
      <div className="border-t p-4">
        <form onSubmit={handleEnviarMensagem} className="flex gap-2">
          <Input
            placeholder={`Mensagem em ${sala.nome}`}
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={!novaMensagem.trim() || sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
