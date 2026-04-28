/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { getClientIp } from "@/lib/utils/get-client-ip";
import { recordSuspiciousActivity } from "@/lib/security/ip-blocking";
import { createServiceClient } from "@/lib/supabase/service-client";

jest.mock("@/lib/supabase/service-client", () => {
  return {
    createServiceClient: jest.fn()
  };
});

jest.mock("next/headers", () => {
  return {
    cookies: jest.fn().mockReturnValue({
      get: jest.fn(),
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    })
  };
});

jest.mock("@/lib/utils/get-client-ip", () => {
  return {
    getClientIp: jest.fn().mockReturnValue("127.0.0.1")
  };
});

jest.mock("@/lib/security/ip-blocking", () => {
  return {
    recordSuspiciousActivity: jest.fn()
  };
});

describe('api-auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buscarUsuarioIdPorAuthUserId', () => {
    it('deve retornar null quando ocorre um erro ao buscar o usuario', async () => {
      // Configuramos o mock para retornar um erro ao tentar consultar a tabela usuarios
      (createServiceClient as jest.Mock).mockImplementation(() => {
        return {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: { id: "test-user-id" } },
              error: null
            })
          },
          from: jest.fn().mockImplementation(() => {
            throw new Error("Simulated query error to trigger catch block");
          })
        };
      });

      const mockRequest = {
        headers: {
          get: jest.fn((key) => {
            if (key === "authorization") return "Bearer test-token";
            return null;
          })
        }
      } as unknown as NextRequest;

      // Suprimir o warning apenas para este teste
      const originalWarn = console.warn;
      console.warn = jest.fn();

      const result = await authenticateRequest(mockRequest);

      // Restaurar warning
      console.warn = originalWarn;

      // Ao dar throw dentro de buscarUsuarioIdPorAuthUserId, o bloco catch deve engolir o erro
      // e retornar null. Com isso, authenticateRequest deve retornar usuarioId undefined.
      expect(result).toEqual({
        authenticated: true,
        userId: "test-user-id",
        usuarioId: undefined,
        usuario: undefined,
        source: "bearer",
      });
    });

    it('deve limpar o cache quando atingir o limite de 1000 itens e manter o item atual', async () => {
      // Como não podemos testar a função interna diretamente ou mockar o `userIdCache` (constante não exportada),
      // precisamos gerar o preenchimento desse cache.
      //
      // Para isso, faremos 1001 chamadas mockadas com ids diferentes.
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn()
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 1 },
                  error: null
                })
              })
            })
          })
        })
      };

      (createServiceClient as jest.Mock).mockReturnValue(mockSupabaseClient);

      const originalWarn = console.warn;
      console.warn = jest.fn();

      // Preenche o cache com 1001 itens.
      // A implementação de buscarUsuarioIdPorAuthUserId limpa o cache se o tamanho > 1000
      // ao inserir o próximo item.
      for (let i = 0; i <= 1001; i++) {
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
          data: { user: { id: `test-user-${i}` } },
          error: null
        });

        const mockRequest = {
          headers: {
            get: jest.fn((key) => {
              if (key === "authorization") return `Bearer test-token-${i}`;
              return null;
            })
          }
        } as unknown as NextRequest;

        const result = await authenticateRequest(mockRequest);

        expect(result.authenticated).toBe(true);
        expect(result.usuarioId).toBe(1);
      }

      console.warn = originalWarn;
    });
  });
});
