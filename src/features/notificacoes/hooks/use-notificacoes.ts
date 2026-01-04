"use client";

/**
 * Hook para gerenciar notificações do usuário
 * Inclui suporte a Realtime para atualizações em tempo real
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Notificacao,
  ContadorNotificacoes,
  ListarNotificacoesParams,
} from "../domain";
import {
  actionListarNotificacoes,
  actionContarNotificacoesNaoLidas,
  actionMarcarNotificacaoComoLida,
  actionMarcarTodasComoLidas,
} from "../actions/notificacoes-actions";

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

  // Buscar notificações
  const buscarNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await actionListarNotificacoes(params || {});

      if (result.success && result.data) {
        setNotificacoes(result.data.notificacoes);
      } else {
        setError(result.error || "Erro ao buscar notificações");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Buscar contador
  const buscarContador = useCallback(async () => {
    try {
      const result = await actionContarNotificacoesNaoLidas({});

      if (result.success && result.data) {
        setContador(result.data);
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
 */
export function useNotificacoesRealtime(
  onNovaNotificacao?: (notificacao: Notificacao) => void
) {
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    // Buscar ID do usuário autenticado
    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Buscar ID do usuário na tabela usuarios
      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!usuarioData) return;

      const usuarioId = usuarioData.id;

      // Configurar canal Realtime
      const channel = supabase.channel(
        `user:${usuarioId}:notifications`,
        {
          config: {
            broadcast: { self: true, ack: true },
            private: true,
          },
        }
      );

      // Escutar eventos de nova notificação
      channel.on(
        "broadcast",
        { event: "notification_created" },
        (payload) => {
          if (onNovaNotificacao && payload.payload) {
            // Buscar notificação completa do banco
            actionListarNotificacoes({ pagina: 1, limite: 1 })
              .then((result) => {
                if (result.success && result.data?.notificacoes[0]) {
                  onNovaNotificacao(result.data.notificacoes[0]);
                }
              })
              .catch(console.error);
          }
        }
      );

      // Inscrever no canal
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Inscrito em notificações em tempo real");
        }
      });

      // Cleanup
      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, [supabase, onNovaNotificacao]);
}

