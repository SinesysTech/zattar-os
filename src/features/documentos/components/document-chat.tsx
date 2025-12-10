'use client';

/**
 * Componente de chat do documento usando Supabase Realtime Broadcast
 * Baseado no componente oficial do Supabase UI Library
 * @see https://supabase.com/ui/docs/nextjs/realtime-chat
 */

import * as React from 'react';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RealtimeChat } from '@/components/realtime/realtime-chat';
import type { ChatMessage } from '@/hooks/use-realtime-chat';

interface DocumentChatProps {
  documentoId: number;
  currentUserName: string;
}

interface SalaChat {
  id: number;
  nome: string;
  documento_id: number | null;
}

interface MensagemDB {
  id: number;
  conteudo: string;
  usuario_id: number;
  created_at: string;
  usuario?: {
    nomeCompleto: string;
  };
}

/**
 * Converte mensagens do banco para o formato do Supabase UI
 */
function convertDBMessageToChat(msg: MensagemDB): ChatMessage {
  return {
    id: String(msg.id),
    content: msg.conteudo,
    user: {
      name: msg.usuario?.nomeCompleto || 'Usuário',
    },
    createdAt: msg.created_at,
  };
}

export function DocumentChat({ documentoId, currentUserName }: DocumentChatProps) {
  const [sala, setSala] = React.useState<SalaChat | null>(null);
  const [initialMessages, setInitialMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Buscar ou criar sala de chat do documento
  React.useEffect(() => {
    async function fetchOrCreateSala() {
      try {
        // Buscar sala existente
        const response = await fetch(`/api/chat/salas?tipo=documento&documento_id=${documentoId}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          setSala(data.data[0]);
        } else {
          // Criar nova sala
          const createResponse = await fetch('/api/chat/salas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome: `Chat do Documento #${documentoId}`,
              tipo: 'documento',
              documento_id: documentoId,
            }),
          });

          const createData = await createResponse.json();
          if (createData.success) {
            setSala(createData.data);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar/criar sala:', error);
        setLoading(false);
      }
    }

    fetchOrCreateSala();
  }, [documentoId]);

  // Buscar mensagens existentes quando sala estiver disponível
  React.useEffect(() => {
    async function fetchMensagens() {
      if (!sala) return;

      try {
        const response = await fetch(`/api/chat/salas/${sala.id}/mensagens?modo=ultimas&limite=50`);
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
  }, [sala]);

  // Callback para persistir mensagens no banco
  const handleMessage = React.useCallback(
    async (messages: ChatMessage[]) => {
      if (!sala || messages.length === 0) return;

      // Pegar apenas a última mensagem (nova)
      const lastMessage = messages[messages.length - 1];

      // Verificar se é uma mensagem nova (não está nas iniciais e é do usuário atual)
      const isNew = !initialMessages.some((m) => m.id === lastMessage.id);
      const isOwn = lastMessage.user.name === currentUserName;

      if (isNew && isOwn) {
        try {
          await fetch(`/api/chat/salas/${sala.id}/mensagens`, {
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
    [sala, initialMessages, currentUserName]
  );

  if (loading || !sala) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2 ml-auto" />
          <Skeleton className="h-12 w-2/3" />
        </div>
      </div>
    );
  }

  // Nome único do room baseado no documento
  const roomName = `documento-${documentoId}-chat`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Chat do Documento
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Conversa em tempo real
        </p>
      </div>

      {/* Chat usando componente oficial do Supabase UI */}
      <div className="flex-1 min-h-0">
        <RealtimeChat
          roomName={roomName}
          username={currentUserName}
          messages={initialMessages}
          onMessage={handleMessage}
        />
      </div>
    </div>
  );
}
