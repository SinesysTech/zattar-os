'use server';

/**
 * Server Actions para o módulo de Partes (Clientes, Partes Contrárias, Terceiros)
 *
 * Camada de adaptação entre UI e Core, implementando:
 * - Conversão de FormData para objetos tipados
 * - Validação com Zod schemas do domain
 * - Chamadas aos serviços do core
 * - Revalidação de cache via revalidatePath
 */

import { revalidatePath } from 'next/cache';
import {
  type CreateClienteInput,
  type UpdateClienteInput,
  type ListarClientesParams,
  type CreateParteContrariaInput,
  type UpdateParteContrariaInput,
  type ListarPartesContrariasParams,
  createClienteSchema,
  updateClienteSchema,
  createParteContrariaSchema,
  updateParteContrariaSchema,
} from '@/core/partes/domain';
import {
  criarCliente,
  atualizarCliente,
  listarClientes,
  criarParteContraria,
  atualizarParteContraria,
  listarPartesContrarias,
} from '@/core/partes/service';

// =============================================================================
// TIPOS DE RETORNO DAS ACTIONS
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Converte erros do Zod para formato de errors por campo
 */
function formatZodErrors(zodError: { errors: Array<{ path: (string | number)[]; message: string }> }): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const err of zodError.errors) {
    const key = err.path.join('.');
    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(err.message);
  }
  return errors;
}

/**
 * Extrai array de emails do FormData
 */
function extractEmails(formData: FormData): string[] | null {
  const emails: string[] = [];
  // Verifica emails em formato array (emails[0], emails[1], etc)
  let index = 0;
  while (formData.has(`emails[${index}]`)) {
    const email = formData.get(`emails[${index}]`);
    if (email && typeof email === 'string' && email.trim()) {
      emails.push(email.trim());
    }
    index++;
  }
  // Também verifica formato simples 'emails' como string JSON
  const emailsRaw = formData.get('emails');
  if (emailsRaw && typeof emailsRaw === 'string') {
    try {
      const parsed = JSON.parse(emailsRaw);
      if (Array.isArray(parsed)) {
        emails.push(...parsed.filter((e: unknown) => typeof e === 'string' && e.trim()));
      }
    } catch {
      // Se não for JSON, trata como email único
      if (emailsRaw.includes('@')) {
        emails.push(emailsRaw.trim());
      }
    }
  }
  return emails.length > 0 ? emails : null;
}

/**
 * Converte FormData para objeto de criação de Cliente
 */
function formDataToCreateClienteInput(formData: FormData): Record<string, unknown> {
  const tipo_pessoa = formData.get('tipo_pessoa') as 'pf' | 'pj';

  const base: Record<string, unknown> = {
    tipo_pessoa,
    nome: formData.get('nome')?.toString().trim() || '',
    nome_social_fantasia: formData.get('nome_social_fantasia')?.toString().trim() || null,
    emails: extractEmails(formData),
    ddd_celular: formData.get('ddd_celular')?.toString() || null,
    numero_celular: formData.get('numero_celular')?.toString() || null,
    ddd_residencial: formData.get('ddd_residencial')?.toString() || null,
    numero_residencial: formData.get('numero_residencial')?.toString() || null,
    ddd_comercial: formData.get('ddd_comercial')?.toString() || null,
    numero_comercial: formData.get('numero_comercial')?.toString() || null,
    observacoes: formData.get('observacoes')?.toString().trim() || null,
    ativo: formData.get('ativo') !== 'false',
  };

  if (tipo_pessoa === 'pf') {
    return {
      ...base,
      cpf: formData.get('cpf')?.toString().replace(/\D/g, '') || '',
      rg: formData.get('rg')?.toString().trim() || null,
      data_nascimento: formData.get('data_nascimento')?.toString() || null,
      genero: formData.get('genero')?.toString() || null,
      estado_civil: formData.get('estado_civil')?.toString() || null,
      nacionalidade: formData.get('nacionalidade')?.toString().trim() || null,
      nome_genitora: formData.get('nome_genitora')?.toString().trim() || null,
    };
  } else {
    return {
      ...base,
      cnpj: formData.get('cnpj')?.toString().replace(/\D/g, '') || '',
      inscricao_estadual: formData.get('inscricao_estadual')?.toString().trim() || null,
      data_abertura: formData.get('data_abertura')?.toString() || null,
    };
  }
}

/**
 * Converte FormData para objeto de atualização de Cliente
 */
