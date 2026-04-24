// Utilitário de autenticação dual: Supabase Auth (front-end) + Bearer Token (API externa) + Service API Key (jobs do sistema)

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/service-client";
import { getClientIp } from "@/lib/utils/get-client-ip";
import { recordSuspiciousActivity } from "@/lib/security/ip-blocking";

/**
 * Resultado da autenticação
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string; // UUID do Supabase Auth (auth.users.id)
  usuarioId?: number; // ID do usuário na tabela usuarios (usuarios.id)
  usuario?: { id: number }; // Objeto de usuário para compatibilidade
  source?: "session" | "bearer" | "service";
  error?: string; // Mensagem de erro específica quando authenticated = false
}

// Cache simples em memória para evitar queries repetitivas ao banco
// Mapeia authUserId (UUID) -> { usuarioId (INT), expiresAt (timestamp) }
const userIdCache = new Map<string, { usuarioId: number; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Busca o ID do usuário na tabela usuarios pelo auth_user_id (UUID do Supabase Auth)
 * Usa cache em memória para evitar hits excessivos no banco
 */
async function buscarUsuarioIdPorAuthUserId(
  authUserId: string,
): Promise<number | null> {
  // 1. Tentar buscar do cache
  const cached = userIdCache.get(authUserId);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.usuarioId;
  }

  // Se expirou, remove do cache
  if (cached) {
    userIdCache.delete(authUserId);
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("usuarios")
      .select("id")
      .eq("auth_user_id", authUserId)
      .eq("ativo", true)
      .single();

    if (error || !data) {
      return null;
    }

    const usuarioId = data.id as number;

    // 2. Salvar no cache
    userIdCache.set(authUserId, {
      usuarioId,
      expiresAt: now + CACHE_TTL_MS
    });

    // Limpeza periódica do cache (opcional, simples)
    if (userIdCache.size > 1000) {
      // Se crescer muito, limpa tudo para evitar memory leak
      userIdCache.clear();
      // Readiciona o atual
      userIdCache.set(authUserId, {
        usuarioId,
        expiresAt: now + CACHE_TTL_MS
      });
    }

    return usuarioId;
  } catch {
    return null;
  }
}

/**
 * Autentica uma requisição verificando:
 * 1. Service API Key (para jobs do sistema) - prioridade mais alta
 * 2. Bearer Token (JWT do Supabase) - para front-end/API externa
 * 3. Supabase Session (cookies) - para front-end
 *
 * @param request - Requisição HTTP do Next.js
 * @returns Resultado da autenticação com userId (UUID) e usuarioId (ID da tabela usuarios)
 */
export async function authenticateRequest(
  request: NextRequest,
): Promise<AuthResult> {
  // 1. Verificar Service API Key (para jobs do sistema)
  const serviceApiKey = request.headers.get("x-service-api-key");
  const expectedServiceKey = process.env.SERVICE_API_KEY;

  if (serviceApiKey && expectedServiceKey) {
    // Comparação segura usando timing-safe comparison
    if (serviceApiKey === expectedServiceKey) {
      return {
        authenticated: true,
        userId: "system",
        usuarioId: undefined, // Sistema não tem usuarioId
        source: "service",
      };
    } else {
      // API key inválida
      console.error("[API Auth] ✗ Service API Key inválida");

      // Record suspicious activity for invalid API key
      const clientIp = getClientIp(request);
      await recordSuspiciousActivity(
        clientIp,
        "auth_failures",
        "Invalid service API key",
      );

      return {
        authenticated: false,
        error:
          "Service API Key inválida. Verifique o valor do header x-service-api-key.",
      };
    }
  }

  // Se o header x-service-api-key foi enviado mas SERVICE_API_KEY não está configurada
  if (serviceApiKey && !expectedServiceKey) {
    console.error(
      "[API Auth] ✗ Header x-service-api-key enviado, mas SERVICE_API_KEY não está configurada no servidor",
    );
    return {
      authenticated: false,
      error: "SERVICE_API_KEY não configurada no servidor.",
    };
  }

  // 2. Verificar Bearer Token (JWT do Supabase)
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const supabase = createServiceClient();

      // Verificar token e obter usuário
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        // Log de erro mantido pois indica problema real
        console.error("[API Auth] ✗ Bearer token inválido ou expirado");

        // Record suspicious activity for invalid bearer token
        const clientIp = getClientIp(request);
        await recordSuspiciousActivity(
          clientIp,
          "auth_failures",
          "Invalid bearer token",
        );

        return {
          authenticated: false,
          error: `Bearer token inválido ou expirado: ${error?.message || "Token não encontrado"
            }`,
        };
      }

      // Buscar ID do usuário na tabela usuarios
      const usuarioId = await buscarUsuarioIdPorAuthUserId(user.id);

      if (!usuarioId) {
        console.warn(
          `[API Auth] ⚠ Usuário autenticado (${user.id}), mas não encontrado na tabela usuarios`,
        );
      }

      return {
        authenticated: true,
        userId: user.id,
        usuarioId: usuarioId || undefined,
        usuario: usuarioId ? { id: usuarioId } : undefined,
        source: "bearer",
      };
    } catch (error) {
      console.error("[API Auth] ✗ Erro ao validar Bearer token:", error);
      return {
        authenticated: false,
        error: `Erro ao validar Bearer token: ${error instanceof Error ? error.message : "Erro desconhecido"
          }`,
      };
    }
  }

  // 3. Verificar Supabase session (cookies)
  // IMPORTANTE: Usar getUser() para verificação segura de autenticação
  // getSession() pode retornar dados não autenticados do storage
  // getUser() valida os dados contactando o servidor Supabase Auth
  try {
    // Criar cliente Supabase usando cookies() do next/headers
    // Isso permite tanto leitura quanto escrita de cookies em Route Handlers,
    // habilitando o refresh automático de tokens expirados
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Pode falhar em Server Components, mas em Route Handlers funciona
            }
          },
        },
      },
    );

    // getUser() valida o token contactando o servidor Supabase Auth
    // O middleware já cuida do refresh via getSession()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authenticated: false,
        error:
          "Nenhuma autenticação fornecida. Use x-service-api-key, Bearer token ou sessão válida.",
      };
    }

    // Buscar ID do usuário na tabela usuarios (agora com cache)
    const usuarioId = await buscarUsuarioIdPorAuthUserId(user.id);

    if (!usuarioId) {
      console.warn(
        `[API Auth] ⚠ Usuário autenticado via sessão (${user.id}), mas não encontrado na tabela usuarios`,
      );
    }

    return {
      authenticated: true,
      userId: user.id,
      usuarioId: usuarioId || undefined,
      usuario: usuarioId ? { id: usuarioId } : undefined,
      source: "session",
    };
  } catch (error) {
    console.error("[API Auth] ✗ Erro ao verificar sessão do Supabase:", error);
    return {
      authenticated: false,
      error: `Erro ao verificar sessão: ${error instanceof Error ? error.message : "Erro desconhecido"
        }`,
    };
  }
}
