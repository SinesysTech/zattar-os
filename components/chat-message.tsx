import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-realtime-chat'
import { 
  formatChatTimestamp, 
  shouldShowMessageHeader, 
  shouldGroupWithPrevious,
  parseMessageContent 
} from '@/lib/utils/chat-utils'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
  tipo?: 'privado' | 'grupo' | 'geral' | 'documento'
  previousMessage?: ChatMessage | null
}

export const ChatMessageItem = ({ 
  message, 
  isOwnMessage, 
  showHeader, 
  tipo = 'geral',
  previousMessage 
}: ChatMessageItemProps) => {
  // Determinar se deve mostrar o header baseado no tipo de chat
  const shouldShowHeader = showHeader && shouldShowMessageHeader(tipo);
  
  // Determinar se deve agrupar com a mensagem anterior
  const shouldGroup = shouldGroupWithPrevious(message, previousMessage, tipo);
  
  // Se deve agrupar e não mostrar header, retornar apenas a bolha de mensagem
  if (shouldGroup && !shouldShowHeader) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div
          className={cn(
            'max-w-[75%] w-fit',
            isOwnMessage ? 'items-end' : 'items-start'
          )}
        >
          <div
            className={cn(
              'py-2 px-3 rounded-xl text-sm',
              isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            )}
          >
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // Parse do conteúdo para remover anexos do texto visível
  const { textContent } = parseMessageContent(message.content);

  return (
    <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={cn('max-w-[75%] w-fit flex flex-col gap-1', {
          'items-end': isOwnMessage,
        })}
      >
        {/* Header: nome + horário (apenas se não for conversa privada ou se deve mostrar) */}
        {shouldShowHeader && (
          <div
            className={cn('text-xs px-3 pb-1', {
              'text-right': isOwnMessage,
              'text-left': !isOwnMessage,
            })}
          >
            <span className="font-medium">
              {formatChatTimestamp(message.createdAt, tipo, message.user.name)}
            </span>
          </div>
        )}
        
        {/* Mensagem */}
        <div
          className={cn(
            'py-2 px-3 rounded-xl text-sm w-fit',
            isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          )}
        >
          {textContent}
        </div>
        
        {/* Timestamp para conversas privadas (abaixo da mensagem) */}
        {!shouldShowHeader && (
          <div
            className={cn('text-xs text-muted-foreground px-3 pt-1', {
              'text-right': isOwnMessage,
              'text-left': !isOwnMessage,
            })}
          >
            {formatChatTimestamp(message.createdAt, tipo)}
          </div>
        )}
      </div>
    </div>
  );
}
