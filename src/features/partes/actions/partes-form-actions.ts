'use server';

/**
 * Server Actions para formularios de Partes (useActionState)
 *
 * Actions que processam FormData para uso com useActionState do React 19.
 * Para novos componentes, prefira usar as versoes *Safe com useAction.
 */

import { revalidatePath } from 'next/cache';
import {
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
} from '../domain';
import {
  criarCliente,
  atualizarCliente,
  listarClientes,
  desativarCliente,
  criarParteContraria,
  atualizarParteContraria,
  listarPartesContrarias,
  criarTerceiro,
  atualizarTerceiro,
  listarTerceiros,
} from '../service';

// =============================================================================
// TIPOS
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

// =============================================================================
// HELPERS
// =============================================================================

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

function extractEmails(formData: FormData): string[] | null {
  const emails: string[] = [];
  let index = 0;
  while (formData.has(`emails[${index}]`)) {
    const email = formData.get(`emails[${index}]`);
    if (email && typeof email === 'string' && email.trim()) {
      emails.push(email.trim());
    }
    index++;
  }
  const emailsRaw = formData.get('emails');
  if (emailsRaw && typeof emailsRaw === 'string') {
    try {
      const parsed = JSON.parse(emailsRaw);
      if (Array.isArray(parsed)) {
        emails.push(...parsed.filter((e: unknown) => typeof e === 'string' && e.trim()));
      }
    } catch {
      if (emailsRaw.includes('@')) {
        emails.push(emailsRaw.trim());
      }
    }
  }
  return emails.length > 0 ? emails : null;
}

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

function formDataToUpdateClienteInput(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};
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

  const emails = extractEmails(formData);
  if (emails !== null || formData.has('emails')) {
    data.emails = emails;
  }

  if (formData.has('ativo')) {
    data.ativo = formData.get('ativo') !== 'false';
  }

  return data;
}

function formDataToCreateTerceiroInput(formData: FormData): Record<string, unknown> {
  const tipo_pessoa = formData.get('tipo_pessoa') as 'pf' | 'pj';
  const tipo_parte = formData.get('tipo_parte')?.toString() || 'OUTRO';
  const polo = formData.get('polo')?.toString() || 'TERCEIRO';

  const base: Record<string, unknown> = {
    tipo_pessoa,
    tipo_parte,
    polo,
    nome: formData.get('nome')?.toString().trim() || '',
    nome_fantasia: formData.get('nome_fantasia')?.toString().trim() || null,
    emails: extractEmails(formData),
    ddd_celular: formData.get('ddd_celular')?.toString() || null,
    numero_celular: formData.get('numero_celular')?.toString() || null,
    ddd_residencial: formData.get('ddd_residencial')?.toString() || null,
    numero_residencial: formData.get('numero_residencial')?.toString() || null,
    ddd_comercial: formData.get('ddd_comercial')?.toString() || null,
    numero_comercial: formData.get('numero_comercial')?.toString() || null,
    principal: formData.get('principal') === 'true' || null,
    autoridade: formData.get('autoridade') === 'true' || null,
    endereco_desconhecido: formData.get('endereco_desconhecido') === 'true' || null,
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
      sexo: formData.get('sexo')?.toString() || null,
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

function formDataToUpdateTerceiroInput(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const fields = [
    'nome', 'nome_fantasia', 'cpf', 'cnpj', 'rg', 'tipo_parte', 'polo',
    'data_nascimento', 'data_abertura', 'genero', 'sexo', 'estado_civil',
    'nacionalidade', 'nome_genitora', 'inscricao_estadual',
    'ddd_celular', 'numero_celular', 'ddd_residencial', 'numero_residencial',
    'ddd_comercial', 'numero_comercial', 'observacoes',
    'principal', 'autoridade', 'endereco_desconhecido'
  ];

  for (const field of fields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      if (field === 'cpf' || field === 'cnpj') {
        data[field] = value?.replace(/\D/g, '') || null;
      } else if (field === 'principal' || field === 'autoridade' || field === 'endereco_desconhecido') {
        data[field] = value === 'true' || null;
      } else {
        data[field] = value?.trim() || null;
      }
    }
  }

  const emails = extractEmails(formData);
  if (emails !== null || formData.has('emails')) {
    data.emails = emails;
  }

  if (formData.has('ativo')) {
    data.ativo = formData.get('ativo') !== 'false';
  }

  return data;
}

// =============================================================================
// SERVER ACTIONS - CLIENTE
// =============================================================================

export async function actionCriarCliente(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = formDataToCreateClienteInput(formData);
    const validation = createClienteSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validacao',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados invalidos',
      };
    }

    const result = await criarCliente(validation.data as CreateClienteInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

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

export async function actionAtualizarClienteForm(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID invalido',
        message: 'ID do cliente e obrigatorio',
      };
    }

    const rawData = formDataToUpdateClienteInput(formData);
    const validation = updateClienteSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validacao',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados invalidos',
      };
    }

    const result = await atualizarCliente(id, validation.data as UpdateClienteInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

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

export async function actionDesativarCliente(id: number): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID invalido',
        message: 'ID do cliente e obrigatorio',
      };
    }

    const result = await desativarCliente(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath('/partes/clientes');
    revalidatePath(`/partes/clientes/${id}`);
    revalidatePath('/partes');

    return {
      success: true,
      data: null,
      message: 'Cliente desativado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao desativar cliente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao desativar cliente. Tente novamente.',
    };
  }
}

