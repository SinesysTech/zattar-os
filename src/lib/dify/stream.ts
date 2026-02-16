import type { DifyStreamEvent, DifyStreamEventType } from './types';

/**
 * Parseia uma resposta SSE do Dify em um ReadableStream de eventos tipados.
 *
 * O Dify envia eventos no formato:
 * ```
 * event: message
 * data: {"answer": "Hello", ...}
 *
 * event: message_end
 * data: {"metadata": {...}}
 * ```
 */
export function parseDifySSEStream(
  response: Response
): ReadableStream<DifyStreamEvent> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is null');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream<DifyStreamEvent>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();

        if (done) {
          // Process any remaining buffer
          if (buffer.trim()) {
            const event = parseSSEBlock(buffer);
            if (event) controller.enqueue(event);
          }
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });

        // Split on double newlines (SSE event separator)
        const blocks = buffer.split('\n\n');
        // Keep the last incomplete block in the buffer
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const trimmed = block.trim();
          if (!trimmed) continue;

          const event = parseSSEBlock(trimmed);
          if (event) {
            if (event.event === 'error') {
              controller.enqueue(event);
              controller.close();
              reader.cancel();
              return;
            }
            controller.enqueue(event);
          }
        }
      } catch (error) {
        controller.error(error);
        reader.cancel();
      }
    },

    cancel() {
      reader.cancel();
    },
  });
}

/**
 * Parseia um bloco SSE individual em um DifyStreamEvent.
 */
function parseSSEBlock(block: string): DifyStreamEvent | null {
  let eventType: DifyStreamEventType = 'message';
  let data = '';

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim() as DifyStreamEventType;
    } else if (line.startsWith('data:')) {
      data += line.slice(5).trim();
    }
  }

  if (!data) {
    // Ping events may have no data
    if (eventType === 'ping') {
      return { event: 'ping' };
    }
    return null;
  }

  try {
    const parsed = JSON.parse(data);
    return { ...parsed, event: eventType };
  } catch {
    console.warn('[Dify] Falha ao parsear SSE data:', data);
    return null;
  }
}

/**
 * Converte um ReadableStream<DifyStreamEvent> em um ReadableStream<string>
 * no formato SSE para enviar ao cliente (proxy).
 */
export function difyStreamToSSE(
  stream: ReadableStream<DifyStreamEvent>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const reader = stream.getReader();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }

      const sseMessage = `event: ${value.event}\ndata: ${JSON.stringify(value)}\n\n`;
      controller.enqueue(encoder.encode(sseMessage));
    },

    cancel() {
      reader.cancel();
    },
  });
}

/**
 * Coleta todas as partes `answer` de um stream de chat e retorna o texto completo.
 * Útil para MCP tools que precisam do resultado final (não streaming).
 */
export async function collectStreamAnswer(
  stream: ReadableStream<DifyStreamEvent>
): Promise<{
  answer: string;
  conversationId: string | undefined;
  messageId: string | undefined;
  usage: DifyStreamEvent | undefined;
}> {
  const reader = stream.getReader();
  let answer = '';
  let conversationId: string | undefined;
  let messageId: string | undefined;
  let endEvent: DifyStreamEvent | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value.event === 'message' || value.event === 'agent_message') {
        const msg = value as { answer?: string; conversation_id?: string; message_id?: string };
        if (msg.answer) answer += msg.answer;
        if (msg.conversation_id) conversationId = msg.conversation_id;
        if (msg.message_id) messageId = msg.message_id;
      } else if (value.event === 'message_end') {
        endEvent = value;
        const end = value as { conversation_id?: string; message_id?: string };
        if (end.conversation_id) conversationId = end.conversation_id;
        if (end.message_id) messageId = end.message_id;
      } else if (value.event === 'error') {
        const err = value as { message?: string };
        throw new Error(err.message || 'Erro no stream Dify');
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { answer, conversationId, messageId, usage: endEvent };
}

/**
 * Coleta o resultado final de um workflow stream.
 */
export async function collectWorkflowStreamResult(
  stream: ReadableStream<DifyStreamEvent>
): Promise<{
  workflowRunId: string | undefined;
  status: string;
  outputs: Record<string, unknown>;
  totalTokens: number;
  elapsedTime: number;
  totalSteps: number;
  nodeResults: Array<{
    nodeId: string;
    title: string;
    status: string;
    outputs: Record<string, unknown>;
  }>;
}> {
  const reader = stream.getReader();
  let workflowRunId: string | undefined;
  let status = 'running';
  let outputs: Record<string, unknown> = {};
  let totalTokens = 0;
  let elapsedTime = 0;
  let totalSteps = 0;
  const nodeResults: Array<{
    nodeId: string;
    title: string;
    status: string;
    outputs: Record<string, unknown>;
  }> = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value.event === 'workflow_started') {
        const evt = value as { workflow_run_id?: string };
        workflowRunId = evt.workflow_run_id;
      } else if (value.event === 'node_finished') {
        const evt = value as {
          data?: {
            node_id?: string;
            title?: string;
            status?: string;
            outputs?: Record<string, unknown>;
          };
        };
        if (evt.data) {
          nodeResults.push({
            nodeId: evt.data.node_id || '',
            title: evt.data.title || '',
            status: evt.data.status || '',
            outputs: evt.data.outputs || {},
          });
        }
      } else if (value.event === 'workflow_finished') {
        const evt = value as {
          workflow_run_id?: string;
          data?: {
            status?: string;
            outputs?: Record<string, unknown>;
            total_tokens?: number;
            elapsed_time?: number;
            total_steps?: number;
          };
        };
        if (evt.workflow_run_id) workflowRunId = evt.workflow_run_id;
        if (evt.data) {
          status = evt.data.status || 'succeeded';
          outputs = evt.data.outputs || {};
          totalTokens = evt.data.total_tokens || 0;
          elapsedTime = evt.data.elapsed_time || 0;
          totalSteps = evt.data.total_steps || 0;
        }
      } else if (value.event === 'error') {
        const err = value as { message?: string };
        throw new Error(err.message || 'Erro no workflow stream Dify');
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { workflowRunId, status, outputs, totalTokens, elapsedTime, totalSteps, nodeResults };
}
