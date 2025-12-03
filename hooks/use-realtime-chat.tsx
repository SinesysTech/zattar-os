'use client'

import { createClient } from '@/lib/client'
import { v4 as uuidv4 } from 'uuid'
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
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>({})
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const messages = messagesByRoom[roomName] ?? []

  useEffect(() => {
    const newChannel = supabase.channel(roomName)
    channelRef.current = newChannel

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessagesByRoom((current) => {
          const currentMessages = current[roomName] ?? []
          return {
            ...current,
            [roomName]: [...currentMessages, payload.payload as ChatMessage],
          }
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
        id: uuidv4(),
        content,
        user: {
          id: userId,
          name: username,
        },
        createdAt: new Date().toISOString(),
      }

      // Update local state immediately for the sender
      setMessagesByRoom((current) => {
        const currentMessages = current[roomName] ?? []
        return {
          ...current,
          [roomName]: [...currentMessages, message],
        }
      })

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })
    },
    [isConnected, roomName, username, userId]
  )

  return { messages, sendMessage, isConnected }
}
