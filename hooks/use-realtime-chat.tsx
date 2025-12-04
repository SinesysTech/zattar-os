'use client'

import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UseRealtimeChatProps {
  roomName: string
  username: string
  userId?: number
}

export interface ChatMessage {
  id: string
  content: string
  user: {
    id?: number
    name: string
  }
  createdAt: string
}

const EVENT_MESSAGE_TYPE = 'message'

export function useRealtimeChat({ roomName, username, userId }: UseRealtimeChatProps) {
  const supabase = useMemo(() => createClient(), [])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const currentRoomRef = useRef<string>(roomName)

  useEffect(() => {
    // Limpar mensagens ao trocar de sala
    if (currentRoomRef.current !== roomName) {
      setMessages([])
      currentRoomRef.current = roomName
    }

    const newChannel = supabase.channel(roomName)
    channelRef.current = newChannel

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        const incomingMessage = payload.payload as ChatMessage

        setMessages((current) => {
          // Evitar duplicatas
          if (current.some((m) => m.id === incomingMessage.id)) {
            return current
          }
          return [...current, incomingMessage]
        })
      })
      .subscribe(async (status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(newChannel)
      channelRef.current = null
      setIsConnected(false)
    }
  }, [roomName, supabase])

  const sendMessage = useCallback(
    async (content: string) => {
      const channel = channelRef.current
      if (!channel || !isConnected) return

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        user: {
          id: userId,
          name: username,
        },
        createdAt: new Date().toISOString(),
      }

      // Update local state immediately for the sender
      setMessages((current) => [...current, message])

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })
    },
    [isConnected, username, userId]
  )

  return { messages, sendMessage, isConnected }
}
