import { useState, useCallback, useRef } from 'react';
// import { fetchEventSource } from '@microsoft/fetch-event-source'; // Removed
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  feedback?: 'like' | 'dislike' | null;
}

interface UseDifyChatOptions {
  conversationId?: string;
  initialMessages?: Message[];
  user?: string;
  onFinish?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export function useDifyChat({
  conversationId: initialConversationId,
  initialMessages = [],
  user = 'user',
  onFinish,
  onError,
}: UseDifyChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, inputs: Record<string, any> = {}) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = uuidv4();
    // Placeholder message for assistant
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      let fullResponse = '';

      const response = await fetch('/api/dify/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: content,
          inputs,
          conversation_id: conversationId,
          user,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.statusText}`);
      }

      if (!response.body) throw new Error('Response body is null');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);

              // Tratamento de eventos específicos do Dify
              if (data.event === 'message' || data.event === 'agent_message') {
                const delta = data.answer || '';
                fullResponse += delta;

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: fullResponse }
                      : m
                  )
                );

                if (data.conversation_id && !conversationId) {
                  setConversationId(data.conversation_id);
                }
              } else if (data.event === 'message_end' || data.event === 'workflow_finished') {
                if (onFinish) {
                  const finishedMsg = {
                    id: assistantMessageId,
                    role: 'assistant' as const,
                    content: fullResponse,
                    createdAt: Date.now()
                  };
                  onFinish(finishedMsg);
                }
              } else if (data.event === 'error') {
                throw new Error(data.message || 'Erro desconhecido do Dify');
              }
            } catch (e) {
              console.error('Erro ao parsing SSE JSON:', e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        if (onError) onError(error);
      }
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, user, onFinish, onError]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    stop,
    conversationId,
  };
}
