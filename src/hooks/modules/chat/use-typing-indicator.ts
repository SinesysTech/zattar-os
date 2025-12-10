'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from ' @/lib/supabase/client';
import { RealtimeChannel } from ' @supabase/supabase-js';

interface TypingUser {
  userId: number;
  userName: string;
  timestamp: number;
}

const TYPING_TIMEOUT = 3000; // 3 segundos

export function useTypingIndicator(salaId: number, currentUserId: number, currentUserName: string) {
  const supabase = useRef(createClient()).current;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<number, TypingUser>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Broadcast typing state
  const broadcastTyping = useCallback(
    async (isTyping: boolean) => {
      const channel = channelRef.current;
      if (!channel) return;

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
    [currentUserId, currentUserName]
  );

  // Start typing
  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      broadcastTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        broadcastTyping(false);
      }
    }, TYPING_TIMEOUT);
  }, [broadcastTyping]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      broadcastTyping(false);
    }
  }, [broadcastTyping]);

  // Setup channel
  useEffect(() => {
    const channel = supabase.channel(`sala_${salaId}_typing`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { userId, userName, isTyping } = payload as {
          userId: number;
          userName: string;
          isTyping: boolean;
        };

        if (userId === currentUserId) return;

        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          if (isTyping) {
            newMap.set(userId, { userId, userName, timestamp: Date.now() });
          } else {
            newMap.delete(userId);
          }
          return newMap;
        });
      })
      .subscribe();

    // Cleanup expired typing indicators
    const cleanupInterval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const newMap = new Map(prev);
        let changed = false;

        for (const [userId, user] of newMap) {
          if (now - user.timestamp > TYPING_TIMEOUT) {
            newMap.delete(userId);
            changed = true;
          }
        }

        return changed ? newMap : prev;
      });
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
      channelRef.current = null;
    };
  }, [salaId, currentUserId, supabase]);

  const typingIndicatorText = Array.from(typingUsers.values())
    .map((u) => u.userName)
    .join(', ');

  return {
    typingUsers,
    typingIndicatorText: typingIndicatorText
      ? `${typingIndicatorText} está${typingUsers.size > 1 ? 'm' : ''} digitando...`
      : null,
    startTyping,
    stopTyping,
  };
}
