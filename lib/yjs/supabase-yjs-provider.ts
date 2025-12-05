/**
 * SupabaseYjsProvider - Provider customizado para @platejs/yjs
 *
 * Implementa a interface UnifiedProvider do @platejs/yjs,
 * permitindo sincronização CRDT via Supabase Realtime.
 */

import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Interface esperada pelo @platejs/yjs para providers customizados
export interface UnifiedProvider {
  type: string;
  document: Y.Doc;
  awareness: Awareness;
  isConnected: boolean;
  isSynced: boolean;
  connect: () => void;
  disconnect: () => void;
  destroy: () => void;
}

// Handlers de eventos opcionais do @platejs/yjs
export interface ProviderEventHandlers {
  onSyncChange?: (isSynced: boolean) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

export interface SupabaseYjsProviderOptions {
  /**
   * Cliente Supabase autenticado
   */
  supabase: SupabaseClient;
  /**
   * ID do documento para criar canal único
   */
  documentId: string | number;
  /**
   * Documento Yjs (será criado se não fornecido)
   */
  ydoc?: Y.Doc;
  /**
   * Awareness (será criado se não fornecido)
   */
  awareness?: Awareness;
  /**
   * Dados do usuário atual para awareness/cursors
   */
  userData?: {
    name: string;
    color: string;
    id?: number;
  };
}

/**
 * Provider customizado para sincronização Yjs via Supabase Realtime.
 *
 * Implementa a interface UnifiedProvider esperada por @platejs/yjs,
 * permitindo edição colaborativa CRDT através de canais Realtime.
 *
 * @example
 * ```typescript
 * const provider = new SupabaseYjsProvider({
 *   supabase: createClient(),
 *   documentId: 123,
 *   userData: { name: 'João', color: '#3b82f6' }
 * });
 *
 * // Usar com @platejs/yjs
 * YjsPlugin.configure({
 *   ydoc: provider.document,
 *   customProviders: [provider],
 * })
 * ```
 */
export class SupabaseYjsProvider implements UnifiedProvider {
  readonly type = 'supabase';

  private _supabase: SupabaseClient;
  private _documentId: string | number;
  private _document: Y.Doc;
  private _awareness: Awareness;
  private _channel: RealtimeChannel | null = null;
  private _isConnected = false;
  private _isSynced = false;
  private _handlers?: ProviderEventHandlers;
  private _userData?: SupabaseYjsProviderOptions['userData'];

  constructor(
    options: SupabaseYjsProviderOptions,
    handlers?: ProviderEventHandlers
  ) {
    this._supabase = options.supabase;
    this._documentId = options.documentId;
    this._document = options.ydoc || new Y.Doc();
    this._awareness = options.awareness || new Awareness(this._document);
    this._handlers = handlers;
    this._userData = options.userData;

    // Configurar listener de updates do documento
    this._document.on('update', this.handleLocalUpdate.bind(this));

    // Configurar awareness
    if (this._userData) {
      this._awareness.setLocalState({
        user: this._userData,
      });
    }

    this._awareness.on('update', this.handleAwarenessUpdate.bind(this));
  }

  get document(): Y.Doc {
    return this._document;
  }

