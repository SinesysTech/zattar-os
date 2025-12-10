/**
 * SupabaseProvider para Yjs
 *
 * Provider customizado que sincroniza documentos Yjs via Supabase Realtime.
 * Usa o canal de broadcast para enviar/receber atualizações incrementais.
 *
 * Baseado no conceito de y-websocket, mas usando Supabase como transporte.
 */

import * as Y from 'yjs';
import { Observable } from 'lib0/observable';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseProviderOptions {
  /**
   * Cliente Supabase já autenticado
   */
  supabase: SupabaseClient;
  /**
   * Nome do canal (geralmente 'yjs:documento:{id}')
   */
  channelName: string;
  /**
   * Documento Yjs a ser sincronizado
   */
  doc: Y.Doc;
  /**
   * Callback quando conectar
   */
  onConnect?: () => void;
  /**
   * Callback quando desconectar
   */
  onDisconnect?: () => void;
  /**
   * Callback quando houver erro de sincronização
   */
  onSyncError?: (error: Error) => void;
}

type EventName = 'sync' | 'status' | 'connection-close' | 'connection-error';

export class SupabaseProvider extends Observable<EventName> {
  private supabase: SupabaseClient;
  private channelName: string;
  private channel: RealtimeChannel | null = null;
  private _synced = false;
  private _connected = false;
  private onConnect?: () => void;
  private onDisconnect?: () => void;
  private onSyncError?: (error: Error) => void;

  doc: Y.Doc;
  awareness: null = null; // Pode ser implementado futuramente

  constructor(options: SupabaseProviderOptions) {
    super();
    this.supabase = options.supabase;
    this.channelName = options.channelName;
    this.doc = options.doc;
    this.onConnect = options.onConnect;
    this.onDisconnect = options.onDisconnect;
    this.onSyncError = options.onSyncError;

    this.setupChannel();
    this.setupDocListener();
  }

  get synced(): boolean {
    return this._synced;
  }

  get connected(): boolean {
    return this._connected;
  }

  /**
   * Configura o canal Supabase Realtime
   */
  private setupChannel(): void {
    this.channel = this.supabase.channel(this.channelName, {
      config: {
        broadcast: {
          self: false, // Não receber próprias mensagens
        },
      },
    });

    // Escutar atualizações de outros clientes
    this.channel
      .on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
        this.handleRemoteUpdate(payload);
      })
      .on('broadcast', { event: 'yjs-sync-request' }, () => {
        // Outro cliente pediu sync - enviar estado completo
        this.sendFullState();
      })
      .on('broadcast', { event: 'yjs-sync-response' }, ({ payload }) => {
        // Receber estado completo de outro cliente
        this.handleSyncResponse(payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this._connected = true;
          this.emit('status', [{ status: 'connected' }]);
          this.onConnect?.();

          // Solicitar sync inicial de outros clientes
          this.requestSync();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this._connected = false;
          this._synced = false;
          this.emit('status', [{ status: 'disconnected' }]);
          this.emit('connection-close', []);
          this.onDisconnect?.();
        }
      });
  }

  /**
   * Configura listener para mudanças locais no documento
   */
  private setupDocListener(): void {
    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      // Ignorar atualizações que vieram de sync remoto
      if (origin === this) return;

      // Broadcast da atualização para outros clientes
      this.broadcastUpdate(update);
    });
  }

  /**
   * Envia atualização incremental para outros clientes
   */
  private broadcastUpdate(update: Uint8Array): void {
    if (!this.channel || !this._connected) return;

    this.channel.send({
      type: 'broadcast',
      event: 'yjs-update',
      payload: {
        update: Array.from(update), // Converter Uint8Array para array regular (JSON-safe)
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Solicita sync completo de outros clientes (usado ao conectar)
   */
  private requestSync(): void {
    if (!this.channel) return;

    this.channel.send({
      type: 'broadcast',
      event: 'yjs-sync-request',
      payload: { timestamp: Date.now() },
    });

    // Se não receber resposta em 2s, considerar synced (pode ser o primeiro cliente)
    setTimeout(() => {
      if (!this._synced) {
        this._synced = true;
        this.emit('sync', [true]);
      }
    }, 2000);
  }

  /**
   * Envia estado completo para clientes que solicitaram sync
   */
  private sendFullState(): void {
    if (!this.channel || !this._connected) return;

    const state = Y.encodeStateAsUpdate(this.doc);

    this.channel.send({
      type: 'broadcast',
      event: 'yjs-sync-response',
      payload: {
        state: Array.from(state),
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
      Y.applyUpdate(this.doc, update, this); // 'this' como origin para evitar loop
    } catch (error) {
      console.error('[SupabaseProvider] Erro ao aplicar update remoto:', error);
      this.onSyncError?.(error as Error);
      this.emit('connection-error', [error]);
    }
  }

  /**
   * Aplica estado completo recebido de outro cliente
   */
  private handleSyncResponse(payload: { state: number[]; timestamp: number }): void {
    try {
      const state = new Uint8Array(payload.state);
      Y.applyUpdate(this.doc, state, this);

      if (!this._synced) {
        this._synced = true;
        this.emit('sync', [true]);
      }
    } catch (error) {
      console.error('[SupabaseProvider] Erro ao aplicar sync response:', error);
      this.onSyncError?.(error as Error);
      this.emit('connection-error', [error]);
    }
  }

  /**
   * Reconecta ao canal
   */
  reconnect(): void {
    this.disconnect();
    this.setupChannel();
  }

  /**
   * Desconecta do canal
   */
  disconnect(): void {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this._connected = false;
    this._synced = false;
  }

  /**
   * Limpa recursos
   */
  destroy(): void {
    this.disconnect();
    this.doc.off('update', () => {});
    super.destroy();
  }
}
