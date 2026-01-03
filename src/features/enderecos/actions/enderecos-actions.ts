'use server';

import { revalidatePath } from 'next/cache';
import { authenticatedAction } from '@/lib/safe-action';
import * as service from '../service';
import type {
  CriarEnderecoParams,
  AtualizarEnderecoParams,
  ListarEnderecosParams,
  BuscarEnderecosPorEntidadeParams,
} from '../types';
import { z } from 'zod';

// Schema for ID validation
const idSchema = z.object({
  id: z.number().int().positive('ID deve ser um número positivo'),
});

// Schema for criar endereco
const criarEnderecoSchema = z.object({
  entidade_tipo: z.enum(['cliente', 'parte_contraria', 'terceiro']),
  entidade_id: z.number().int().positive(),
  municipio: z.string().min(1, 'Município é obrigatório'),
  estado: z.string().min(2, 'Estado é obrigatório'),
  cep: z.string().min(8, 'CEP deve ter 8 dígitos'),
}) as z.ZodType<CriarEnderecoParams>;

// Schema for atualizar endereco
const atualizarEnderecoSchema = z.object({
  id: z.number().int().positive(),
}) as z.ZodType<AtualizarEnderecoParams>;

// Schema for buscar por entidade
const buscarPorEntidadeSchema = z.object({
  entidade_tipo: z.enum(['cliente', 'parte_contraria', 'terceiro']),
  entidade_id: z.number().int().positive(),
}) as z.ZodType<BuscarEnderecosPorEntidadeParams>;

// Schema for listar
const listarEnderecosSchema = z.object({
  pagina: z.number().int().positive().optional(),
  limite: z.number().int().positive().optional(),
}) as z.ZodType<ListarEnderecosParams>;

export const actionCriarEndereco = authenticatedAction(
  criarEnderecoSchema,
  async (input) => {
    const result = await service.criarEndereco(input);

    if (result.success) {
      revalidatePath('/enderecos');
    }

    return result;
  }
);

export const actionAtualizarEndereco = authenticatedAction(
  atualizarEnderecoSchema,
  async (input) => {
    const result = await service.atualizarEndereco(input);

    if (result.success) {
      revalidatePath('/enderecos');
    }

    return result;
  }
);

export const actionBuscarEnderecoPorId = authenticatedAction(
  idSchema,
  async (input) => {
    return service.buscarEnderecoPorId(input.id);
  }
);

export const actionBuscarEnderecosPorEntidade = authenticatedAction(
  buscarPorEntidadeSchema,
  async (input) => {
    return service.buscarEnderecosPorEntidade(input);
  }
);

export const actionListarEnderecos = authenticatedAction(
  listarEnderecosSchema,
  async (input) => {
    return service.listarEnderecos(input);
  }
);

export const actionDeletarEndereco = authenticatedAction(
  idSchema,
  async (input) => {
    const result = await service.deletarEndereco(input.id);

    if (result.success) {
      revalidatePath('/enderecos');
    }

    return result;
  }
);