function formDataToUpdateClienteInput(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Campos opcionais - só inclui se presente no FormData
  const fields = [
    'nome', 'nome_social_fantasia', 'cpf', 'cnpj', 'rg',
    'data_nascimento', 'data_abertura', 'genero', 'estado_civil',
    'nacionalidade', 'nome_genitora', 'inscricao_estadual',
    'ddd_celular', 'numero_celular', 'ddd_residencial', 'numero_residencial',
    'ddd_comercial', 'numero_comercial', 'observacoes'
  ];

  for (const field of fields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      if (field === 'cpf' || field === 'cnpj') {
        data[field] = value?.replace(/\D/g, '') || null;
      } else {
        data[field] = value?.trim() || null;
      }
    }
  }

  // Emails
  const emails = extractEmails(formData);
  if (emails !== null || formData.has('emails')) {
    data.emails = emails;
  }

  // Ativo
  if (formData.has('ativo')) {
    data.ativo = formData.get('ativo') !== 'false';
  }

  return data;
}

// =============================================================================
// SERVER ACTIONS - CLIENTE
// =============================================================================

/**
 * Action para criar um novo cliente
 */
export async function actionCriarCliente(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // 1. Converter FormData para objeto
    const rawData = formDataToCreateClienteInput(formData);

    // 2. Validar com Zod
    const validation = createClienteSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validação',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados inválidos',
      };
    }

    // 3. Chamar serviço do core
    const result = await criarCliente(validation.data as CreateClienteInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // 4. Revalidar cache
    revalidatePath('/partes/clientes');
    revalidatePath('/partes');

    return {
      success: true,
      data: result.data,
      message: 'Cliente criado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao criar cliente. Tente novamente.',
    };
  }
}

/**
 * Action para atualizar um cliente existente
 */
export async function actionAtualizarCliente(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // 1. Validar ID
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID inválido',
        message: 'ID do cliente é obrigatório',
      };
    }

    // 2. Converter FormData para objeto
    const rawData = formDataToUpdateClienteInput(formData);

    // 3. Validar com Zod
    const validation = updateClienteSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validação',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados inválidos',
      };
    }

    // 4. Chamar serviço do core
    const result = await atualizarCliente(id, validation.data as UpdateClienteInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // 5. Revalidar cache
    revalidatePath('/partes/clientes');
    revalidatePath(`/partes/clientes/${id}`);
    revalidatePath('/partes');

    return {
      success: true,
      data: result.data,
      message: 'Cliente atualizado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao atualizar cliente. Tente novamente.',
    };
  }
}

/**
 * Action para listar clientes (refresh manual)
 */
export async function actionListarClientes(
  params?: ListarClientesParams
): Promise<ActionResult> {
  try {
    const result = await listarClientes(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Clientes carregados com sucesso',
    };
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar clientes. Tente novamente.',
    };
  }
}

// =============================================================================
// SERVER ACTIONS - PARTE CONTRÁRIA
// =============================================================================

/**
 * Converte FormData para objeto de criação de Parte Contrária
 */
function formDataToCreateParteContrariaInput(formData: FormData): Record<string, unknown> {
  // Reutiliza a mesma lógica de cliente (estrutura idêntica)
  return formDataToCreateClienteInput(formData);
}

/**
 * Action para criar uma nova parte contrária
 */
export async function actionCriarParteContraria(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = formDataToCreateParteContrariaInput(formData);
    const validation = createParteContrariaSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validação',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados inválidos',
      };
    }

    const result = await criarParteContraria(validation.data as CreateParteContrariaInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath('/partes/partes-contrarias');
    revalidatePath('/partes');

    return {
      success: true,
      data: result.data,
      message: 'Parte contrária criada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao criar parte contrária:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao criar parte contrária. Tente novamente.',
    };
  }
}

/**
 * Action para atualizar uma parte contrária
 */
export async function actionAtualizarParteContraria(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID inválido',
        message: 'ID da parte contrária é obrigatório',
      };
    }

    const rawData = formDataToUpdateClienteInput(formData);
    const validation = updateParteContrariaSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validação',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados inválidos',
      };
    }

    const result = await atualizarParteContraria(id, validation.data as UpdateParteContrariaInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath('/partes/partes-contrarias');
    revalidatePath(`/partes/partes-contrarias/${id}`);
    revalidatePath('/partes');

    return {
      success: true,
      data: result.data,
      message: 'Parte contrária atualizada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar parte contrária:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao atualizar parte contrária. Tente novamente.',
    };
  }
}

/**
 * Action para listar partes contrárias
 */
export async function actionListarPartesContrarias(
  params?: ListarPartesContrariasParams
): Promise<ActionResult> {
  try {
    const result = await listarPartesContrarias(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Partes contrárias carregadas com sucesso',
    };
  } catch (error) {
    console.error('Erro ao listar partes contrárias:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar partes contrárias. Tente novamente.',
    };
  }
}
