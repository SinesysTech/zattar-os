'use client';

/**
 * Componente de interface de chat reutilizável
 * Usa Supabase Realtime Broadcast para mensagens em tempo real
 * @see https://supabase.com/ui/docs/nextjs/realtime-chat
 */

import * as React from 'react';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { RealtimeChat } from '@/components/realtime-chat';
import type { ChatMessage } from '@/hooks/use-realtime-chat';

interface ChatInterfaceProps {
  salaId: number;
  currentUserId: number;
  currentUserName?: string;
  className?: string;
  showHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  headerActions?: React.ReactNode;
  compact?: boolean;
}

interface MensagemDB {
  id: number;
  conteudo: string;
  usuario_id: number;
  created_at: string;
  usuario?: {
    id: number;
    nome_completo: string;
    nome_exibicao: string | null;
    email_corporativo: string | null;
  };
}

/**
 * Converte mensagens do banco para o formato do Supabase UI
 * Preferimos nome_exibicao (mais curto) sobre nome_completo
 * Inclui o ID do usuário para identificação correta do autor
 */
function convertDBMessageToChat(msg: MensagemDB): ChatMessage {
  return {
    id: String(msg.id),
    content: msg.conteudo,
    user: {
      id: msg.usuario?.id ?? msg.usuario_id,
      name: msg.usuario?.nome_exibicao || msg.usuario?.nome_completo || 'Usuário',
    },
    createdAt: msg.created_at,
  };
}

export function ChatInterface({
  salaId,
  currentUserId,
  currentUserName,
  className,
  showHeader = true,
  headerTitle = 'Chat',
  headerSubtitle,
  headerActions,
  compact = false,
}: ChatInterfaceProps) {
  const [initialMessages, setInitialMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userName, setUserName] = React.useState(currentUserName || '');

  // Buscar nome do usuário se não fornecido
  React.useEffect(() => {
    async function fetchUserName() {
      if (currentUserName) {
        setUserName(currentUserName);
        return;
      }

      try {
        const response = await fetch('/api/perfil');
        const data = await response.json();

        if (data.success && data.data) {
          // Preferir nome de exibição (mais curto)
          setUserName(data.data.nomeExibicao || data.data.nomeCompleto || 'Usuário');
        }
      } catch (error) {
        console.error('Erro ao buscar nome do usuário:', error);
        setUserName('Usuário');
      }
    }

    fetchUserName();
  }, [currentUserName]);

  // Buscar mensagens existentes
  React.useEffect(() => {
    async function fetchMensagens() {
      try {
        const response = await fetch(
          `/api/chat/salas/${salaId}/mensagens?modo=ultimas&limite=100`
        );
        const data = await response.json();

        if (data.success) {
          // Converter mensagens do banco para formato do Supabase UI
          const convertedMessages = data.data
            .map(convertDBMessageToChat)
            .reverse(); // Ordem cronológica
          setInitialMessages(convertedMessages);
        }
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMensagens();
  }, [salaId]);

  // Callback para persistir mensagens no banco
  const handleMessage = React.useCallback(
    async (messages: ChatMessage[]) => {
      if (messages.length === 0) return;

      // Pegar apenas a última mensagem (nova)
      const lastMessage = messages[messages.length - 1];

      // Verificar se é uma mensagem nova (não está nas iniciais e é do usuário atual)
      const isNew = !initialMessages.some((m) => m.id === lastMessage.id);
      // Verificar por ID se disponível, senão fallback para nome
      const isOwn = lastMessage.user.id
        ? lastMessage.user.id === currentUserId
        : lastMessage.user.name === userName;

      if (isNew && isOwn) {
        try {
          await fetch(`/api/chat/salas/${salaId}/mensagens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conteudo: lastMessage.content,
              tipo: 'texto',
            }),
          });
        } catch (error) {
          console.error('Erro ao persistir mensagem:', error);
        }
      }
    },
    [salaId, initialMessages, userName, currentUserId]
  );

  if (loading) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        {showHeader && (
          <div className="border-b border-border p-4">
            <Skeleton className="h-5 w-32" />
            {headerSubtitle && <Skeleton className="h-3 w-24 mt-1" />}
          </div>
        )}
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2 ml-auto" />
          <Skeleton className="h-12 w-2/3" />
        </div>
      </div>
    );
  }

  // Nome único do room baseado na sala
  const roomName = `sala-${salaId}-chat`;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      {showHeader && (
        <div className={cn('border-b border-border', compact ? 'p-3' : 'p-4')}>
          <div className={cn('flex items-center justify-between', compact && 'gap-2')}>
            <h3 className={cn('font-semibold flex items-center gap-2', compact && 'text-sm')}>
              <MessageSquare className={cn('h-4 w-4', compact && 'h-3 w-3')} />
              {headerTitle}
            </h3>
            {headerActions}
          </div>
          {headerSubtitle && (
            <p className="text-xs text-muted-foreground mt-1">{headerSubtitle}</p>
          )}
        </div>
      )}

      {/* Chat usando componente oficial do Supabase UI */}
      <div className="flex-1 min-h-0">
        <RealtimeChat
          roomName={roomName}
          username={userName}
          userId={currentUserId}
          messages={initialMessages}
          onMessage={handleMessage}
        />
      </div>
    </div>
  );
}