// =============================================================================
// SERVER ACTIONS - PARTE CONTRARIA
// =============================================================================

export async function actionCriarParteContraria(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = formDataToCreateClienteInput(formData);
    const validation = createParteContrariaSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validacao',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados invalidos',
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
      message: 'Parte contraria criada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao criar parte contraria:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao criar parte contraria. Tente novamente.',
    };
  }
}

export async function actionAtualizarParteContraria(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID invalido',
        message: 'ID da parte contraria e obrigatorio',
      };
    }

    const rawData = formDataToUpdateClienteInput(formData);
    const validation = updateParteContrariaSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validacao',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados invalidos',
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
      message: 'Parte contraria atualizada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar parte contraria:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao atualizar parte contraria. Tente novamente.',
    };
  }
}

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
      message: 'Partes contrarias carregadas com sucesso',
    };
  } catch (error) {
    console.error('Erro ao listar partes contrarias:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar partes contrarias. Tente novamente.',
    };
  }
}

// =============================================================================
// SERVER ACTIONS - TERCEIRO
// =============================================================================

export async function actionCriarTerceiro(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = formDataToCreateTerceiroInput(formData);
    const validation = createTerceiroSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validacao',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados invalidos',
      };
    }

    const result = await criarTerceiro(validation.data as CreateTerceiroInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath('/partes/terceiros');
    revalidatePath('/partes');

    return {
      success: true,
      data: result.data,
      message: 'Terceiro criado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao criar terceiro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao criar terceiro. Tente novamente.',
    };
  }
}

export async function actionAtualizarTerceiro(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID invalido',
        message: 'ID do terceiro e obrigatorio',
      };
    }

    const rawData = formDataToUpdateTerceiroInput(formData);
    const validation = updateTerceiroSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validacao',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados invalidos',
      };
    }

    const result = await atualizarTerceiro(id, validation.data as UpdateTerceiroInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath('/partes/terceiros');
    revalidatePath(`/partes/terceiros/${id}`);
    revalidatePath('/partes');

    return {
      success: true,
      data: result.data,
      message: 'Terceiro atualizado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar terceiro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao atualizar terceiro. Tente novamente.',
    };
  }
}

export async function actionListarTerceiros(
  params?: ListarTerceirosParams
): Promise<ActionResult> {
  try {
    const result = await listarTerceiros(params);

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
      message: 'Terceiros carregados com sucesso',
    };
  } catch (error) {
    console.error('Erro ao listar terceiros:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar terceiros. Tente novamente.',
    };
  }
}
