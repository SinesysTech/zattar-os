/**
 * SupabaseAgentRunner
 *
 * Persiste threads/runs do CopilotKit no Supabase (PostgreSQL).
 * Segue o mesmo padrão do InMemoryAgentRunner, mas salva historicRuns
 * na tabela `copilotkit_runs` em vez de manter tudo em memória.
 *
 * Fluxo:
 * - run(): Executa o agent, coleta eventos, e ao finalizar INSERT no Supabase
 * - connect(): SELECT runs do Supabase e replay dos eventos compactados
 * - isRunning/stop(): Tracking in-memory (mesmo processo, não precisa DB)
 */

import { AgentRunner } from '@copilotkitnext/runtime';
import type {
  AgentRunnerRunRequest,
  AgentRunnerConnectRequest,
  AgentRunnerIsRunningRequest,
  AgentRunnerStopRequest,
} from '@copilotkitnext/runtime';
import { ReplaySubject, type Observable } from 'rxjs';
import { createServiceClient } from '@/lib/supabase/service-client';

// Importar de @ag-ui/client — usar `any` para BaseEvent/AbstractAgent
// para evitar conflitos entre versões duplicadas no node_modules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseEvent = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AbstractAgent = any;

// Dynamic imports para compactEvents e finalizeRunEvents (evita conflitos de tipo)
async function getAgUiUtils() {
  const { EventType, compactEvents } = await import('@ag-ui/client');
  const { finalizeRunEvents } = await import('@copilotkitnext/shared');
  return { EventType, compactEvents, finalizeRunEvents };
}

// ─── Tipos ──────────────────────────────────────────────────────────

interface HistoricRun {
  threadId: string;
  runId: string;
  parentRunId: string | null;
  events: BaseEvent[];
  createdAt: number;
}

interface ActiveThread {
  agent: AbstractAgent;
  subject: ReplaySubject<BaseEvent>;
  runSubject: ReplaySubject<BaseEvent>;
  currentEvents: BaseEvent[];
  currentRunId: string;
  isRunning: boolean;
  stopRequested: boolean;
}

// ─── Runner ─────────────────────────────────────────────────────────

export class SupabaseAgentRunner extends AgentRunner {
  private activeThreads = new Map<string, ActiveThread>();
  private TABLE = 'copilotkit_runs';
  private utils: Awaited<ReturnType<typeof getAgUiUtils>> | null = null;

  private async getUtils() {
    if (!this.utils) this.utils = await getAgUiUtils();
    return this.utils;
  }

  // ── Carregar runs do Supabase ──

  private async loadHistoricRuns(threadId: string): Promise<HistoricRun[]> {
    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('thread_id, run_id, parent_run_id, events, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[SupabaseAgentRunner] Error loading runs:', error.message);
        return [];
      }

