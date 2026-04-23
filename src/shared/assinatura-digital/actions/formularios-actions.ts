'use server';

import { authenticateRequest } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/authorization';

// Helper para lidar com erros
const handleError = (error: unknown) => {
  console.error('AssinaturaDigital Action Error:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Um erro inesperado ocorreu.',
  };
};

export async function listarFormulariosAction(filtros?: {
  segmento_id?: number;
  ativo?: boolean;
}) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'listar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para listar formulários.' };
    }

    const { listFormularios } = await import('../services/formularios.service');
    const result = await listFormularios(filtros);
    return { success: true, data: result.formularios };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Busca formulários que referenciam um template específico pelo UUID.
 * Usado pela UI de edição de templates para avisar o admin antes de desativar
 * ou excluir um template que está em uso em um ou mais formulários.
 */
export async function listarFormulariosQueUsamTemplateAction(templateUuid: string) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false as const, error: 'Usuário não autenticado.' };
    }

    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'listar');
    if (!hasPermission) {
      return { success: false as const, error: 'Sem permissão para listar formulários.' };
    }

    if (typeof templateUuid !== 'string' || templateUuid.length === 0) {
      return { success: false as const, error: 'UUID de template inválido.' };
    }

    const { findFormulariosUsandoTemplate } = await import('../services/formularios.service');
    const data = await findFormulariosUsandoTemplate(templateUuid);
    return { success: true as const, data };
  } catch (error) {
    console.error('AssinaturaDigital Action Error:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Um erro inesperado ocorreu.',
    };
  }
}
