"use server";

/**
 * Server Actions - Integrações
 */

import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/safe-action";
import { z } from "zod";
import * as service from "../service";
import {
  criarIntegracaoSchema,
  atualizarIntegracaoSchema,
  twofauthConfigSchema,
} from "../domain";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Listar todas as integrações
 */
export const actionListarIntegracoes = authenticatedAction(
  z.void(),
  async (_, { user }) => {
    const data = await service.listar();
    return { success: true, data };
  }
);

/**
 * Listar integrações por tipo
 */
export const actionListarIntegracoesPorTipo = authenticatedAction(
  z.object({ tipo: z.enum(["twofauth", "zapier", "dify", "webhook", "api"]) }),
  async ({ tipo }, { user }) => {
    const data = await service.listarPorTipo(tipo);
    return { success: true, data };
  }
);

/**
 * Buscar integração por ID
 */
export const actionBuscarIntegracao = authenticatedAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }, { user }) => {
    const data = await service.buscarPorId(id);
    
    if (!data) {
      return { success: false, error: "Integração não encontrada" };
    }
    
    return { success: true, data };
  }
);

/**
 * Buscar configuração do 2FAuth
 */
export const actionBuscarConfig2FAuth = authenticatedAction(
  null,
  async (_, { user }) => {
    const data = await service.buscarConfig2FAuth();
    return { success: true, data };
  }
);

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Criar nova integração
 */
export const actionCriarIntegracao = authenticatedAction(
  criarIntegracaoSchema,
  async (data, { user }) => {
    const result = await service.criar(data);
    revalidatePath("/app/configuracoes");
    return { success: true, data: result };
  }
);

/**
 * Atualizar integração
 */
export const actionAtualizarIntegracao = authenticatedAction(
  atualizarIntegracaoSchema,
  async (data, { user }) => {
    const result = await service.atualizar(data);
    revalidatePath("/app/configuracoes");
    return { success: true, data: result };
  }
);

/**
 * Deletar integração
 */
export const actionDeletarIntegracao = authenticatedAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }, { user }) => {
    await service.deletar(id);
    revalidatePath("/app/configuracoes");
    return { success: true };
  }
);

/**
 * Ativar/desativar integração
 */
export const actionToggleAtivoIntegracao = authenticatedAction(
  z.object({
    id: z.string().uuid(),
    ativo: z.boolean(),
  }),
  async ({ id, ativo }, { user }) => {
    const result = await service.toggleAtivo(id, ativo);
    revalidatePath("/app/configuracoes");
    return { success: true, data: result };
  }
);

/**
 * Atualizar configuração do 2FAuth
 */
export const actionAtualizarConfig2FAuth = authenticatedAction(
  twofauthConfigSchema,
  async (data, { user }) => {
    const result = await service.atualizarConfig2FAuth(data);
    revalidatePath("/app/configuracoes");
    return { success: true, data: result };
  }
);
