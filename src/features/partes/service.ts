/**
 * PARTES SERVICE - Camada de Regras de Negocio (Casos de Uso)
 *
 * Este arquivo contem a logica de negocio para Clientes, Partes Contrarias e Terceiros.
 *
 * CONVENCOES:
 * - Funcoes nomeadas como acoes: criar, atualizar, listar, buscar, remover
 * - Sempre validar input antes de processar
 * - Retornar Result<T> para permitir tratamento de erros
 * - NUNCA acessar banco diretamente (usar repositorio)
 * - NUNCA importar React/Next.js aqui
 */

import { Result, ok, err, appError, PaginatedResponse } from '@/lib/types';
import {
  type Cliente,
  type ParteContraria,
  type Terceiro,
  type CreateClienteInput,
  type UpdateClienteInput,
  type ListarClientesParams,
  type CreateParteContrariaInput,
  type UpdateParteContrariaInput,
  type ListarPartesContrariasParams,
  type CreateTerceiroInput,
  type UpdateTerceiroInput,
  type ListarTerceirosParams,
  createClienteSchema,
  updateClienteSchema,
  createParteContrariaSchema,
  updateParteContrariaSchema,
  createTerceiroSchema,
  updateTerceiroSchema,
  normalizarDocumento,
} from './domain';
import {
  findClienteById,
  findClienteByCPF,
  findClienteByCNPJ,
  findClientesByNome,
  findAllClientes,
  findAllClientesComEndereco,
  findAllClientesComEnderecoEProcessos,
  saveCliente,
  updateCliente as updateClienteRepo,
  upsertClienteByCPF,
  upsertClienteByCNPJ,
  softDeleteCliente,
  findParteContrariaById,
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  findAllPartesContrarias,
  findAllPartesContrariasComEnderecoEProcessos,
  saveParteContraria,
  updateParteContraria as updateParteContrariaRepo,
  findTerceiroById,
  findTerceiroByCPF,
  findTerceiroByCNPJ,
  findAllTerceiros,
  saveTerceiro,
  updateTerceiro as updateTerceiroRepo,
} from './repository';
import type {
  ClienteComEndereco,
  ClienteComEnderecoEProcessos,
  ParteContrariaComEnderecoEProcessos,
} from './domain';
import {
  clienteCpfDuplicadoError,
  clienteCnpjDuplicadoError,
  clienteNaoEncontradoError,
  toAppError,
} from './errors';

// =============================================================================
// SERVICOS - CLIENTE
// =============================================================================

/**
 * Cria um novo cliente
 *
 * Regras de negocio:
 * - Nome e obrigatorio (min 1 char)
 * - CPF obrigatorio para PF (11 digitos)
 * - CNPJ obrigatorio para PJ (14 digitos)
 * - Verifica duplicidade antes de criar
 */
export async function criarCliente(input: CreateClienteInput): Promise<Result<Cliente>> {
  // 1. Validar input com Zod
  const validation = createClienteSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }

  const dadosValidados = validation.data;

  // 2. Verificar duplicidade de documento (usando erros customizados)
  if (dadosValidados.tipo_pessoa === 'pf') {
    const existingResult = await findClienteByCPF(dadosValidados.cpf);
    if (!existingResult.success) {
      return err(existingResult.error);
    }
    if (existingResult.data) {
      return err(toAppError(clienteCpfDuplicadoError(dadosValidados.cpf, existingResult.data.id)));
    }
  } else {
    const existingResult = await findClienteByCNPJ(dadosValidados.cnpj);
    if (!existingResult.success) {
      return err(existingResult.error);
    }
    if (existingResult.data) {
      return err(toAppError(clienteCnpjDuplicadoError(dadosValidados.cnpj, existingResult.data.id)));
    }
  }

  // 3. Persistir via repositorio
  return saveCliente(dadosValidados);
}

/**
 * Busca um cliente pelo ID
 *
 * Retorna null se nao encontrar (nao e erro)
 */
