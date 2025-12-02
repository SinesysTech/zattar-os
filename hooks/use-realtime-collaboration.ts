/**
 * Hook customizado para colaboração em tempo real
 * Gerencia presence tracking, broadcast de eventos do editor e sync de conteúdo
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/app/_lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface CollaboratorPresence {
  user_id: number;
  name: string;
  email: string;
  color: string;
  cursor?: {
    path: number[];
    offset: number;
  };
  selection?: {
    anchor: { path: number[]; offset: number };
    focus: { path: number[]; offset: number };
  };
  last_active: string;
}

export interface RemoteCursor {
  userId: number;
  userName: string;
  color: string;
  selection: {
    anchor: { path: number[]; offset: number };
    focus: { path: number[]; offset: number };
  } | null;
}

interface ContentUpdate {
  type: 'content_update';
  userId: number;
  content: any;
  timestamp: number;
}

interface UseRealtimeCollaborationProps {
  documentoId: number;
  userId: number;
  userName: string;
  userEmail: string;
  onPresenceChange?: (users: CollaboratorPresence[]) => void;
  onRemoteUpdate?: (update: ContentUpdate) => void;
  onRemoteCursors?: (cursors: RemoteCursor[]) => void;
}

export function useRealtimeCollaboration({
  documentoId,
  userId,
  userName,
  userEmail,
  onRemoteUpdate,
  onRemoteCursors,
}: UseRealtimeCollaborationProps) {
  const supabase = createClient();
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  const onRemoteCursorsRef = useRef(onRemoteCursors);

  // Atualizar refs quando callbacks mudam
  useEffect(() => {
    onRemoteUpdateRef.current = onRemoteUpdate;
    onRemoteCursorsRef.current = onRemoteCursors;
  }, [onRemoteUpdate, onRemoteCursors]);

  // Gerar cor única para o usuário
  const userColor = useCallback(() => {
    const colors = [
      '#ef4444', // red
      '#f59e0b', // amber
      '#10b981', // emerald
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899', // pink
    ];
    return colors[userId % colors.length];
  }, [userId]);

  // Inicializar presence tracking e broadcast
  useEffect(() => {
    if (!userId || userId === 0) return;

    const channel = supabase.channel(`documento:${documentoId}`, {
      config: {
        presence: {
          key: userId.toString(),
        },
      },
    });

    // Subscribe a mudanças de presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users: CollaboratorPresence[] = [];
        const cursors: RemoteCursor[] = [];

        Object.keys(presenceState).forEach((key) => {
          const presences = presenceState[key] as any[];
          presences.forEach((presence) => {
            if (presence.user_id !== userId) {
              users.push(presence);

              // Extrair cursor para overlay
              if (presence.selection) {
                cursors.push({
                  userId: presence.user_id,
                  userName: presence.name,
                  color: presence.color,
                  selection: presence.selection,
                });
              }
            }
          });
        });

        setCollaborators(users);
        setRemoteCursors(cursors);

        // Notificar sobre mudanças de cursors
        if (onRemoteCursorsRef.current) {
          onRemoteCursorsRef.current(cursors);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Collaboration] User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Collaboration] User left:', key, leftPresences);
      })
      // Escutar broadcasts de atualização de conteúdo
      .on('broadcast', { event: 'content_update' }, ({ payload }) => {
        if (payload && payload.userId !== userId) {
          console.log('[Collaboration] Remote content update received');
          if (onRemoteUpdateRef.current) {
            onRemoteUpdateRef.current(payload as ContentUpdate);
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Enviar presence inicial
          await channel.track({
            user_id: userId,
            name: userName,
            email: userEmail,
            color: userColor(),
            last_active: new Date().toISOString(),
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [documentoId, userId, userName, userEmail, userColor, supabase]);

  // Atualizar cursor position
  const updateCursor = useCallback(
    async (cursor: { path: number[]; offset: number } | null) => {
      if (channelRef.current) {
        await channelRef.current.track({
          user_id: userId,
          name: userName,
          email: userEmail,
          color: userColor(),
          cursor,
          last_active: new Date().toISOString(),
        });
      }
    },
    [userId, userName, userEmail, userColor]
  );

  // Atualizar selection
  const updateSelection = useCallback(
    async (selection: {
      anchor: { path: number[]; offset: number };
      focus: { path: number[]; offset: number };
    } | null) => {
      if (channelRef.current) {
        await channelRef.current.track({
          user_id: userId,
          name: userName,
          email: userEmail,
          color: userColor(),
          selection,
          last_active: new Date().toISOString(),
        });
      }
    },
    [userId, userName, userEmail, userColor]
  );

  // Broadcast de mudança de conteúdo
  const broadcastUpdate = useCallback(
    async (update: any) => {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'content_update',
          payload: update,
        });
      }
    },
    []
  );

  return {
    collaborators,
    remoteCursors,
    isConnected,
    updateCursor,
    updateSelection,
    broadcastUpdate,
  };
}
