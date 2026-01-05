/**
 * Testes Unitários - useNotificacoesRealtime Hook
 *
 * Testes para o hook de Realtime de notificações, incluindo:
 * - Estados de subscription (SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT)
 * - Retry com backoff exponencial
 * - Channel cleanup
 * - Fallback para polling
 * - Callbacks em novos payloads
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

// Mock das actions
jest.mock("../../actions/notificacoes-actions", () => ({
  actionContarNotificacoesNaoLidas: jest.fn(),
}));

// Mock do cliente Supabase
const mockSubscribe = jest.fn();
const mockRemoveChannel = jest.fn();
const mockGetChannels = jest.fn().mockReturnValue([]);
const mockOn = jest.fn().mockReturnThis();
const mockChannel = jest.fn().mockReturnValue({
  on: mockOn,
  subscribe: mockSubscribe,
});

const mockAuthGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockAuthGetUser,
    },
    from: mockFrom,
    channel: mockChannel,
    getChannels: mockGetChannels,
    removeChannel: mockRemoveChannel,
  }),
}));

// Importar hook após mocks
import { useNotificacoesRealtime } from "../../hooks/use-notificacoes";
import { actionContarNotificacoesNaoLidas } from "../../actions/notificacoes-actions";

describe("useNotificacoesRealtime", () => {
  const mockUser = { id: "auth-user-123" };
  const mockUsuario = { id: 1 };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup padrão - usuário autenticado
    mockAuthGetUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockUsuario,
        error: null,
      }),
    });

    // Reset channel mocks
    mockGetChannels.mockReturnValue([]);
    mockSubscribe.mockImplementation((callback) => {
      // Simular subscription bem-sucedida por padrão
      callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED, null);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Subscription States", () => {
    it("deve configurar canal Realtime com sucesso quando SUBSCRIBED", async () => {
      const onNovaNotificacao = jest.fn();

      renderHook(() =>
        useNotificacoesRealtime({ onNovaNotificacao })
      );

      await waitFor(() => {
        expect(mockChannel).toHaveBeenCalledWith("notifications:1");
      });

      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        expect.objectContaining({
          event: "INSERT",
          schema: "public",
          table: "notificacoes",
          filter: "usuario_id=eq.1",
        }),
        expect.any(Function)
      );
    });

    it("deve ativar retry com backoff em CHANNEL_ERROR", async () => {
      let subscribeCallCount = 0;

      mockSubscribe.mockImplementation((callback) => {
        subscribeCallCount++;
        // Simular erro nas primeiras 2 tentativas
        if (subscribeCallCount <= 2) {
          callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("Connection failed"));
        } else {
          callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED, null);
        }
      });

      renderHook(() => useNotificacoesRealtime());

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(1);
      });

      // Avançar timer para primeira retry (1000ms base delay)
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(2);
      });

      // Avançar timer para segunda retry (2000ms = 2^1 * 1000)
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(3);
      });
    });

    it("deve ativar retry em TIMED_OUT", async () => {
      mockSubscribe.mockImplementationOnce((callback) => {
        callback(REALTIME_SUBSCRIBE_STATES.TIMED_OUT, null);
      });

      renderHook(() => useNotificacoesRealtime());

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(1);
      });

      // Avançar timer para retry
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockChannel).toHaveBeenCalledTimes(2);
      });
    });

    it("deve ativar polling após máximo de retries", async () => {
      mockSubscribe.mockImplementation((callback) => {
        callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("Connection failed"));
      });

      (actionContarNotificacoesNaoLidas as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          success: true,
          data: {
            total: 5,
            por_tipo: {
              processo_atribuido: 2,
              processo_movimentacao: 1,
              audiencia_atribuida: 1,
              audiencia_alterada: 0,
              expediente_atribuido: 1,
              expediente_alterado: 0,
              prazo_vencendo: 0,
              prazo_vencido: 0,
            },
          },
        },
      });

      const { result } = renderHook(() => useNotificacoesRealtime());

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(1);
      });

      // Avançar todos os delays de retry (1s + 2s + 4s = 7s)
      await act(async () => {
        jest.advanceTimersByTime(1000); // Retry 1
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(2);
      });

      await act(async () => {
        jest.advanceTimersByTime(2000); // Retry 2
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(3);
      });

      await act(async () => {
        jest.advanceTimersByTime(4000); // Retry 3 (último)
      });

      // Após 3 retries, polling deve ser ativado
      await waitFor(() => {
        expect(result.current.isUsingPolling).toBe(true);
      });
    });
  });

  describe("Channel Cleanup", () => {
    it("deve remover canal no cleanup", async () => {
      const { unmount } = renderHook(() => useNotificacoesRealtime());

      await waitFor(() => {
        expect(mockChannel).toHaveBeenCalled();
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });

    it("deve remover canal existente não inscrito antes de recriar", async () => {
      const existingChannel = {
        topic: "notifications:1",
        state: REALTIME_SUBSCRIBE_STATES.CLOSED,
      };

      mockGetChannels.mockReturnValue([existingChannel]);

      renderHook(() => useNotificacoesRealtime());

      await waitFor(() => {
        expect(mockRemoveChannel).toHaveBeenCalledWith(existingChannel);
      });

      expect(mockChannel).toHaveBeenCalledWith("notifications:1");
    });

    it("deve reutilizar canal existente se já inscrito", async () => {
      const existingChannel = {
        topic: "notifications:1",
        state: REALTIME_SUBSCRIBE_STATES.SUBSCRIBED,
      };

      mockGetChannels.mockReturnValue([existingChannel]);

      renderHook(() => useNotificacoesRealtime());

      await waitFor(() => {
        expect(mockGetChannels).toHaveBeenCalled();
      });

      // Não deve criar novo canal se já existe um inscrito
      expect(mockChannel).not.toHaveBeenCalled();
    });
  });

  describe("Callbacks", () => {
    it("deve chamar onNovaNotificacao quando receber payload de INSERT", async () => {
      const onNovaNotificacao = jest.fn();
      let postgresChangesHandler: ((payload: { new: unknown }) => void) | null = null;

      mockOn.mockImplementation((event, options, handler) => {
        if (event === "postgres_changes" && options.event === "INSERT") {
          postgresChangesHandler = handler;
        }
        return { on: mockOn, subscribe: mockSubscribe };
      });

      renderHook(() =>
        useNotificacoesRealtime({ onNovaNotificacao })
      );

      await waitFor(() => {
        expect(postgresChangesHandler).not.toBeNull();
      });

      // Simular nova notificação
      const mockPayload = {
        new: {
          id: 1,
          usuario_id: 1,
          tipo: "processo_atribuido",
          titulo: "Novo processo",
          descricao: "Você foi atribuído ao processo 123",
          entidade_tipo: "processo",
          entidade_id: 123,
          lida: false,
          lida_em: null,
          dados_adicionais: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      await act(async () => {
        postgresChangesHandler!(mockPayload);
      });

      expect(onNovaNotificacao).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          tipo: "processo_atribuido",
          titulo: "Novo processo",
        })
      );
    });

    it("deve chamar onContadorChange durante polling", async () => {
      const onContadorChange = jest.fn();

      // Forçar modo polling
      mockSubscribe.mockImplementation((callback) => {
        callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("Forced error"));
      });

      const mockContador = {
        total: 5,
        por_tipo: {
          processo_atribuido: 2,
          processo_movimentacao: 1,
          audiencia_atribuida: 1,
          audiencia_alterada: 0,
          expediente_atribuido: 1,
          expediente_alterado: 0,
          prazo_vencendo: 0,
          prazo_vencido: 0,
        },
      };

      (actionContarNotificacoesNaoLidas as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          success: true,
          data: mockContador,
        },
      });

      renderHook(() =>
        useNotificacoesRealtime({ onContadorChange })
      );

      // Avançar para ativar polling (após max retries)
      await act(async () => {
        jest.advanceTimersByTime(1000); // Retry 1
      });
      await act(async () => {
        jest.advanceTimersByTime(2000); // Retry 2
      });
      await act(async () => {
        jest.advanceTimersByTime(4000); // Retry 3
      });

      // Aguardar polling executar
      await waitFor(() => {
        expect(actionContarNotificacoesNaoLidas).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(onContadorChange).toHaveBeenCalledWith(mockContador);
      });
    });
  });

  describe("Edge Cases", () => {
    it("não deve configurar Realtime se usuário não autenticado", async () => {
      mockAuthGetUser.mockResolvedValue({
        data: { user: null },
      });

      renderHook(() => useNotificacoesRealtime());

      await waitFor(() => {
        expect(mockAuthGetUser).toHaveBeenCalled();
      });

      // Não deve criar canal
      expect(mockChannel).not.toHaveBeenCalled();
    });

    it("não deve configurar Realtime se usuário não encontrado na tabela usuarios", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "User not found" },
        }),
      });

      renderHook(() => useNotificacoesRealtime());

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith("usuarios");
      });

      // Não deve criar canal
      expect(mockChannel).not.toHaveBeenCalled();
    });

    it("deve limpar timeout de retry no unmount", async () => {
      mockSubscribe.mockImplementation((callback) => {
        callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("Error"));
      });

      const { unmount } = renderHook(() => useNotificacoesRealtime());

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(1);
      });

      // Unmount antes do retry completar
      unmount();

      // Avançar timer - retry não deve executar após unmount
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      // Channel foi criado apenas uma vez (antes do unmount)
      expect(mockChannel).toHaveBeenCalledTimes(1);
    });
  });
});