export async function buscarCliente(id: number): Promise<Result<Cliente | null>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  return findClienteById(id);
}

/**
 * Busca um cliente pelo documento (CPF ou CNPJ)
 * Detecta automaticamente o tipo pelo tamanho
 */
export async function buscarClientePorDocumento(documento: string): Promise<Result<Cliente | null>> {
  if (!documento?.trim()) {
    return err(appError('VALIDATION_ERROR', 'Documento e obrigatorio'));
  }

  const docNormalizado = normalizarDocumento(documento);

  if (docNormalizado.length === 11) {
    return findClienteByCPF(docNormalizado);
  } else if (docNormalizado.length === 14) {
    return findClienteByCNPJ(docNormalizado);
  } else {
    return err(appError('VALIDATION_ERROR', 'Documento deve ter 11 (CPF) ou 14 (CNPJ) digitos'));
  }
}

/**
 * Busca clientes pelo nome (busca parcial)
 */
export async function buscarClientesPorNome(
  nome: string,
  limite: number = 100
): Promise<Result<Cliente[]>> {
  if (!nome?.trim()) {
    return ok([]);
  }

  // Limitar resultado para evitar sobrecarga
  const limiteSeguro = Math.min(limite, 100);

  return findClientesByNome(nome, limiteSeguro);
}

/**
 * Lista clientes com filtros e paginacao
 *
 * Parametros especiais:
 * - incluir_endereco: se true, inclui dados de endereco via JOIN
 * - incluir_processos: se true, inclui lista de processos relacionados
 */
export async function listarClientes(
  params: ListarClientesParams = {}
): Promise<Result<PaginatedResponse<Cliente | ClienteComEndereco | ClienteComEnderecoEProcessos>>> {
  // Sanitizar parametros de paginacao
  const sanitizedParams: ListarClientesParams = {
    ...params,
    pagina: Math.max(1, params.pagina ?? 1),
    limite: Math.min(100, Math.max(1, params.limite ?? 50)),
  };

  // Selecionar funcao de repositorio baseada nos parametros de relacionamento
  if (sanitizedParams.incluir_processos) {
    // Incluir processos implica incluir endereco
    return findAllClientesComEnderecoEProcessos(sanitizedParams);
  }

  if (sanitizedParams.incluir_endereco) {
    return findAllClientesComEndereco(sanitizedParams);
  }

  return findAllClientes(sanitizedParams);
}

/**
 * Atualiza um cliente existente
 *
 * Regras de negocio:
 * - Cliente precisa existir
 * - Nao permite alterar tipo_pessoa (PF <-> PJ)
 * - Se alterar CPF/CNPJ, verifica duplicidade
 */
export async function atualizarCliente(
  id: number,
  input: UpdateClienteInput
): Promise<Result<Cliente>> {
  // 1. Validar ID
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  // 2. Validar input com Zod
  const validation = updateClienteSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }

  // 3. Verificar se ha algo para atualizar
  const dadosValidados = validation.data;
  if (Object.keys(dadosValidados).length === 0) {
    return err(appError('VALIDATION_ERROR', 'Nenhum campo para atualizar'));
  }

  // 4. Verificar se cliente existe (usando erro customizado)
  const existingResult = await findClienteById(id);
  if (!existingResult.success) {
    return existingResult;
  }
  if (!existingResult.data) {
    return err(toAppError(clienteNaoEncontradoError(id)));
  }

  const clienteExistente = existingResult.data;

  // 5. Verificar se esta tentando alterar CPF/CNPJ para um que ja existe (usando erros customizados)
  if (dadosValidados.cpf && dadosValidados.cpf !== clienteExistente.cpf) {
    const duplicateResult = await findClienteByCPF(dadosValidados.cpf);
    if (duplicateResult.success && duplicateResult.data && duplicateResult.data.id !== id) {
      return err(toAppError(clienteCpfDuplicadoError(dadosValidados.cpf, duplicateResult.data.id)));
    }
  }

  if (dadosValidados.cnpj && dadosValidados.cnpj !== clienteExistente.cnpj) {
    const duplicateResult = await findClienteByCNPJ(dadosValidados.cnpj);
    if (duplicateResult.success && duplicateResult.data && duplicateResult.data.id !== id) {
      return err(toAppError(clienteCnpjDuplicadoError(dadosValidados.cnpj, duplicateResult.data.id)));
    }
  }

  // 6. Atualizar via repositorio (preservando estado anterior)
  return updateClienteRepo(id, dadosValidados, clienteExistente);
}

