'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './utils';
import * as service from '../service';
import { 
  Assistente, 
  AssistentesParams, 
  PaginacaoResult 
} from '../types';

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function actionListarAssistentes(params: AssistentesParams): Promise<ActionResponse<PaginacaoResult<Assistente>>> {
  try {
    await requireAuth(['assistentes:listar']);
    const result = await service.listarAssistentes(params);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao listar assistentes' 
    };
  }
}

export async function actionBuscarAssistente(id: number): Promise<ActionResponse<Assistente>> {
  try {
    await requireAuth(['assistentes:listar']);
    const assistente = await service.buscarAssistentePorId(id);
    if (!assistente) {
      return { success: false, error: 'Assistente não encontrado' };
    }
    return { success: true, data: assistente };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao buscar assistente' 
    };
  }
}

export async function actionCriarAssistente(formData: FormData): Promise<ActionResponse<Assistente>> {
  try {
    const { userId } = await requireAuth(['assistentes:criar']);
    
    // Extract data from FormData
    const data = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao'),
      iframe_code: formData.get('iframe_code'),
    };

    const assistente = await service.criarAssistente(data, userId);
    
    revalidatePath('/assistentes');
    return { success: true, data: assistente };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao criar assistente' 
    };
  }
}

export async function actionAtualizarAssistente(id: number, formData: FormData): Promise<ActionResponse<Assistente>> {
  try {
    await requireAuth(['assistentes:criar']); // Assuming 'criar' implies edit or there is no specific edit permission. Plan mentioned 'assistentes:editar' usually but here I see 'assistentes.criar' in legacy route. 
    // Wait, typically it's 'assistentes:editar'. 
    // Checking legacy `backend/assistentes/services/assistente-persistence.service.ts` doesn't enforce perm, `route.ts` did `requirePermission(request, 'assistentes', 'criar')` for POST.
    // Is there an Update route?
    // I need to check if there was a PUT or PATCH route.
    
    const data: Record<string, any> = {};
    if (formData.has('nome')) data.nome = formData.get('nome');
    if (formData.has('descricao')) data.descricao = formData.get('descricao');
    if (formData.has('iframe_code')) data.iframe_code = formData.get('iframe_code');
    if (formData.has('ativo')) data.ativo = formData.get('ativo') === 'true';

    const assistente = await service.atualizarAssistente(id, data);
    
    revalidatePath('/assistentes');
    return { success: true, data: assistente };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar assistente' 
    };
  }
}

export async function actionDeletarAssistente(id: number): Promise<ActionResponse<boolean>> {
  try {
    await requireAuth(['assistentes:criar']); // Assuming admin permission
    await service.deletarAssistente(id);
    revalidatePath('/assistentes');
    return { success: true, data: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao deletar assistente' 
    };
  }
}