  get awareness(): Awareness {
    return this._awareness;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get isSynced(): boolean {
    return this._isSynced;
  }

  /**
   * Conecta ao canal Supabase Realtime
   */
  connect(): void {
    if (this._channel) {
      console.warn('[SupabaseYjsProvider] Já conectado');
      return;
    }

    const channelName = `yjs-doc-${this._documentId}`;

    this._channel = this._supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false, // Não receber próprias mensagens
        },
        presence: {
          key: this._userData?.id?.toString() || Math.random().toString(),
        },
      },
    });

    // Escutar atualizações Yjs de outros clientes
    this._channel
      .on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
        this.handleRemoteUpdate(payload);
      })
      .on('broadcast', { event: 'yjs-sync-request' }, () => {
        // Outro cliente pediu sync completo
        this.sendFullState();
      })
      .on('broadcast', { event: 'yjs-sync-response' }, ({ payload }) => {
        this.handleSyncResponse(payload);
      })
      .on('broadcast', { event: 'yjs-awareness' }, ({ payload }) => {
        this.handleRemoteAwareness(payload);
      })
      .on('presence', { event: 'sync' }, () => {
        // Presence sync - útil para debug
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this._isConnected = true;
          this._handlers?.onConnectionChange?.(true);

          // Solicitar sync inicial
          this.requestSync();

          // Enviar awareness inicial
          if (this._userData) {
            this._channel?.track({
              user: this._userData,
            });
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this._isConnected = false;
          this._isSynced = false;
          this._handlers?.onConnectionChange?.(false);
          this._handlers?.onSyncChange?.(false);
        }
      });
  }

  /**
   * Desconecta do canal
   */
  disconnect(): void {
    if (this._channel) {
      this._supabase.removeChannel(this._channel);
      this._channel = null;
    }

    if (this._isSynced) {
      this._isSynced = false;
      this._handlers?.onSyncChange?.(false);
    }

    this._isConnected = false;
    this._handlers?.onConnectionChange?.(false);
  }

  /**
   * Limpa recursos e desconecta
   */
  destroy(): void {
    this._document.off('update', this.handleLocalUpdate.bind(this));
    this._awareness.off('update', this.handleAwarenessUpdate.bind(this));
    this.disconnect();
  }

  /**
   * Envia atualização local para outros clientes
   */
  private handleLocalUpdate(update: Uint8Array, origin: unknown): void {
    // Ignorar updates que vieram de sync remoto (evitar loop)
    if (origin === 'remote') return;

    if (!this._channel || !this._isConnected) return;

    this._channel.send({
      type: 'broadcast',
      event: 'yjs-update',
      payload: {
        update: Array.from(update),
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Aplica atualização remota ao documento local
   */
  private handleRemoteUpdate(payload: { update: number[]; timestamp: number }): void {
    try {
      const update = new Uint8Array(payload.update);
      Y.applyUpdate(this._document, update, 'remote');
    } catch (error) {
      console.error('[SupabaseYjsProvider] Erro ao aplicar update:', error);
    }
  }

  /**
   * Solicita sync completo de outros clientes
   */
  private requestSync(): void {
    if (!this._channel) return;

    this._channel.send({
      type: 'broadcast',
      event: 'yjs-sync-request',
      payload: { timestamp: Date.now() },
    });

    // Se não receber resposta em 2s, considerar synced (primeiro cliente)
    setTimeout(() => {
      if (!this._isSynced) {
        this._isSynced = true;
        this._handlers?.onSyncChange?.(true);
      }
    }, 2000);
  }

  /**
   * Envia estado completo para quem solicitou sync
   */
  private sendFullState(): void {
    if (!this._channel || !this._isConnected) return;

    const state = Y.encodeStateAsUpdate(this._document);

    this._channel.send({
      type: 'broadcast',
      event: 'yjs-sync-response',
      payload: {
        state: Array.from(state),
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Aplica estado completo recebido de outro cliente
   */
  private handleSyncResponse(payload: { state: number[]; timestamp: number }): void {
    try {
      const state = new Uint8Array(payload.state);
      Y.applyUpdate(this._document, state, 'remote');

      if (!this._isSynced) {
        this._isSynced = true;
        this._handlers?.onSyncChange?.(true);
      }
    } catch (error) {
      console.error('[SupabaseYjsProvider] Erro no sync:', error);
    }
  }

  /**
   * Envia awareness update para outros clientes
   */
  private handleAwarenessUpdate(): void {
    if (!this._channel || !this._isConnected) return;

    const awarenessUpdate = Array.from(this._awareness.getStates().entries());

    this._channel.send({
      type: 'broadcast',
      event: 'yjs-awareness',
      payload: {
        states: awarenessUpdate,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Aplica awareness remoto
   */
  private handleRemoteAwareness(payload: { states: [number, unknown][]; timestamp: number }): void {
    // Atualizar awareness com estados remotos
    for (const [clientId, state] of payload.states) {
      if (clientId !== this._awareness.clientID) {
        this._awareness.setLocalStateField('remoteUser', state);
      }
    }
  }
}

/**
 * Factory function para criar provider e configuração do Yjs
 */
export function createSupabaseYjsConfig(options: SupabaseYjsProviderOptions) {
  const provider = new SupabaseYjsProvider(options);

  return {
    provider,
    ydoc: provider.document,
    cursorOptions: options.userData
      ? {
          cursorData: {
            name: options.userData.name,
            color: options.userData.color,
          },
        }
      : undefined,
  };
}
