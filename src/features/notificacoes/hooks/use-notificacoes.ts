"use client";

/**
 * Hook para gerenciar notificações do usuário
 * Inclui suporte a Realtime para atualizações em tempo real
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import type {
  Notificacao,
  ContadorNotificacoes,
  ListarNotificacoesParams,
  TipoNotificacaoUsuario,
  EntidadeTipo,
} from "../domain";
import {
  actionListarNotificacoes,
  actionContarNotificacoesNaoLidas,
  actionMarcarNotificacaoComoLida,
  actionMarcarTodasComoLidas,
} from "../actions/notificacoes-actions";
import { useDeepCompareMemo } from "@/hooks/use-render-count";

export function useNotificacoes(params?: ListarNotificacoesParams) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [contador, setContador] = useState<ContadorNotificacoes>({
    total: 0,
    por_tipo: {
      processo_atribuido: 0,
      processo_movimentacao: 0,
      audiencia_atribuida: 0,
      audiencia_alterada: 0,
      expediente_atribuido: 0,
      expediente_alterado: 0,
      prazo_vencendo: 0,
      prazo_vencido: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  // Estabilizar params com comparação profunda
  // Evita re-fetches quando params tem mesmos valores mas referência diferente
  const stableParams = useDeepCompareMemo(
    () => params || { pagina: 1, limite: 20 },
    [params]
  );

  // Buscar notificações
  const buscarNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await actionListarNotificacoes(stableParams);

      if (result.success && result.data?.success) {
        setNotificacoes(result.data.data.notificacoes);
      } else {
        setError(
          result.success === false
            ? result.error || "Erro ao buscar notificações"
            : result.data?.success === false
              ? result.data.error.message
              : "Erro ao buscar notificações"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

  // Buscar contador
  const buscarContador = useCallback(async () => {
    try {
      const result = await actionContarNotificacoesNaoLidas({});

      if (result.success && result.data?.success) {
        setContador(result.data.data);
      }
    } catch (err) {
      console.error("Erro ao buscar contador de notificações:", err);
    }
  }, []);

  // Marcar como lida
  const marcarComoLida = useCallback(
    async (id: number) => {
      try {
        const result = await actionMarcarNotificacaoComoLida({ id });

        if (result.success) {
          // Atualizar estado local
          setNotificacoes((prev) =>
            prev.map((n) =>
              n.id === id
                ? { ...n, lida: true, lida_em: new Date().toISOString() }
                : n
            )
          );
          // Atualizar contador
          await buscarContador();
        }
      } catch (err) {
        console.error("Erro ao marcar notificação como lida:", err);
      }
    },
    [buscarContador]
  );

  // Marcar todas como lidas
  const marcarTodasComoLidas = useCallback(async () => {
    try {
      const result = await actionMarcarTodasComoLidas({});

      if (result.success) {
        // Atualizar estado local
        setNotificacoes((prev) =>
          prev.map((n) => ({
            ...n,
            lida: true,
            lida_em: new Date().toISOString(),
          }))
        );
        // Atualizar contador
        await buscarContador();
      }
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    }
  }, [buscarContador]);

  // Carregar dados iniciais
  useEffect(() => {
    // Executar na primeira render
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }

    buscarNotificacoes();
    buscarContador();
  }, [buscarNotificacoes, buscarContador]);

  return {
    notificacoes,
    contador,
    loading,
    error,
    refetch: buscarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
  };
}

/**
 * Hook para escutar notificações em tempo real via Supabase Realtime
 *
 * IMPORTANTE: Para evitar re-subscriptions, o callback onNovaNotificacao
 * é armazenado em uma ref. Isso significa que mudanças no callback não causam
 * re-criação da subscription.
 */
export function useNotificacoesRealtime(
  onNovaNotificacao?: (notificacao: Notificacao) => void
) {
  const [supabase] = useState(() => createClient());
  // Usar ref para callback evitar re-subscriptions quando callback muda
  const callbackRef = useRef(onNovaNotificacao);

  // Manter ref atualizada
  useEffect(() => {
    callbackRef.current = onNovaNotificacao;
  }, [onNovaNotificacao]);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    // Buscar ID do usuário autenticado
    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;
      if (!user) return;

      // Buscar ID do usuário na tabela usuarios
      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!isMounted) return;
      if (!usuarioData) return;

      const usuarioId = usuarioData.id;

      // Verificar se já existe um canal para este usuário
      const existingChannel = supabase
        .getChannels()
        .find((ch) => ch.topic === `user:${usuarioId}:notifications`);

      if (existingChannel) {
        // Já existe um canal, não criar outro
        return;
      }

      // Configurar canal Realtime
      channel = supabase.channel(`user:${usuarioId}:notifications`, {
        config: {
          broadcast: { self: true, ack: true },
          private: true,
        },
      });

      // Escutar eventos de nova notificação
      channel.on(
        "broadcast",
        { event: "notification_created" },
        (payload) => {
          // Usar ref para evitar dependência no useEffect
          if (callbackRef.current && payload.payload) {
            const payloadData = payload.payload as {
              id?: number;
              tipo?: string;
              titulo?: string;
              entidade_tipo?: string;
              entidade_id?: number;
            };

            // Callback será chamado para trigger refetch
            // O payload já contém informações suficientes
            // Criar notificação temporária para trigger do callback
            // O refetch buscará a notificação completa
            const tipoNotificacao: TipoNotificacaoUsuario =
              (payloadData.tipo as TipoNotificacaoUsuario) ||
              "processo_atribuido";
            const entidadeTipo: EntidadeTipo =
              (payloadData.entidade_tipo as EntidadeTipo) || "processo";

            callbackRef.current({
              id: payloadData.id || 0,
              usuario_id: 0,
              tipo: tipoNotificacao,
              titulo: payloadData.titulo || "",
              descricao: "",
              entidade_tipo: entidadeTipo,
              entidade_id: payloadData.entidade_id || 0,
              lida: false,
              lida_em: null,
              dados_adicionais: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      );

      // Set auth antes de inscrever
      await supabase.realtime.setAuth();
      if (!isMounted) {
        if (channel) supabase.removeChannel(channel);
        return;
      }

      // Inscrever no canal
      channel.subscribe((status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          console.log("Inscrito em notificações em tempo real");
        } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
          console.error("Erro ao inscrever em notificações:", status);
        }
      });
    };

    setupRealtime();

    // Cleanup
    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    // Removido onNovaNotificacao das dependências pois usamos callbackRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);
}

