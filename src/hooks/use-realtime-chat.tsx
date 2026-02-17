/**
 * @deprecated Este hook está DEPRECIADO e será removido na próxima versão.
 * 
 * **Plano de Migração**: Consulte /MIGRACAO_CHAT.md para detalhes completos.
 * 
 * **Migrar para**: `src/core/chat` + Server Actions (`src/app/actions/chat.ts`)
 * 
 * **Motivo da Depreciação**:
 * - Arquitetura legada sem separação de camadas
 * - Mistura de lógica de UI e dados
 * - Falta de type safety com Result pattern
 * - Código duplicado com nova arquitetura
 * 
 * **Consumidores Atuais** (apenas tipo `ChatMessage`):
 * - `src/components/chat/chat-interface.tsx`
 * - `src/components/chat/chat-message-with-files.tsx`
 * - `src/components/chat-message.tsx`
 * - `src/components/documentos/document-chat.tsx`
 * 
 * **Ações Necessárias**:
 * 1. Mover tipo `ChatMessage` para `src/core/chat/domain.ts`
 * 2. Atualizar todos os imports para usar tipos do core
 * 3. Remover este arquivo após conclusão da migração
 * 
 * **Não adicione novas dependências neste arquivo**.
 */

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

export interface TypingUser {
  id?: number
  name: string
  timestamp: number
}

const EVENT_MESSAGE_TYPE = 'message'
const EVENT_TYPING_TYPE = 'typing'
const TYPING_TIMEOUT = 3000 // 3 segundos

export function useRealtimeChat({ roomName, username, userId }: UseRealtimeChatProps) {
  const supabase = useMemo(() => createClient(), [])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const currentRoomRef = useRef<string>(roomName)

  // Estado de typing
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map())
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  useEffect(() => {
    // Limpar mensagens ao trocar de sala
    if (currentRoomRef.current !== roomName) {
      setMessages([])
      setTypingUsers(new Map())
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
      // Escutar eventos de typing
      .on('broadcast', { event: EVENT_TYPING_TYPE }, (payload) => {
        const { userId: typingUserId, userName, isTyping } = payload.payload as {
          userId?: number
          userName: string
          isTyping: boolean
        }

        // Ignorar próprios eventos
        const userKey = typingUserId?.toString() || userName
        const currentUserKey = userId?.toString() || username
        if (userKey === currentUserKey) return

        setTypingUsers((prev) => {
          const newMap = new Map(prev)

          if (isTyping) {
            newMap.set(userKey, {
              id: typingUserId,
              name: userName,
              timestamp: Date.now(),
            })
          } else {
            newMap.delete(userKey)
          }

          return newMap
        })
      })
      .subscribe(async (status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Limpar usuários que pararam de digitar (timeout)
    const cleanupInterval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now()
        const newMap = new Map(prev)
        let changed = false

        for (const [key, user] of newMap) {
          if (now - user.timestamp > TYPING_TIMEOUT) {
            newMap.delete(key)
            changed = true
          }
        }

        return changed ? newMap : prev
      })
    }, 1000)

    return () => {
      supabase.removeChannel(newChannel)
      channelRef.current = null
      setIsConnected(false)
      clearInterval(cleanupInterval)
    }
  }, [roomName, supabase, userId, username])

  // Função para broadcast do estado de typing
  const broadcastTyping = useCallback(
    async (isTyping: boolean) => {
      const channel = channelRef.current
      if (!channel || !isConnected) return

      await channel.send({
        type: 'broadcast',
        event: EVENT_TYPING_TYPE,
        payload: {
          userId,
          userName: username,
          isTyping,
        },
      })
    },
    [isConnected, userId, username]
  )

  // Handler para indicar que o usuário está digitando
  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      broadcastTyping(true)
    }

    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Parar de indicar typing após timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false
        broadcastTyping(false)
      }
    }, TYPING_TIMEOUT)
  }, [broadcastTyping])

  // Handler para parar de indicar typing
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (isTypingRef.current) {
      isTypingRef.current = false
      broadcastTyping(false)
    }
  }, [broadcastTyping])

  const sendMessage = useCallback(
    async (content: string) => {
      const channel = channelRef.current
      if (!channel || !isConnected) return

      // Parar de indicar typing ao enviar
      stopTyping()

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
    [isConnected, username, userId, stopTyping]
  )

  // Formatar texto do indicador de typing
  const typingIndicatorText = useMemo(() => {
    const users = Array.from(typingUsers.values())

    if (users.length === 0) return null
    if (users.length === 1) return `${users[0].name} está digitando...`
    if (users.length === 2) return `${users[0].name} e ${users[1].name} estão digitando...`

    return `${users.length} pessoas estão digitando...`
  }, [typingUsers])

  return {
    messages,
    sendMessage,
    isConnected,
    // Typing indicator
    typingUsers,
    typingIndicatorText,
    startTyping,
    stopTyping,
  }
}
