'use client';

/**
 * Componente de chat do documento usando Supabase Realtime Broadcast
 * Baseado no componente oficial do Supabase UI Library
 * @see https://supabase.com/ui/docs/nextjs/realtime-chat
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Heading } from '@/components/ui/typography';
import { RealtimeChat } from '@/components/realtime/realtime-chat';


interface DocumentChatProps {
  documentoId: number;
  currentUserName: string;
  currentUserId?: number;
}

interface SalaChat {
  id: number;
  nome: string;
  documento_id: number | null;
}

/**
 * Converte mensagens do banco para o formato do Supabase UI
 */

export function DocumentChat({ documentoId, currentUserName, currentUserId }: DocumentChatProps) {
  const [sala, setSala] = React.useState<SalaChat | null>(null);
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

  if (loading || !sala) {
    return (
      <div className="flex flex-col h-full">
        <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "border-b p-4")}>
          <Skeleton className="h-5 w-32" />
        </div>
        <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; space-y-4 → migrar para <Stack gap="default"> */ "flex-1 p-4 space-y-4")}>
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
      <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "border-b p-4")}>
        <Heading level="card" className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
          <MessageSquare className="h-4 w-4" />
          Chat do Documento
        </Heading>
        <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground mt-1")}>
          Conversa em tempo real
        </p>
      </div>

      {/* Chat usando componente oficial do Supabase UI */}
      <div className="flex-1 min-h-0">
        <RealtimeChat
          roomName={roomName}
          username={currentUserName}
          userId={currentUserId}
        />
      </div>
    </div>
  );
}
