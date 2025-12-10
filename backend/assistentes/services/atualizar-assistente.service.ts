// Serviço de atualização de assistente
// Gerencia a lógica de negócio para atualizar assistentes existentes

import {
  atualizarAssistente as atualizarAssistenteDb,
  type AtualizarAssistenteData,
  type OperacaoAssistenteResult,
} from './assistente-persistence.service';
import { sanitizarIframeCode } from '@/core/app/_lib/utils/format-assistentes';

/**
 * Atualiza um assistente existente
 * 
 * Fluxo:
 * 1. Valida os dados fornecidos
 * 2. Verifica se o assistente existe (feito na persistência)
 * 3. Atualiza o registro no banco de dados
 * 4. Retorna o assistente atualizado ou erro
 */
export async function atualizarAssistente(
  id: number,
  params: AtualizarAssistenteData
): Promise<OperacaoAssistenteResult> {
  console.log('📝 Atualizando assistente...', { id, campos: Object.keys(params) });

  try {
    // Validações dos campos fornecidos
    if (params.nome !== undefined) {
      if (typeof params.nome !== 'string' || params.nome.trim().length < 1 || params.nome.trim().length > 200) {
        return { sucesso: false, erro: 'Nome deve ter entre 1 e 200 caracteres' };
      }
    }

    if (params.descricao !== undefined) {
      if (typeof params.descricao !== 'string' || params.descricao.length > 1000) {
        return { sucesso: false, erro: 'Descrição deve ter no máximo 1000 caracteres' };
      }
    }

    // Sanitizar o código do iframe se fornecido
    let iframeCodeSanitizado: string | undefined;
    if (params.iframe_code !== undefined) {
      if (typeof params.iframe_code !== 'string' || params.iframe_code.trim().length === 0) {
        return { sucesso: false, erro: 'Código do iframe é obrigatório' };
      }
      try {
        iframeCodeSanitizado = sanitizarIframeCode(params.iframe_code);
      } catch (error) {
        return {
          sucesso: false,
          erro: error instanceof Error ? error.message : 'Código do iframe inválido.',
        };
      }
    }

    // Campo ativo é booleano, não precisa de validação adicional

    // Preparar dados para atualização com iframe sanitizado
    const dadosAtualizacao: AtualizarAssistenteData = {
      ...params,
      ...(iframeCodeSanitizado && { iframe_code: iframeCodeSanitizado }),
    };

    const resultado = await atualizarAssistenteDb(id, dadosAtualizacao);

    if (resultado.sucesso && resultado.assistente) {
      console.log('✅ Assistente atualizado com sucesso:', {
        id: resultado.assistente.id,
        nome: resultado.assistente.nome,
      });
    } else {
      console.error('❌ Erro ao atualizar assistente:', resultado.erro);
    }

    return resultado;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao atualizar assistente:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}