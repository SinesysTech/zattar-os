"use client";

/**
 * Hook para gerenciar notificações do usuário
 * Inclui suporte a Realtime para atualizações em tempo real
 *
 * @see RULES.md para documentação de troubleshooting do Realtime
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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

// Configurações do Realtime
const REALTIME_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,
  POLLING_INTERVAL_MS: 60000, // Reduzido de 30s para 60s para diminuir Disk I/O (otimização)
} as const;

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
 *
 * Funcionalidades:
 * - Retry automático com backoff exponencial em caso de falha
 * - Fallback para polling quando Realtime não está disponível
 * - Logging estruturado para debugging
 *
 * @see RULES.md para documentação de troubleshooting
 */
export function useNotificacoesRealtime(options?: {
  onNovaNotificacao?: (notificacao: Notificacao) => void;
  onContadorChange?: (contador: ContadorNotificacoes) => void;
}) {
  const { onNovaNotificacao, onContadorChange } = options || {};
  // Usar useMemo para criar instância estável do cliente Supabase
  const supabase = useMemo(() => createClient(), []);

  // Estado para controlar fallback de polling
  const [usePolling, setUsePolling] = useState(false);

  // Usar ref para callback evitar re-subscriptions quando callback muda
  const callbackRef = useRef(onNovaNotificacao);
  const contadorCallbackRef = useRef(onContadorChange);

  // Refs para controle de retry
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref para rastrear último contador (detectar mudanças no polling)
  const lastContadorRef = useRef<ContadorNotificacoes | null>(null);

  // Manter refs atualizadas
  useEffect(() => {
    callbackRef.current = onNovaNotificacao;
  }, [onNovaNotificacao]);

  useEffect(() => {
    contadorCallbackRef.current = onContadorChange;
  }, [onContadorChange]);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    const setupRealtime = async () => {
      const startTime = Date.now();

      try {
        const [userResult, sessionResult] = await Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession(),
        ]);

        const user = userResult.data.user;
        const session = sessionResult.data.session;

        if (!isMounted) return;

        // Validar que temos usuário
        if (!user) {
          console.warn(
            "⚠️ [Notificações Realtime] Usuário não autenticado - Realtime desabilitado"
          );
          return;
        }

        const { data: usuarioData, error: usuarioError } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (!isMounted) return;

        // Validar que temos usuarioId
        if (!usuarioData || usuarioError) {
          console.warn(
            "⚠️ [Notificações Realtime] Usuário não encontrado na tabela usuarios",
            { authUserId: user.id, error: usuarioError }
          );
          return;
        }

        if (!session?.access_token) {
          console.warn(
            "⚠️ [Notificações Realtime] Sessão inválida - Realtime desabilitado",
            {
              authUserId: user.id,
              hasSession: Boolean(session),
            }
          );
          setUsePolling(true);
          return;
        }

        try {
          await supabase.realtime.setAuth(session.access_token);
        } catch (authError) {
          console.error(
            "❌ [Notificações Realtime] Falha ao configurar autenticação do Realtime",
            { authError }
          );
          setUsePolling(true);
          return;
        }

        const usuarioId = usuarioData.id;
        const channelName = `notifications:${usuarioId}`;

        // Log para debug
        console.log("🔄 [Notificações Realtime] Configurando canal:", {
          usuarioId,
          authUserId: user.id,
          channelName,
        });

        const existingChannel = supabase
          .getChannels()
          .find((ch) => ch.topic === channelName);

        if (existingChannel) {
          // Verificar se o canal existente está realmente inscrito
          const typedChannel = existingChannel as unknown as {
            state?: string;
            params?: { config?: { private?: boolean } };
          };
          const channelState = typedChannel.state;
          const isPrivateChannel = typedChannel.params?.config?.private === true;

          if (channelState === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED && isPrivateChannel) {
            console.log(
              "ℹ️ [Notificações Realtime] Canal já existe e está inscrito, reutilizando"
            );
            retryCountRef.current = 0;
            setUsePolling(false);
            channel = existingChannel;
            return;
          }
          // Canal existe mas não está inscrito - remover e recriar
          console.log(
            "⚠️ [Notificações Realtime] Canal existe mas não está inscrito, recriando",
            { channelState, isPrivateChannel }
          );
          supabase.removeChannel(existingChannel);
        }

        if (!isMounted) return;

        channel = supabase.channel(channelName, {
          config: {
            private: true,
          },
        });

        // Usar postgres_changes para escutar INSERT na tabela notificacoes
        // filtrado pelo usuario_id do usuário atual
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notificacoes",
            filter: `usuario_id=eq.${usuarioId}`,
          },
          (payload) => {
            if (callbackRef.current && payload.new) {
              const newRecord = payload.new as {
                id: number;
                usuario_id: number;
                tipo: string;
                titulo: string;
                descricao: string;
                entidade_tipo: string;
                entidade_id: number;
                lida: boolean;
                lida_em: string | null;
                dados_adicionais: Record<string, unknown>;
                created_at: string;
                updated_at: string;
              };

              console.log(
                "📩 [Notificações Realtime] Nova notificação recebida:",
                { id: newRecord.id, tipo: newRecord.tipo }
              );

              callbackRef.current({
                id: newRecord.id,
                usuario_id: newRecord.usuario_id,
                tipo: newRecord.tipo as TipoNotificacaoUsuario,
                titulo: newRecord.titulo,
                descricao: newRecord.descricao,
                entidade_tipo: newRecord.entidade_tipo as EntidadeTipo,
                entidade_id: newRecord.entidade_id,
                lida: newRecord.lida,
                lida_em: newRecord.lida_em,
                dados_adicionais: newRecord.dados_adicionais,
                created_at: newRecord.created_at,
                updated_at: newRecord.updated_at,
              });
            }
          }
        );

        channel.subscribe((status, err) => {
          const duration = Date.now() - startTime;

          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            console.log(
              `✅ [Notificações Realtime] Inscrito com sucesso em ${duration}ms`
            );
            // Reset retry count on success
            retryCountRef.current = 0;
            setUsePolling(false);
          } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
            console.error("❌ [Notificações Realtime] Erro ao inscrever:", {
              status,
              error: err,
              channelName,
              usuarioId,
              authUserId: user.id,
              duration,
              retryCount: retryCountRef.current,
            });

            // Tentar reconectar com backoff exponencial
            if (
              isMounted &&
              retryCountRef.current < REALTIME_CONFIG.MAX_RETRIES
            ) {
              const delay =
                Math.pow(2, retryCountRef.current) *
                REALTIME_CONFIG.BASE_DELAY_MS;
              console.log(
                `🔄 [Notificações Realtime] Tentando reconectar em ${delay}ms (tentativa ${retryCountRef.current + 1}/${REALTIME_CONFIG.MAX_RETRIES})`
              );

              retryTimeoutRef.current = setTimeout(() => {
                if (isMounted) {
                  retryCountRef.current++;
                  // Remover canal antigo antes de recriar
                  if (channel) {
                    supabase.removeChannel(channel);
                    channel = null;
                  }
                  setupRealtime();
                }
              }, delay);
            } else if (retryCountRef.current >= REALTIME_CONFIG.MAX_RETRIES) {
              console.warn(
                "⚠️ [Notificações Realtime] Máximo de tentativas atingido. Ativando fallback para polling."
              );
              setUsePolling(true);
            }
          } else if (status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) {
            console.warn(
              `⏱️ [Notificações Realtime] Timeout após ${duration}ms. Tentando reconectar...`
            );

            // Tratar timeout como erro recuperável
            if (
              isMounted &&
              retryCountRef.current < REALTIME_CONFIG.MAX_RETRIES
            ) {
              const delay =
                Math.pow(2, retryCountRef.current) *
                REALTIME_CONFIG.BASE_DELAY_MS;
              retryTimeoutRef.current = setTimeout(() => {
                if (isMounted) {
                  retryCountRef.current++;
                  if (channel) {
                    supabase.removeChannel(channel);
                    channel = null;
                  }
                  setupRealtime();
                }
              }, delay);
            }
          } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
            console.warn("🔒 [Notificações Realtime] Canal fechado inesperadamente", {
              retryCount: retryCountRef.current,
            });

            // Tratar fechamento como erro recuperável - tentar reconectar
            if (
              isMounted &&
              retryCountRef.current < REALTIME_CONFIG.MAX_RETRIES
            ) {
              const delay =
                Math.pow(2, retryCountRef.current) *
                REALTIME_CONFIG.BASE_DELAY_MS;
              console.log(
                `🔄 [Notificações Realtime] Tentando reconectar em ${delay}ms após fechamento (tentativa ${retryCountRef.current + 1}/${REALTIME_CONFIG.MAX_RETRIES})`
              );

              retryTimeoutRef.current = setTimeout(() => {
                if (isMounted) {
                  retryCountRef.current++;
                  // Remover canal antigo antes de recriar
                  if (channel) {
                    supabase.removeChannel(channel);
                    channel = null;
                  }
                  setupRealtime();
                }
              }, delay);
            } else if (retryCountRef.current >= REALTIME_CONFIG.MAX_RETRIES) {
              console.warn(
                "⚠️ [Notificações Realtime] Máximo de tentativas atingido após fechamento. Ativando fallback para polling."
              );
              setUsePolling(true);
            }
          }
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error("❌ [Notificações Realtime] Falha ao configurar:", {
          error,
          duration,
          retryCount: retryCountRef.current,
        });

        // Tentar reconectar em caso de erro
        if (isMounted && retryCountRef.current < REALTIME_CONFIG.MAX_RETRIES) {
          const delay =
            Math.pow(2, retryCountRef.current) * REALTIME_CONFIG.BASE_DELAY_MS;
          retryTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              retryCountRef.current++;
              setupRealtime();
            }
          }, delay);
        } else if (retryCountRef.current >= REALTIME_CONFIG.MAX_RETRIES) {
          console.warn(
            "⚠️ [Notificações Realtime] Máximo de tentativas atingido. Ativando fallback para polling."
          );
          setUsePolling(true);
        }
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  // Fallback para polling quando Realtime não está disponível
  useEffect(() => {
    if (!usePolling) return;

    console.log(
      `📊 [Notificações Polling] Ativado - intervalo: ${REALTIME_CONFIG.POLLING_INTERVAL_MS}ms`
    );

    const pollNotificacoes = async () => {
      try {
        // Usar a action para buscar contador de notificações
        const result = await actionContarNotificacoesNaoLidas({});
        if (result.success && result.data?.success) {
          const novoContador = result.data.data;

          // Verificar se houve mudança no contador
          const contadorMudou =
            !lastContadorRef.current ||
            lastContadorRef.current.total !== novoContador.total;

          console.log("📊 [Notificações Polling] Verificação concluída", {
            total: novoContador.total,
            anterior: lastContadorRef.current?.total ?? "N/A",
            mudou: contadorMudou,
          });

          // Atualizar ref do último contador
          lastContadorRef.current = novoContador;

          // Notificar callback sobre mudança no contador
          if (contadorCallbackRef.current) {
            contadorCallbackRef.current(novoContador);
          }

          // Se o total aumentou, notificar que há novas notificações
          // Otimização: não buscar notificações completas aqui para reduzir Disk I/O
          // Deixar a UI fazer a fetch sob demanda quando necessário
          if (contadorMudou && novoContador.total > 0) {
            console.log(
              "📊 [Notificações Polling] Contador mudou - notificações em cache aguardando"
            );
            // Polling detectou mudança; UI pode fazer actionListarNotificacoes() quando quiser
            // Removido: fetch automático de actionListarNotificacoes para reduzir I/O
          }
        }
      } catch (error) {
        console.error("❌ [Notificações Polling] Erro ao verificar:", error);
      }
    };

    // Executar imediatamente
    pollNotificacoes();

    // Configurar intervalo
    const interval = setInterval(
      pollNotificacoes,
      REALTIME_CONFIG.POLLING_INTERVAL_MS
    );

    return () => {
      console.log("📊 [Notificações Polling] Desativado");
      clearInterval(interval);
    };
  }, [usePolling]);

  return { isUsingPolling: usePolling };
}