/**
 * Upsert de cliente por documento
 * Cria se nao existir, atualiza se existir
 */
export async function upsertCliente(
  input: CreateClienteInput
): Promise<Result<{ cliente: Cliente; created: boolean }>> {
  // 1. Validar input
  const validation = createClienteSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }

  const dadosValidados = validation.data;

  // 2. Fazer upsert baseado no tipo de documento
  if (dadosValidados.tipo_pessoa === 'pf') {
    return upsertClienteByCPF(dadosValidados.cpf, dadosValidados);
  } else {
    return upsertClienteByCNPJ(dadosValidados.cnpj, dadosValidados);
  }
}

/**
 * Desativa um cliente (soft delete)
 */
export async function desativarCliente(id: number): Promise<Result<void>> {
  // 1. Validar ID
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  // 2. Verificar se cliente existe
  const existingResult = await findClienteById(id);
  if (!existingResult.success) {
    return existingResult;
  }
  if (!existingResult.data) {
    return err(appError('NOT_FOUND', `Cliente com ID ${id} nao encontrado`));
  }

  // 3. Desativar via repositorio
  return softDeleteCliente(id);
}

// =============================================================================
// SERVICOS - PARTE CONTRARIA
// =============================================================================

/**
 * Cria uma nova parte contraria
 */
export async function criarParteContraria(
  input: CreateParteContrariaInput
): Promise<Result<ParteContraria>> {
  // 1. Validar input com Zod
  const validation = createParteContrariaSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }

  const dadosValidados = validation.data;

  // 2. Verificar duplicidade de documento
  if (dadosValidados.tipo_pessoa === 'pf') {
    const existingResult = await findParteContrariaByCPF(dadosValidados.cpf);
    if (!existingResult.success) {
      return err(existingResult.error);
    }
    if (existingResult.data) {
      return err(
        appError('CONFLICT', 'Parte contraria com este CPF ja cadastrada', {
          field: 'cpf',
          existingId: existingResult.data.id,
        })
      );
    }
  } else {
    const existingResult = await findParteContrariaByCNPJ(dadosValidados.cnpj);
    if (!existingResult.success) {
      return err(existingResult.error);
    }
    if (existingResult.data) {
      return err(
        appError('CONFLICT', 'Parte contraria com este CNPJ ja cadastrada', {
          field: 'cnpj',
          existingId: existingResult.data.id,
        })
      );
    }
  }

  // 3. Persistir via repositorio
  return saveParteContraria(dadosValidados);
}

/**
 * Busca uma parte contraria pelo ID
 */
export async function buscarParteContraria(id: number): Promise<Result<ParteContraria | null>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  return findParteContrariaById(id);
}

/**
 * Busca uma parte contraria pelo documento
 */
export async function buscarParteContrariaPorDocumento(
  documento: string
): Promise<Result<ParteContraria | null>> {
  if (!documento?.trim()) {
    return err(appError('VALIDATION_ERROR', 'Documento e obrigatorio'));
  }

  const docNormalizado = normalizarDocumento(documento);

  if (docNormalizado.length === 11) {
    return findParteContrariaByCPF(docNormalizado);
  } else if (docNormalizado.length === 14) {
    return findParteContrariaByCNPJ(docNormalizado);
  } else {
    return err(appError('VALIDATION_ERROR', 'Documento deve ter 11 (CPF) ou 14 (CNPJ) digitos'));
  }
}

