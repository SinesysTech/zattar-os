// Serviço de criação de assistente
// Gerencia a lógica de negócio para cadastrar novos assistentes

import {
  criarAssistente as criarAssistenteDb,
  type Assistente,
} from './assistente-persistence.service';
import { sanitizarIframeCode } from '@/app/_lib/utils/format-assistentes';

// Tipos para a operação de criação
export interface CriarAssistenteData {
  nome: string;
  descricao?: string;
  iframe_code: string;
  criado_por: number;
}

export interface OperacaoAssistenteResult {
  sucesso: boolean;
  assistente?: Assistente;
  erro?: string;
}

/**
 * Cadastra um novo assistente no sistema
 * 
 * Fluxo:
 * 1. Valida os dados de entrada
 * 2. Sanitiza o código do iframe se necessário
 * 3. Cria o registro no banco de dados
 * 4. Retorna o assistente criado ou erro
 */
export async function criarAssistente(
  params: CriarAssistenteData
): Promise<OperacaoAssistenteResult> {
  console.log('📝 Iniciando cadastro de assistente...', {
    nome: params.nome,
    criado_por: params.criado_por,
  });

  try {
    // Validações
    if (!params.nome || params.nome.trim().length < 1 || params.nome.length > 200) {
      return {
        sucesso: false,
        erro: 'Nome é obrigatório e deve ter entre 1 e 200 caracteres.',
      };
    }

    if (!params.iframe_code || params.iframe_code.trim() === '') {
      return {
        sucesso: false,
        erro: 'Código do iframe é obrigatório.',
      };
    }

    if (params.descricao && params.descricao.length > 1000) {
      return {
        sucesso: false,
        erro: 'Descrição deve ter no máximo 1000 caracteres.',
      };
    }

    // Sanitizar o código do iframe (remove scripts maliciosos e valida)
    let iframeCodeSanitizado: string;
    try {
      iframeCodeSanitizado = sanitizarIframeCode(params.iframe_code);
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Código do iframe inválido.',
      };
    }

    const resultado = await criarAssistenteDb({
      ...params,
      nome: params.nome.trim(),
      descricao: params.descricao?.trim(),
      iframe_code: iframeCodeSanitizado,
    });

    if (resultado.sucesso && resultado.assistente) {
      console.log('✅ Assistente cadastrado com sucesso:', {
        id: resultado.assistente.id,
        nome: resultado.assistente.nome,
      });
    } else {
      console.error('❌ Erro ao cadastrar assistente:', resultado.erro);
    }

    return resultado;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao cadastrar assistente:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}