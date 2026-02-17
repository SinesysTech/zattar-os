'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  SendHorizontal,
  Square,
  RotateCcw,
  Bot,
} from 'lucide-react';
import { useDifyChat } from '../../hooks/use-dify-chat';
import { DifyMessage } from './dify-message';

interface DifyChatPanelProps {
  conversationId?: string;
  inputs?: Record<string, unknown>;
  placeholder?: string;
  className?: string;
}

export function DifyChatPanel({
  conversationId,
  inputs,
  placeholder = 'Digite sua mensagem...',
  className,
}: DifyChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    clearChat,
    sendFeedback,
  } = useDifyChat({ conversationId, inputs });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-medium">Assistente Dify</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={clearChat} title="Nova conversa">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Envie uma mensagem para começar a conversa
            </div>
          )}

          {messages.map((msg) => (
            <DifyMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              sources={msg.sources?.map(s => ({
                datasetName: s.dataset_name,
                documentName: s.document_name,
                content: s.content,
                score: s.score,
              }))}
              feedback={msg.feedback}
              isStreaming={isStreaming && msg.role === 'assistant' && msg === messages[messages.length - 1]}
              onFeedback={(rating) => sendFeedback(msg.id, rating)}
            />
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="flex gap-1">
                <span className="animate-bounce [animation-delay:0ms]">.</span>
                <span className="animate-bounce [animation-delay:150ms]">.</span>
                <span className="animate-bounce [animation-delay:300ms]">.</span>
              </div>
              Pensando...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 border-t">
          {error.message}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            disabled={isStreaming}
            className="flex-1"
          />
          {isStreaming ? (
            <Button type="button" variant="outline" size="icon" onClick={stopGeneration}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!inputValue.trim()}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