      return (data || []).map((row) => ({
        threadId: row.thread_id as string,
        runId: row.run_id as string,
        parentRunId: row.parent_run_id as string | null,
        events: row.events as BaseEvent[],
        createdAt: row.created_at as number,
      }));
    } catch (err) {
      console.error('[SupabaseAgentRunner] Failed to load historic runs:', err);
      return [];
    }
  }

  // ── Salvar run no Supabase ──

  private async saveRun(run: HistoricRun): Promise<void> {
    try {
      const supabase = createServiceClient();
      const { error } = await supabase.from(this.TABLE).upsert(
        {
          thread_id: run.threadId,
          run_id: run.runId,
          parent_run_id: run.parentRunId,
          events: run.events as unknown as Record<string, unknown>[],
          created_at: run.createdAt,
        },
        { onConflict: 'thread_id,run_id' }
      );

      if (error) {
        console.error('[SupabaseAgentRunner] Error saving run:', error.message);
      }
    } catch (err) {
      console.error('[SupabaseAgentRunner] Failed to save run:', err);
    }
  }

  // ── run() — Executa agent e persiste no Supabase ──

  run(request: AgentRunnerRunRequest): Observable<BaseEvent> {
    const { threadId } = request;

    const existing = this.activeThreads.get(threadId);
    if (existing?.isRunning) {
      throw new Error('Thread already running');
    }

    const nextSubject = new ReplaySubject<BaseEvent>(Infinity);
    const runSubject = new ReplaySubject<BaseEvent>(Infinity);
    const currentRunEvents: BaseEvent[] = [];

    const active: ActiveThread = {
      agent: request.agent,
      subject: nextSubject,
      runSubject,
      currentEvents: currentRunEvents,
      currentRunId: request.input.runId,
      isRunning: true,
      stopRequested: false,
    };
    this.activeThreads.set(threadId, active);

    const runAgent = async () => {
      const { EventType, compactEvents, finalizeRunEvents } = await this.getUtils();

      // Carregar histórico para deduplificar messageIds
      const historicRuns = await this.loadHistoricRuns(threadId);
      const parentRunId = historicRuns[historicRuns.length - 1]?.runId ?? null;

      const historicMessageIds = new Set<string>();
      for (const run of historicRuns) {
        for (const event of run.events) {
          if ('messageId' in event && typeof event.messageId === 'string') {
            historicMessageIds.add(event.messageId);
          }
          if (event.type === EventType.RUN_STARTED) {
            const messages = (event as { input?: { messages?: { id: string }[] } }).input?.messages ?? [];
            for (const msg of messages) historicMessageIds.add(msg.id);
          }
        }
      }

      const seenMessageIds = new Set<string>();

      try {
        await (request.agent as AbstractAgent).runAgent(request.input, {
          onEvent: ({ event }: { event: BaseEvent }) => {
            let processedEvent = event;

            if (event.type === EventType.RUN_STARTED) {
              const runStartedEvent = event;
              if (!runStartedEvent.input) {
                const sanitizedMessages = request.input.messages
                  ? request.input.messages.filter((m: { id: string }) => !historicMessageIds.has(m.id))
                  : undefined;
                processedEvent = {
                  ...runStartedEvent,
                  input: { ...request.input, ...(sanitizedMessages !== undefined ? { messages: sanitizedMessages } : {}) },
                };
              }
            }

            runSubject.next(processedEvent);
            nextSubject.next(processedEvent);
            currentRunEvents.push(processedEvent);
          },
          onNewMessage: ({ message }: { message: { id: string } }) => {
            if (!seenMessageIds.has(message.id)) seenMessageIds.add(message.id);
          },
          onRunStartedEvent: () => {
            if (request.input.messages) {
              for (const msg of request.input.messages) {
                if (!seenMessageIds.has(msg.id)) seenMessageIds.add(msg.id);
              }
            }
          },
        });

        const appendedEvents = finalizeRunEvents(currentRunEvents, { stopRequested: active.stopRequested });
        for (const event of appendedEvents) {
          runSubject.next(event);
          nextSubject.next(event);
        }

        if (active.currentRunId && currentRunEvents.length > 0) {
          const compactedEvents = compactEvents(currentRunEvents);
          await this.saveRun({
            threadId,
            runId: active.currentRunId,
            parentRunId,
            events: compactedEvents,
            createdAt: Date.now(),
          });
        }
      } catch (error) {
        const interruptionMessage = error instanceof Error ? error.message : String(error);
        const appendedEvents = finalizeRunEvents(currentRunEvents, {
          stopRequested: active.stopRequested,
          interruptionMessage,
        });
        for (const event of appendedEvents) {
          runSubject.next(event);
          nextSubject.next(event);
        }

        if (active.currentRunId && currentRunEvents.length > 0) {
          const compactedEvents = compactEvents(currentRunEvents);
          await this.saveRun({
            threadId,
            runId: active.currentRunId,
            parentRunId,
            events: compactedEvents,
            createdAt: Date.now(),
          });
        }
      } finally {
        // Limpar estado ativo
        active.isRunning = false;
        active.stopRequested = false;
        runSubject.complete();
        nextSubject.complete();
        this.activeThreads.delete(threadId);
      }
    };

    runAgent();
    return runSubject.asObservable();
  }

  // ── connect() — Restaura thread do Supabase ──

  connect(request: AgentRunnerConnectRequest): Observable<BaseEvent> {
    const connectionSubject = new ReplaySubject<BaseEvent>(Infinity);

    const restore = async () => {
      const { compactEvents } = await this.getUtils();
      const historicRuns = await this.loadHistoricRuns(request.threadId);

      if (historicRuns.length === 0) {
        connectionSubject.complete();
        return;
      }

      const allEvents: BaseEvent[] = [];
      for (const run of historicRuns) allEvents.push(...run.events);
      const compactedEvents = compactEvents(allEvents);

      const emittedMessageIds = new Set<string>();
      for (const event of compactedEvents) {
        connectionSubject.next(event);
        if ('messageId' in event && typeof event.messageId === 'string') {
          emittedMessageIds.add(event.messageId);
        }
      }

      // Se thread está rodando agora, pipe live events
      const active = this.activeThreads.get(request.threadId);
      if (active?.isRunning && active.subject) {
        active.subject.subscribe({
          next: (event) => {
            if ('messageId' in event && typeof event.messageId === 'string' && emittedMessageIds.has(event.messageId)) return;
            connectionSubject.next(event);
          },
          complete: () => connectionSubject.complete(),
          error: (err) => connectionSubject.error(err),
        });
      } else {
        connectionSubject.complete();
      }
    };

    restore();
    return connectionSubject.asObservable();
  }

  // ── isRunning / stop — tracking in-memory ──

  async isRunning(request: AgentRunnerIsRunningRequest): Promise<boolean> {
    return this.activeThreads.get(request.threadId)?.isRunning ?? false;
  }

  async stop(request: AgentRunnerStopRequest): Promise<boolean | undefined> {
    const active = this.activeThreads.get(request.threadId);
    if (!active?.isRunning || active.stopRequested) return false;

    active.stopRequested = true;
    active.isRunning = false;

    try {
      active.agent.abortRun();
      return true;
    } catch (error) {
      console.error('[SupabaseAgentRunner] Failed to abort:', error);
      active.stopRequested = false;
      active.isRunning = true;
      return false;
    }
  }
}
