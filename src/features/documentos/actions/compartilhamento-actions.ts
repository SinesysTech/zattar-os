'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';
import * as service from '../service';
import { CompartilharDocumentoParams } from '../types';

export async function actionCompartilharDocumento(formData: FormData) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const params: CompartilharDocumentoParams = {
      documento_id: parseInt(formData.get('documento_id') as string),
      usuario_id: parseInt(formData.get('usuario_id') as string),
      permissao: formData.get('permissao') as 'visualizar' | 'editar',
      pode_deletar: formData.get('pode_deletar') === 'true',
    };

    const compartilhamento = await service.compartilharDocumento(params, user.id);
    revalidatePath(`/documentos/${params.documento_id}`);
    return { success: true, data: compartilhamento };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionListarCompartilhamentos(documento_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const compartilhamentos = await service.listarCompartilhamentos(documento_id, user.id);
    return { success: true, data: compartilhamentos };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarPermissao(compartilhamento_id: number, permissao: string) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const updatedCompartilhamento = await service.atualizarPermissao(
      compartilhamento_id,
      permissao,
      user.id
    );
    revalidatePath(`/documentos/${updatedCompartilhamento.documento_id}`);
    return { success: true, data: updatedCompartilhamento };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionRemoverCompartilhamento(compartilhamento_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    await service.removerCompartilhamento(compartilhamento_id, user.id);
    revalidatePath('/documentos'); // Revalidar documentos pois um compartilhamento pode ter sido removido
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// NOTE: Ação para listar documentos COMPARTILHADOS com o usuário.
// Não existe um serviço dedicado para isso no service.ts ainda,
// mas a função `repository.listarDocumentosCompartilhadosComUsuario` pode ser usada.
export async function actionListarDocumentosCompartilhados() {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const documentos = await service.listarDocumentos({ incluir_deletados: false, criado_por: user.id }, user.id); // Placeholder, deve ser substituído por algo que lista documentos onde o usuário é o destinatário de compartilhamento
    // TODO: Criar um método no service que liste documentos compartilhados COM o usuário.
    // Por enquanto, esta ação é um placeholder.
    return { success: true, data: documentos.documentos };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
