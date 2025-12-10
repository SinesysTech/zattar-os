'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from ' @/components/ui/button';
import { Input } from ' @/components/ui/input';
import { ScrollArea } from ' @/components/ui/scroll-area';
import { Avatar, AvatarFallback } from ' @/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MensagemComUsuario } from ' @/core/chat/domain';
import { useChatSubscription } from ' @/hooks/modules/chat/use-chat-subscription';
import { useTypingIndicator } from ' @/hooks/modules/chat/use-typing-indicator';
import { actionEnviarMensagem } from ' @/app/actions/chat';
import { toast } from 'sonner';

interface ChatWindowProps {
  salaId: number;
  initialMessages: MensagemComUsuario[];
  currentUserId: number;
  currentUserName: string;
}

export function ChatWindow({
  salaId,
  initialMessages,
  currentUserId,
  currentUserName,
}: ChatWindowProps) {
  const [mensagens, setMensagens] = useState<MensagemComUsuario[]>(initialMessages);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook de Realtime Subscription
  useChatSubscription({
    salaId,
    onNewMessage: (mensagem) => {
      setMensagens((prev) => {
        // Evitar duplicatas
        if (prev.some((m) => m.id === mensagem.id)) return prev;
        return [...prev, mensagem];
      });

      // Auto-scroll para nova mensagem
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    enabled: true,
  });

  // Hook de Typing Indicator
  const { typingIndicatorText, startTyping, stopTyping } = useTypingIndicator(
    salaId,
    currentUserId,
    currentUserName
  );

  // Scroll inicial
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || sending) return;

    setSending(true);
    stopTyping();

    const result = await actionEnviarMensagem(salaId, novaMensagem.trim());

    if (!result.success) {
      toast.error(result.error);
    } else {
      setNovaMensagem('');
    }

    setSending(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNovaMensagem(e.target.value);
    if (e.target.value.length > 0) {
      startTyping();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Lista de Mensagens */}
      <ScrollArea className="flex-1 p-4">
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
                    {formatDistanceToNow(new Date(mensagem.createdAt), {
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
      </ScrollArea>

      {/* Indicador de Digitação */}
      {typingIndicatorText && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
            </span>
            <span>{typingIndicatorText}</span>
          </div>
        </div>
      )}

      {/* Input de Mensagem */}
      <div className="border-t p-4">
        <form onSubmit={handleEnviar} className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={novaMensagem}
            onChange={handleInputChange}
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={!novaMensagem.trim() || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
