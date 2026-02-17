'use server';

import { actionClient } from '@/lib/safe-action';
import { z } from 'zod';
import * as service from './service';
import * as geracaoAutomaticaService from './geracao-automatica-service';
import {
  criarAssistenteTipoSchema,
  atualizarAssistenteTipoSchema,
  listarAssistentesTiposSchema,
} from './domain';

/**
 * ASSISTENTES-TIPOS ACTIONS
 * 
 * Server actions para configuração de assistentes por tipo de expediente
 * e geração automática de peças.
 */

// ============================================================================
// ACTIONS - CONFIGURAÇÃO
// ============================================================================

/**
 * Listar relações assistente-tipo
 */
export const listarAssistentesTiposAction = actionClient
  .schema(listarAssistentesTiposSchema.partial())
  .action(async ({ parsedInput, ctx }) => {
    const result = await service.listar(parsedInput);
    return result;
  });

/**
 * Buscar assistente configurado para um tipo
 */
export const buscarAssistenteParaTipoAction = actionClient
  .schema(z.object({ tipo_expediente_id: z.number().int().positive() }))
  .action(async ({ parsedInput }) => {
    const result = await service.buscarAssistenteParaTipo(parsedInput.tipo_expediente_id);
    return result;
  });

/**
 * Criar nova relação assistente-tipo
 */
export const criarAssistenteTipoAction = actionClient
  .schema(criarAssistenteTipoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await service.criar(parsedInput, ctx.userId);
    return result;
  });

/**
 * Atualizar relação existente
 */
export const atualizarAssistenteTipoAction = actionClient
  .schema(
    z.object({
      id: z.number().int().positive(),
      dados: atualizarAssistenteTipoSchema,
    })
  )
  .action(async ({ parsedInput }) => {
    const result = await service.atualizar(parsedInput.id, parsedInput.dados);
    return result;
  });

/**
 * Deletar relação
 */
export const deletarAssistenteTipoAction = actionClient
  .schema(z.object({ id: z.number().int().positive() }))
  .action(async ({ parsedInput }) => {
    await service.deletar(parsedInput.id);
    return { success: true };
  });

/**
 * Ativar relação específica
 */
export const ativarAssistenteTipoAction = actionClient
  .schema(z.object({ id: z.number().int().positive() }))
  .action(async ({ parsedInput }) => {
    await service.ativar(parsedInput.id);
    return { success: true };
  });

// ============================================================================
// ACTIONS - GERAÇÃO AUTOMÁTICA
// ============================================================================

/**
 * Gerar peça automática para um expediente
 */
export const gerarPecaAutomaticaAction = actionClient
  .schema(z.object({ expediente_id: z.number().int().positive() }))
  .action(async ({ parsedInput, ctx }) => {
    const resultado = await geracaoAutomaticaService.gerarPecaAutomatica(
      parsedInput.expediente_id,
      ctx.userId
    );
    
    if (!resultado.sucesso) {
      throw new Error(resultado.mensagem);
    }
    
    return resultado;
  });
