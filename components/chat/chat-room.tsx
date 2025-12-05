'use client';

/**
 * Componente de sala de chat
 * Exibe mensagens em tempo real usando Supabase Realtime
 * Inclui indicador "usuário está digitando"
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

// Tipos para indicador de digitação
interface TypingUser {
  userId: number;
  userName: string;
  timestamp: number;
}

interface ChatRoomProps {
  sala: SalaChatComInfo;
  currentUserId?: number;
  currentUserName?: string;
}

// Tempo em ms para considerar que o usuário parou de digitar
const TYPING_TIMEOUT = 3000;

export function ChatRoom({ sala, currentUserId, currentUserName }: ChatRoomProps) {
  const supabase = createClient();

  const [mensagens, setMensagens] = React.useState<MensagemChatComUsuario[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [novaMensagem, setNovaMensagem] = React.useState('');

  // Estado para usuários digitando
  const [typingUsers, setTypingUsers] = React.useState<Map<number, TypingUser>>(new Map());
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = React.useRef(false);

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

  // Subscribe a novas mensagens e typing (Realtime)
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
      // Escutar eventos de typing
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { userId, userName, isTyping } = payload as {
          userId: number;
          userName: string;
          isTyping: boolean;
        };

        // Ignorar próprios eventos
        if (userId === currentUserId) return;

        setTypingUsers((prev) => {
          const newMap = new Map(prev);

          if (isTyping) {
            newMap.set(userId, {
              userId,
              userName,
              timestamp: Date.now(),
            });
          } else {
            newMap.delete(userId);
          }

          return newMap;
        });
      })
      .subscribe();

    // Limpar usuários que pararam de digitar (timeout)
    const cleanupInterval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const newMap = new Map(prev);

        for (const [userId, user] of newMap) {
          if (now - user.timestamp > TYPING_TIMEOUT) {
            newMap.delete(userId);
          }
        }

        return newMap.size !== prev.size ? newMap : prev;
      });
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
    };
  }, [sala.id, supabase, currentUserId]);

  // Função para broadcast do estado de typing
  const broadcastTyping = React.useCallback(
    async (isTyping: boolean) => {
      if (!currentUserId || !currentUserName) return;

      const channel = supabase.channel(`sala_${sala.id}`);

      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserId,
          userName: currentUserName,
          isTyping,
        },
      });
    },
    [sala.id, supabase, currentUserId, currentUserName]
  );

  // Handler para mudança no input com debounce de typing
  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNovaMensagem(e.target.value);

      // Se começou a digitar, broadcast
      if (!isTypingRef.current && e.target.value.length > 0) {
        isTypingRef.current = true;
        broadcastTyping(true);
      }

      // Reset timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Se parar de digitar após timeout
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          broadcastTyping(false);
        }
      }, TYPING_TIMEOUT);
    },
    [broadcastTyping]
  );

  // Formatar lista de usuários digitando
  const typingIndicatorText = React.useMemo(() => {
    const users = Array.from(typingUsers.values());

    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0].userName} está digitando...`;
    if (users.length === 2) return `${users[0].userName} e ${users[1].userName} estão digitando...`;

    return `${users.length} pessoas estão digitando...`;
  }, [typingUsers]);

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaMensagem.trim() || sending) return;

    setSending(true);

    // Limpar estado de typing ao enviar
    if (isTypingRef.current) {
      isTypingRef.current = false;
      broadcastTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

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

      {/* Indicador de digitação */}
      {typingIndicatorText && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>
                •
              </span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>
                •
              </span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>
                •
              </span>
            </span>
            <span>{typingIndicatorText}</span>
          </div>
        </div>
      )}

      {/* Input de mensagem */}
      <div className="border-t p-4">
        <form onSubmit={handleEnviarMensagem} className="flex gap-2">
          <Input
            placeholder={`Mensagem em ${sala.nome}`}
            value={novaMensagem}
            onChange={handleInputChange}
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
