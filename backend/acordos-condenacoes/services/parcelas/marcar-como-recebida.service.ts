// Serviço para marcar parcela como recebida/paga
// Gerencia lógica de mudança de status e atualização de repasses

import {
  buscarParcelaPorId,
  atualizarParcela,
  type Parcela,
  type StatusParcela,
} from '../persistence/parcela-persistence.service';
import {
  buscarAcordoCondenacaoPorId,
} from '../persistence/acordo-condenacao-persistence.service';

/**
 * Resultado da operação
 */
export interface MarcarParcelaResult {
  sucesso: boolean;
  parcela?: Parcela;
  erro?: string;
}

/**
 * Marca parcela como recebida (quando escritório recebe o valor)
 *
 * Fluxo:
 * 1. Buscar parcela e validar
 * 2. Atualizar status para 'recebida'
 * 3. Registrar data_efetivacao
 * 4. Se forma_distribuicao = 'integral', definir status_repasse = 'pendente_declaracao'
 * 5. Trigger atualiza status do acordo automaticamente
 *
 * @param parcelaId ID da parcela
 * @returns Resultado da operação
 */
export async function marcarComoRecebida(
  parcelaId: number
): Promise<MarcarParcelaResult> {
  console.log('📥 Marcando parcela como recebida...', { parcelaId });

  try {
    // 1. Buscar e validar parcela
    const resultadoParcela = await buscarParcelaPorId(parcelaId);
    if (!resultadoParcela.sucesso || !resultadoParcela.parcela) {
      return {
        sucesso: false,
        erro: resultadoParcela.erro || 'Parcela não encontrada',
      };
    }

    const parcela = resultadoParcela.parcela;

    // Validar se já foi recebida
    if (parcela.status === 'recebida') {
      return {
        sucesso: false,
        erro: 'Parcela já foi marcada como recebida',
      };
    }

    // Não permitir marcar como recebida se já foi paga (diferente de recebida)
    if (parcela.status === 'paga') {
      return {
        sucesso: false,
        erro: 'Parcela já foi marcada como paga',
      };
    }

    // 2. Buscar acordo para verificar forma de distribuição
    const resultadoAcordo = await buscarAcordoCondenacaoPorId(parcela.acordoCondenacaoId);
    if (!resultadoAcordo.sucesso || !resultadoAcordo.acordo) {
      return {
        sucesso: false,
        erro: 'Acordo não encontrado',
      };
    }

    const acordo = resultadoAcordo.acordo;

    // 3. Atualizar parcela
    const resultado = await atualizarParcela(parcelaId, {
      status: 'recebida',
      dataEfetivacao: new Date().toISOString(),
    });

    if (!resultado.sucesso) {
      return {
        sucesso: false,
        erro: resultado.erro || 'Erro ao atualizar parcela',
      };
    }

    // Nota: O trigger atualiza automaticamente:
    // - status_repasse para 'pendente_declaracao' se forma_distribuicao = 'integral'
    // - status do acordo baseado nas parcelas

    console.log('✅ Parcela marcada como recebida:', {
      parcelaId,
      formaDistribuicao: acordo.formaDistribuicao,
    });

    return {
      sucesso: true,
      parcela: resultado.parcela,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao marcar parcela como recebida:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Marca parcela como paga (quando escritório paga o valor)
 *
 * @param parcelaId ID da parcela
 * @returns Resultado da operação
 */
export async function marcarComoPaga(
  parcelaId: number
): Promise<MarcarParcelaResult> {
  console.log('💸 Marcando parcela como paga...', { parcelaId });

  try {
    // 1. Buscar e validar parcela
    const resultadoParcela = await buscarParcelaPorId(parcelaId);
    if (!resultadoParcela.sucesso || !resultadoParcela.parcela) {
      return {
        sucesso: false,
        erro: resultadoParcela.erro || 'Parcela não encontrada',
      };
    }

    const parcela = resultadoParcela.parcela;

    // Validar se já foi paga
    if (parcela.status === 'paga') {
      return {
        sucesso: false,
        erro: 'Parcela já foi marcada como paga',
      };
    }

    // 2. Atualizar parcela
    const resultado = await atualizarParcela(parcelaId, {
      status: 'paga',
      dataEfetivacao: new Date().toISOString(),
    });

    if (!resultado.sucesso) {
      return {
        sucesso: false,
        erro: resultado.erro || 'Erro ao atualizar parcela',
      };
    }

    console.log('✅ Parcela marcada como paga:', { parcelaId });

    return {
      sucesso: true,
      parcela: resultado.parcela,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao marcar parcela como paga:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Reverte status de parcela (volta para pendente)
 *
 * @param parcelaId ID da parcela
 * @returns Resultado da operação
 */
export async function reverterStatusParcela(
  parcelaId: number
): Promise<MarcarParcelaResult> {
  console.log('↩️ Revertendo status da parcela...', { parcelaId });

  try {
    // 1. Buscar e validar parcela
    const resultadoParcela = await buscarParcelaPorId(parcelaId);
    if (!resultadoParcela.sucesso || !resultadoParcela.parcela) {
      return {
        sucesso: false,
        erro: resultadoParcela.erro || 'Parcela não encontrada',
      };
    }

    const parcela = resultadoParcela.parcela;

    // Não permitir reverter se já tem repasse realizado
    if (parcela.statusRepasse === 'repassado') {
      return {
        sucesso: false,
        erro: 'Não é possível reverter parcela que já teve repasse realizado',
      };
    }

    // 2. Atualizar parcela
    const resultado = await atualizarParcela(parcelaId, {
      status: 'pendente',
      dataEfetivacao: null,
    });

    if (!resultado.sucesso) {
      return {
        sucesso: false,
        erro: resultado.erro || 'Erro ao atualizar parcela',
      };
    }

    console.log('✅ Status da parcela revertido:', { parcelaId });

    return {
      sucesso: true,
      parcela: resultado.parcela,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao reverter status da parcela:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Atualiza status de múltiplas parcelas de uma vez
 *
 * @param parcelaIds IDs das parcelas
 * @param novoStatus Novo status
 * @returns Resultado da operação
 */
export async function atualizarStatusEmLote(
  parcelaIds: number[],
  novoStatus: StatusParcela
): Promise<{
  sucesso: boolean;
  parcelasAtualizadas: number;
  erro?: string;
}> {
  console.log('📦 Atualizando status em lote...', {
    quantidade: parcelaIds.length,
    novoStatus,
  });

  try {
    let sucessos = 0;

    for (const parcelaId of parcelaIds) {
      const funcao = novoStatus === 'recebida'
        ? marcarComoRecebida
        : novoStatus === 'paga'
          ? marcarComoPaga
          : null;

      if (!funcao) {
        continue;
      }

      const resultado = await funcao(parcelaId);
      if (resultado.sucesso) {
        sucessos++;
      }
    }

    return {
      sucesso: true,
      parcelasAtualizadas: sucessos,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao atualizar status em lote:', error);
    return {
      sucesso: false,
      parcelasAtualizadas: 0,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}
