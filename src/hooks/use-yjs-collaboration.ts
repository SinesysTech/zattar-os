/**
 * Hook para colaboração CRDT com Yjs e Supabase
 *
 * Gerencia a sincronização do documento Yjs via Supabase Realtime.
 * Integra com Plate.js para edição colaborativa em tempo real.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { createClient } from '@/core/app/_lib/supabase/client';
import { SupabaseProvider } from '@/lib/yjs/supabase-provider';

export interface UseYjsCollaborationOptions {
  /**
   * ID do documento para sincronização
   */
  documentoId: number;
  /**
   * Se deve habilitar persistência local (IndexedDB)
   */
  enableLocalPersistence?: boolean;
  /**
   * Callback quando o documento sincronizar
   */
  onSync?: () => void;
  /**
   * Callback quando houver erro
   */
  onError?: (error: Error) => void;
}

export interface UseYjsCollaborationReturn {
  /**
   * Documento Yjs para ser usado com Plate
   */
  yDoc: Y.Doc | null;
  /**
   * Provider Supabase para Yjs
   */
  provider: SupabaseProvider | null;
  /**
   * Se o documento está sincronizado com outros clientes
   */
  isSynced: boolean;
  /**
   * Se está conectado ao canal Realtime
   */
  isConnected: boolean;
  /**
   * Se ainda está carregando/inicializando
   */
  isLoading: boolean;
  /**
   * Erro, se houver
   */
  error: Error | null;
  /**
   * Reconectar ao canal
   */
  reconnect: () => void;
}

export function useYjsCollaboration(
  options: UseYjsCollaborationOptions
): UseYjsCollaborationReturn {
  const { documentoId, enableLocalPersistence = true, onSync, onError } = options;

  const supabase = createClient();

  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<SupabaseProvider | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Refs para cleanup
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<SupabaseProvider | null>(null);
  const indexedDbRef = useRef<IndexeddbPersistence | null>(null);

  // Inicializar Yjs
  useEffect(() => {
    if (!documentoId) return;

    const initYjs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Criar documento Yjs
        const doc = new Y.Doc();
        docRef.current = doc;

        // Configurar persistência local (IndexedDB)
        if (enableLocalPersistence) {
          const indexedDb = new IndexeddbPersistence(`documento-${documentoId}`, doc);
          indexedDbRef.current = indexedDb;

          // Aguardar sync com IndexedDB
          await new Promise<void>((resolve) => {
            indexedDb.on('synced', () => {
              console.log('[Yjs] Sincronizado com IndexedDB');
              resolve();
            });
          });
        }

        // Configurar provider Supabase
        const supabaseProvider = new SupabaseProvider({
          supabase,
          channelName: `yjs:documento:${documentoId}`,
          doc,
          onConnect: () => {
            console.log('[Yjs] Conectado ao Supabase Realtime');
            setIsConnected(true);
          },
          onDisconnect: () => {
            console.log('[Yjs] Desconectado do Supabase Realtime');
            setIsConnected(false);
            setIsSynced(false);
          },
          onSyncError: (err) => {
            console.error('[Yjs] Erro de sync:', err);
            setError(err);
            onError?.(err);
          },
        });

        providerRef.current = supabaseProvider;

        // Escutar evento de sync
        supabaseProvider.on('sync', (synced: boolean[]) => {
          console.log('[Yjs] Sync status:', synced[0]);
          setIsSynced(synced[0]);
          if (synced[0]) {
            onSync?.();
          }
        });

        // Escutar mudanças de status
        supabaseProvider.on('status', (event: { status: string }[]) => {
          setIsConnected(event[0].status === 'connected');
        });

        setYDoc(doc);
        setProvider(supabaseProvider);
        setIsLoading(false);
      } catch (err) {
        console.error('[Yjs] Erro ao inicializar:', err);
        const error = err instanceof Error ? err : new Error('Erro ao inicializar Yjs');
        setError(error);
        onError?.(error);
        setIsLoading(false);
      }
    };

    initYjs();

    // Cleanup
    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (indexedDbRef.current) {
        indexedDbRef.current.destroy();
        indexedDbRef.current = null;
      }
      if (docRef.current) {
        docRef.current.destroy();
        docRef.current = null;
      }
      setYDoc(null);
      setProvider(null);
      setIsSynced(false);
      setIsConnected(false);
    };
  }, [documentoId, enableLocalPersistence, onSync, onError, supabase]);

  // Função para reconectar
  const reconnect = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.reconnect();
    }
  }, []);

  return {
    yDoc,
    provider,
    isSynced,
    isConnected,
    isLoading,
    error,
    reconnect,
  };
}