/**
 * Lista partes contrarias com filtros e paginacao
 *
 * Parametros especiais:
 * - incluir_endereco: se true, inclui dados de endereco via JOIN
 * - incluir_processos: se true, inclui lista de processos relacionados
 */
export async function listarPartesContrarias(
  params: ListarPartesContrariasParams = {}
): Promise<Result<PaginatedResponse<ParteContraria | ParteContrariaComEnderecoEProcessos>>> {
  const sanitizedParams: ListarPartesContrariasParams = {
    ...params,
    pagina: Math.max(1, params.pagina ?? 1),
    limite: Math.min(100, Math.max(1, params.limite ?? 50)),
  };

  // Se incluir_processos estiver ativo, usar função com JOINs
  if (sanitizedParams.incluir_processos || sanitizedParams.incluir_endereco) {
    return findAllPartesContrariasComEnderecoEProcessos(sanitizedParams);
  }

  return findAllPartesContrarias(sanitizedParams);
}

/**
 * Atualiza uma parte contraria existente
 */
export async function atualizarParteContraria(
  id: number,
  input: UpdateParteContrariaInput
): Promise<Result<ParteContraria>> {
  // 1. Validar ID
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  // 2. Validar input com Zod
  const validation = updateParteContrariaSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }

  const dadosValidados = validation.data;
  if (Object.keys(dadosValidados).length === 0) {
    return err(appError('VALIDATION_ERROR', 'Nenhum campo para atualizar'));
  }

  // 3. Verificar se parte contraria existe
  const existingResult = await findParteContrariaById(id);
  if (!existingResult.success) {
    return existingResult;
  }
  if (!existingResult.data) {
    return err(appError('NOT_FOUND', `Parte contraria com ID ${id} nao encontrada`));
  }

  const parteExistente = existingResult.data;

  // 4. Verificar duplicidade se alterando documento
  if (dadosValidados.cpf && dadosValidados.cpf !== parteExistente.cpf) {
    const duplicateResult = await findParteContrariaByCPF(dadosValidados.cpf);
    if (duplicateResult.success && duplicateResult.data && duplicateResult.data.id !== id) {
      return err(
        appError('CONFLICT', 'Outra parte contraria com este CPF ja cadastrada', {
          field: 'cpf',
          existingId: duplicateResult.data.id,
        })
      );
    }
  }

  if (dadosValidados.cnpj && dadosValidados.cnpj !== parteExistente.cnpj) {
    const duplicateResult = await findParteContrariaByCNPJ(dadosValidados.cnpj);
    if (duplicateResult.success && duplicateResult.data && duplicateResult.data.id !== id) {
      return err(
        appError('CONFLICT', 'Outra parte contraria com este CNPJ ja cadastrada', {
          field: 'cnpj',
          existingId: duplicateResult.data.id,
        })
      );
    }
  }

  // 5. Atualizar via repositorio
  return updateParteContrariaRepo(id, dadosValidados, parteExistente);
}

// =============================================================================
// SERVICOS - TERCEIRO
// =============================================================================

/**
 * Cria um novo terceiro
 */
export async function criarTerceiro(input: CreateTerceiroInput): Promise<Result<Terceiro>> {
  // 1. Validar input com Zod
  const validation = createTerceiroSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }

  const dadosValidados = validation.data;

  // 2. Verificar duplicidade de documento
  if (dadosValidados.tipo_pessoa === 'pf') {
    const existingResult = await findTerceiroByCPF(dadosValidados.cpf);
    if (!existingResult.success) {
      return err(existingResult.error);
    }
    if (existingResult.data) {
      return err(
        appError('CONFLICT', 'Terceiro com este CPF ja cadastrado', {
          field: 'cpf',
          existingId: existingResult.data.id,
        })
      );
    }
  } else {
    const existingResult = await findTerceiroByCNPJ(dadosValidados.cnpj);
    if (!existingResult.success) {
      return err(existingResult.error);
    }
    if (existingResult.data) {
      return err(
        appError('CONFLICT', 'Terceiro com este CNPJ ja cadastrado', {
          field: 'cnpj',
          existingId: existingResult.data.id,
        })
      );
    }
  }

  // 3. Persistir via repositorio
  return saveTerceiro(dadosValidados);
}

