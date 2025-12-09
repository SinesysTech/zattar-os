'use client'

import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat-message'
import { ChatMessageWithFiles } from '@/components/chat/chat-message-with-files'
import { ChatFileUpload } from '@/components/chat/chat-file-upload'
import { AudioRecordButton } from '@/components/chat/audio-record-button'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import {
  type ChatMessage,
  useRealtimeChat,
} from '@/hooks/use-realtime-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Paperclip, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface FileAttachment {
  name: string
  url: string
  type: string
  size?: number
  [key: string]: unknown
}

interface RealtimeChatProps {
  roomName: string
  username: string
  userId?: number
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
  tipo?: 'privado' | 'grupo' | 'geral' | 'documento'
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param userId - The unique ID of the user (used for proper message attribution)
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  userId,
  onMessage,
  messages: initialMessages = [],
  tipo = 'geral',
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
    typingIndicatorText,
    startTyping,
  } = useRealtimeChat({
    roomName,
    username,
    userId,
  })
  const [newMessage, setNewMessage] = useState('')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([])
  const [audioFiles, setAudioFiles] = useState<FileAttachment[]>([])

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages]
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    )
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    return sortedMessages
  }, [initialMessages, realtimeMessages])

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages)
    }
  }, [allMessages, onMessage])

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if ((!newMessage.trim() && attachedFiles.length === 0) || !isConnected) return

      // Construir conteúdo da mensagem com arquivos anexos
      let messageContent = newMessage.trim()

      // Separar arquivos de áudio de outros anexos
      const allAttachments = [...attachedFiles, ...audioFiles]

      if (allAttachments.length > 0) {
        const filesJson = JSON.stringify(allAttachments)
        messageContent += `\n[FILES_START]${filesJson}[FILES_END]`
      }

      sendMessage(messageContent)
      setNewMessage('')
      setAttachedFiles([])
      setAudioFiles([])
      setShowFileUpload(false)
    },
    [newMessage, attachedFiles, audioFiles, isConnected, sendMessage]
  )

  // Handler para input com indicação de typing
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value)
      if (e.target.value.length > 0) {
        startTyping()
      }
    },
    [startTyping]
  )

  // Handler para quando arquivos são carregados
  const handleFileUploaded = useCallback((fileInfo: FileAttachment) => {
    setAttachedFiles(prev => [...prev, fileInfo])
  }, [])

  // Handler para quando áudio é gravado (botão separado)
  const handleAudioRecorded = useCallback((audioInfo: FileAttachment) => {
    // Adicionar arquivo de áudio à lista separada
    setAudioFiles(prev => [...prev, audioInfo])
  }, [])

  // Handler para quando áudio está pronto para envio (aparece no input)
  const handleAudioReady = useCallback((audioFile: FileAttachment) => {
    // O áudio já foi processado e adicionado pelo handleAudioRecorded
    // Aqui podemos adicionar lógica adicional se necessário
    console.log('Áudio pronto para envio:', audioFile)
  }, [])

  // Handler para remover arquivo anexado
  const handleRemoveAttachedFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Handler para remover arquivo de áudio
  const handleRemoveAudioFile = useCallback((index: number) => {
    setAudioFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Verificar se mensagem contém arquivos
  const hasFiles = (content: string) => {
    return content.includes('[FILES_START]') && content.includes('[FILES_END]')
  }

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : null}
        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null
            const showHeader = !prevMessage || prevMessage.user.name !== message.user.name
            const isOwnMessage = userId ? message.user.id === userId : message.user.name === username

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                {hasFiles(message.content) ? (
                  <ChatMessageWithFiles
                    message={message}
                    isOwnMessage={isOwnMessage}
                    showHeader={showHeader}
                    tipo={tipo}
                    previousMessage={prevMessage}
                  />
                ) : (
                  <ChatMessageItem
                    message={message}
                    isOwnMessage={isOwnMessage}
                    showHeader={showHeader}
                    tipo={tipo}
                    previousMessage={prevMessage}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Indicador de digitação */}
      {typingIndicatorText && (
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex gap-0.5">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
            </span>
            <span>{typingIndicatorText}</span>
          </div>
        </div>
      )}

      {/* Upload de arquivos */}
      {showFileUpload && (
        <div className="border-t border-border p-4 bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Anexar arquivos</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFileUpload(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ChatFileUpload
            onFileUploaded={handleFileUploaded}
            className="mb-3"
          />

          {/* Lista de arquivos anexados */}
          {attachedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Arquivos anexados:</p>
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border">
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachedFile(index)}
                    className="h-5 w-5 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex w-full gap-2 border-t border-border p-3 sm:p-4">
        <div className="flex flex-1 gap-1.5 sm:gap-2">
          <Input
            className={cn(
              'rounded-full bg-background text-sm transition-all duration-300 flex-1 min-h-[44px]',
              isConnected && (newMessage.trim() || attachedFiles.length > 0 || audioFiles.length > 0) ? '' : ''
            )}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Digite uma mensagem..."
            disabled={!isConnected}
          />

          {/* Botão de anexar arquivo */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={cn(
              'aspect-square rounded-full transition-all duration-300 min-h-[44px] min-w-[44px]',
              showFileUpload ? 'bg-primary text-primary-foreground' : ''
            )}
            disabled={!isConnected}
          >
            <Paperclip className="size-4" />
          </Button>

          {/* Botão de gravação de áudio */}
          <AudioRecordButton
            onAudioRecorded={handleAudioRecorded}
            onAudioReady={handleAudioReady}
            disabled={!isConnected}
            className="aspect-square rounded-full px-3 min-h-[44px] min-w-[44px]"
          />
        </div>

        {isConnected && (newMessage.trim() || attachedFiles.length > 0 || audioFiles.length > 0) && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300 min-h-[44px] min-w-[44px]"
            type="submit"
            disabled={!isConnected}
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>

      {/* Lista de arquivos de áudio gravados */}
      {audioFiles.length > 0 && (
        <div className="border-t border-border p-4 bg-muted/20">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Áudios gravados:</p>
            {audioFiles.map((audio, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border">
                <span className="text-sm truncate flex-1">
                  {audio.name} ({Math.round(audio.duration)}s)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAudioFile(index)}
                  className="h-5 w-5 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
