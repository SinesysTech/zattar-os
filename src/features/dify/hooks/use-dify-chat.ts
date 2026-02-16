'use client';

import { useState, useCallback, useRef } from 'react';

interface DifyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  feedback?: 'like' | 'dislike' | null;
  sources?: Array<{
    datasetName: string;
    documentName: string;
    content: string;
    score: number;
  }>;
}

interface UseDifyChatOptions {
  conversationId?: string;
  inputs?: Record<string, unknown>;
}

interface UseDifyChatReturn {
  messages: DifyMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  conversationId: string | null;
  error: string | null;
  sendMessage: (query: string) => Promise<void>;
  stopGeneration: () => void;
  clearChat: () => void;
  sendFeedback: (messageId: string, rating: 'like' | 'dislike') => Promise<void>;
}

/**
 * Hook para chat com Dify via streaming SSE.
 * Conecta ao endpoint /api/dify/chat.
 */
export function useDifyChat(options: UseDifyChatOptions = {}): UseDifyChatReturn {
  const [messages, setMessages] = useState<DifyMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    options.conversationId || null
  );
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim() || isStreaming) return;

      setError(null);
      setIsLoading(true);
      setIsStreaming(true);

      // Add user message
      const userMessage: DifyMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        createdAt: Date.now() / 1000,
      };

      // Add placeholder for assistant
      const assistantMessage: DifyMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        createdAt: Date.now() / 1000,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch('/api/dify/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            conversationId,
            inputs: options.inputs,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Stream não disponível');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';

          for (const block of blocks) {
            const trimmed = block.trim();
            if (!trimmed) continue;

            let eventType = '';
            let data = '';

            for (const line of trimmed.split('\n')) {
              if (line.startsWith('event:')) eventType = line.slice(6).trim();
              if (line.startsWith('data:')) data += line.slice(5).trim();
            }

            if (!data) continue;

            try {
              const parsed = JSON.parse(data);

              if (eventType === 'message' || eventType === 'agent_message') {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: updated[lastIdx].content + (parsed.answer || ''),
                    };
                    if (parsed.conversation_id) {
                      setConversationId(parsed.conversation_id);
                    }
                  }
                  return updated;
                });
                setIsLoading(false);
              } else if (eventType === 'message_end') {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      id: parsed.message_id || updated[lastIdx].id,
                      sources: parsed.metadata?.retriever_resources?.map(
                        (r: { dataset_name: string; document_name: string; content: string; score: number }) => ({
                          datasetName: r.dataset_name,
                          documentName: r.document_name,
                          content: r.content,
                          score: r.score,
                        })
                      ),
                    };
                  }
                  return updated;
                });

                if (parsed.conversation_id) {
                  setConversationId(parsed.conversation_id);
                }
              } else if (eventType === 'error') {
                setError(parsed.message || 'Erro no stream');
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
          setError(errorMessage);

          // Remove placeholder assistant message on error
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant' && !updated[lastIdx].content) {
              updated.pop();
            }
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [conversationId, isStreaming, options.inputs]
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setIsLoading(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  const sendFeedback = useCallback(
    async (messageId: string, rating: 'like' | 'dislike') => {
      try {
        const response = await fetch('/api/dify/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'feedback',
            messageId,
            rating,
          }),
        });

        if (response.ok) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, feedback: rating } : msg
            )
          );
        }
      } catch {
        // Feedback is non-critical
      }
    },
    []
  );

  return {
    messages,
    isStreaming,
    isLoading,
    conversationId,
    error,
    sendMessage,
    stopGeneration,
    clearChat,
    sendFeedback,
  };
}