/**
 * Busca um terceiro pelo ID
 */
export async function buscarTerceiro(id: number): Promise<Result<Terceiro | null>> {
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  return findTerceiroById(id);
}

/**
 * Busca um terceiro pelo documento
 */
export async function buscarTerceiroPorDocumento(documento: string): Promise<Result<Terceiro | null>> {
  if (!documento?.trim()) {
    return err(appError('VALIDATION_ERROR', 'Documento e obrigatorio'));
  }

  const docNormalizado = normalizarDocumento(documento);

  if (docNormalizado.length === 11) {
    return findTerceiroByCPF(docNormalizado);
  } else if (docNormalizado.length === 14) {
    return findTerceiroByCNPJ(docNormalizado);
  } else {
    return err(appError('VALIDATION_ERROR', 'Documento deve ter 11 (CPF) ou 14 (CNPJ) digitos'));
  }
}

/**
 * Lista terceiros com filtros e paginacao
 */
export async function listarTerceiros(
  params: ListarTerceirosParams = {}
): Promise<Result<PaginatedResponse<Terceiro>>> {
  const sanitizedParams: ListarTerceirosParams = {
    ...params,
    pagina: Math.max(1, params.pagina ?? 1),
    limite: Math.min(100, Math.max(1, params.limite ?? 50)),
  };

  return findAllTerceiros(sanitizedParams);
}

/**
 * Atualiza um terceiro existente
 */
export async function atualizarTerceiro(
  id: number,
  input: UpdateTerceiroInput
): Promise<Result<Terceiro>> {
  // 1. Validar ID
  if (!id || id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID invalido'));
  }

  // 2. Validar input com Zod
  const validation = updateTerceiroSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError('VALIDATION_ERROR', firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      })
    );
  }

  const dadosValidados = validation.data;
  if (Object.keys(dadosValidados).length === 0) {
    return err(appError('VALIDATION_ERROR', 'Nenhum campo para atualizar'));
  }

  // 3. Verificar se terceiro existe
  const existingResult = await findTerceiroById(id);
  if (!existingResult.success) {
    return existingResult;
  }
  if (!existingResult.data) {
    return err(appError('NOT_FOUND', `Terceiro com ID ${id} nao encontrado`));
  }

  const terceiroExistente = existingResult.data;

  // 4. Verificar duplicidade se alterando documento
  if (dadosValidados.cpf && dadosValidados.cpf !== terceiroExistente.cpf) {
    const duplicateResult = await findTerceiroByCPF(dadosValidados.cpf);
    if (duplicateResult.success && duplicateResult.data && duplicateResult.data.id !== id) {
      return err(
        appError('CONFLICT', 'Outro terceiro com este CPF ja cadastrado', {
          field: 'cpf',
          existingId: duplicateResult.data.id,
        })
      );
    }
  }

  if (dadosValidados.cnpj && dadosValidados.cnpj !== terceiroExistente.cnpj) {
    const duplicateResult = await findTerceiroByCNPJ(dadosValidados.cnpj);
    if (duplicateResult.success && duplicateResult.data && duplicateResult.data.id !== id) {
      return err(
        appError('CONFLICT', 'Outro terceiro com este CNPJ ja cadastrado', {
          field: 'cnpj',
          existingId: duplicateResult.data.id,
        })
      );
    }
  }

  // 5. Atualizar via repositorio
  return updateTerceiroRepo(id, dadosValidados, terceiroExistente);
}
