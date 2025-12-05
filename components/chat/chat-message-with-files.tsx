'use client';

import * as React from 'react';
import { MessageSquare, Download, Eye, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChatMessageItem } from '@/components/chat-message';
import type { ChatMessage } from '@/hooks/use-realtime-chat';
import { 
  formatChatTimestamp, 
  shouldShowMessageHeader, 
  shouldGroupWithPrevious,
  parseMessageContent 
} from '@/lib/utils/chat-utils';

interface FileAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
  category: 'image' | 'video' | 'audio' | 'document';
}

interface ChatMessageWithFilesProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
  tipo?: 'privado' | 'grupo' | 'geral' | 'documento';
  previousMessage?: ChatMessage | null;
}

export function ChatMessageWithFiles({
  message,
  isOwnMessage,
  showHeader,
  tipo = 'geral',
  previousMessage,
}: ChatMessageWithFilesProps) {
  const [playingAudio, setPlayingAudio] = React.useState<string | null>(null);

  // Parse do conteúdo da mensagem para extrair arquivos e texto
  const { textContent, attachments } = parseMessageContent(message.content);

  // Determinar se deve mostrar o nome do usuário
  const shouldShowHeader = showHeader && shouldShowMessageHeader(tipo);
  
  // Determinar se deve agrupar com a mensagem anterior
  const shouldGroup = shouldGroupWithPrevious(message, previousMessage, tipo);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      default:
        return '📎';
    }
  };

  const handleAudioPlay = (fileUrl: string) => {
    if (playingAudio === fileUrl) {
      // Pausar áudio
      const audio = document.querySelector(`audio[data-url="${fileUrl}"]`) as HTMLAudioElement;
      if (audio) {
        audio.pause();
        setPlayingAudio(null);
      }
    } else {
      // Tocar novo áudio e pausar outros
      const allAudios = document.querySelectorAll('audio');
      allAudios.forEach(audio => {
        if (audio.dataset.url !== fileUrl) {
          audio.pause();
        }
      });
      
      setPlayingAudio(fileUrl);
    }
  };

  const renderAudioPlayer = (file: FileAttachment) => {
    return (
      <div className="mt-2 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-lg">{getFileIcon(file.category)}</span>
          <div className="flex-1">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAudioPlay(file.url)}
            className="h-8 w-8 p-0"
          >
            {playingAudio === file.url ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <audio
          data-url={file.url}
          src={file.url}
          onEnded={() => setPlayingAudio(null)}
          onError={() => setPlayingAudio(null)}
          controls
          className="mt-2 w-full h-8"
          style={{ height: '32px' }}
        />
      </div>
    );
  };

  const renderImagePreview = (file: FileAttachment) => {
    return (
      <div className="mt-2">
        <div className="relative group">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-sm max-h-64 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(file.url, '_blank')}
          />
          <div className="absolute top-2 right-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(file.url, '_blank')}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{formatFileSize(file.size)}</p>
      </div>
    );
  };

  const renderVideoPlayer = (file: FileAttachment) => {
    return (
      <div className="mt-2">
        <video
          src={file.url}
          controls
          className="max-w-sm max-h-64 rounded-lg border"
        >
          Seu navegador não suporta o elemento de vídeo.
        </video>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
      </div>
    );
  };

  const renderDocumentLink = (file: FileAttachment) => {
    return (
      <div className="mt-2 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-lg">{getFileIcon(file.category)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(file.url, '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
        </div>
      </div>
    );
  };

  const renderFileAttachments = () => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="space-y-2">
        {attachments.map((file: FileAttachment, index: number) => {
          switch (file.category) {
            case 'image':
              return (
                <div key={index}>
                  {renderImagePreview(file)}
                </div>
              );
            case 'video':
              return (
                <div key={index}>
                  {renderVideoPlayer(file)}
                </div>
              );
            case 'audio':
              return (
                <div key={index}>
                  {renderAudioPlayer(file)}
                </div>
              );
            case 'document':
            default:
              return (
                <div key={index}>
                  {renderDocumentLink(file)}
                </div>
              );
          }
        })}
      </div>
    );
  };

  // Se há apenas arquivos e nenhum texto, renderizar como card de arquivo
  if (!textContent && attachments && attachments.length > 0) {
    const firstFile = attachments[0];
    return (
      <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className={cn('max-w-[75%] w-fit', {
          'items-end': isOwnMessage,
        })}>
          {shouldShowHeader && (
            <div className="flex items-center gap-2 text-xs px-3 pb-1">
              <span className="font-medium">{message.user.name}</span>
              <span className="text-foreground/50">
                {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
          
          <div className={cn(
            'py-2 px-3 rounded-xl text-sm',
            isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          )}>
            {firstFile.category === 'image' && renderImagePreview(firstFile)}
            {firstFile.category === 'video' && renderVideoPlayer(firstFile)}
            {firstFile.category === 'audio' && renderAudioPlayer(firstFile)}
            {(firstFile.category === 'document' || !['image', 'video', 'audio'].includes(firstFile.category)) && renderDocumentLink(firstFile)}
          </div>
        </div>
      </div>
    );
  }

  // Renderizar mensagem normal com anexos
  return (
    <>
      <ChatMessageItem
        message={{
          ...message,
          content: textContent,
        }}
        isOwnMessage={isOwnMessage}
        showHeader={shouldShowHeader}
      />
      {renderFileAttachments()}
    </>
  );
}