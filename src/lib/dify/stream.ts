import { DifyStreamEvent, DifyStreamEventType } from './types';

/**
 * Faz parse de um stream de Server-Sent Events (SSE) do Dify.
 * Transforma um ReadableStream<Uint8Array> em um AsyncGenerator<DifyStreamEvent>.
 */
export async function* parseDifyStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<DifyStreamEvent, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Mantém a última linha incompleta no buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

        const dataStr = trimmedLine.slice(5).trim();
        if (!dataStr) continue;

        try {
          const data = JSON.parse(dataStr);
          yield data as DifyStreamEvent;
        } catch (e) {
          console.error('Erro ao fazer parse do evento SSE:', e, dataStr);
        }
      }
    }

    // Processa o restante do buffer se houver
    if (buffer.trim()) {
      const trimmedLine = buffer.trim();
      if (trimmedLine.startsWith('data:')) {
        const dataStr = trimmedLine.slice(5).trim();
        try {
          const data = JSON.parse(dataStr);
          yield data as DifyStreamEvent;
        } catch (e) {
          console.error('Erro ao fazer parse do evento SSE final:', e, dataStr);
        }
      }
    }

  } finally {
    reader.releaseLock();
  }
}
