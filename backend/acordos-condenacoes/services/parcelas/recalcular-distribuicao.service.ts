// Serviço de recálculo de distribuição de valores entre parcelas
// Gerencia redistribuição automática quando parcela é editada manualmente

import {
  listarParcelasDoAcordo,
  buscarParcelasNaoEditadas,
  atualizarParcela,
  type Parcela,
} from '../persistence/parcela-persistence.service';
import {
  buscarAcordoCondenacaoPorId,
} from '../persistence/acordo-condenacao-persistence.service';

/**
 * Resultado do recálculo
 */
export interface RecalcularDistribuicaoResult {
  sucesso: boolean;
  parcelasAtualizadas?: Parcela[];
  erro?: string;
}

/**
 * Recalcula distribuição de valores entre parcelas não editadas
 *
 * Fluxo:
 * 1. Buscar acordo e todas as parcelas
 * 2. Separar parcelas editadas manualmente das não editadas
 * 3. Calcular saldo restante (total - soma das editadas)
 * 4. Redistribuir saldo igualmente entre não editadas
 * 5. Atualizar parcelas no banco
 * 6. Recalcular campos derivados (honorarios_contratuais, valor_repasse)
 *
 * @param acordoCondenacaoId ID do acordo
 * @param tipoValor 'credito_principal' ou 'honorarios_sucumbenciais'
 * @returns Resultado do recálculo
 */
export async function recalcularDistribuicao(
  acordoCondenacaoId: number,
  tipoValor: 'credito_principal' | 'honorarios_sucumbenciais'
): Promise<RecalcularDistribuicaoResult> {
  console.log('🔄 Iniciando recálculo de distribuição...', {
    acordoId: acordoCondenacaoId,
    tipoValor,
  });

  try {
    // 1. Buscar acordo
    const resultadoAcordo = await buscarAcordoCondenacaoPorId(acordoCondenacaoId);
    if (!resultadoAcordo.sucesso || !resultadoAcordo.acordo) {
      return {
        sucesso: false,
        erro: resultadoAcordo.erro || 'Acordo não encontrado',
      };
    }
    const acordo = resultadoAcordo.acordo;

    // 2. Buscar todas as parcelas
    const todasParcelas = await listarParcelasDoAcordo(acordoCondenacaoId);

    if (todasParcelas.length === 0) {
      return {
        sucesso: false,
        erro: 'Nenhuma parcela encontrada para este acordo',
      };
    }

    // 3. Separar editadas das não editadas
    const parcelasEditadas = todasParcelas.filter((p) => p.editadoManualmente);
    const parcelasNaoEditadas = todasParcelas.filter((p) => !p.editadoManualmente);

    if (parcelasNaoEditadas.length === 0) {
      console.log('ℹ️ Todas as parcelas foram editadas manualmente, nada a recalcular');
      return {
        sucesso: true,
        parcelasAtualizadas: [],
      };
    }

    // 4. Calcular saldo restante
    let valorTotal = 0;
    let valorEditado = 0;

    if (tipoValor === 'credito_principal') {
      valorTotal = acordo.valorTotal;
      valorEditado = parcelasEditadas.reduce(
        (sum, p) => sum + p.valorBrutoCreditoPrincipal,
        0
      );
    } else {
      valorTotal = acordo.honorariosSucumbenciaisTotal;
      valorEditado = parcelasEditadas.reduce(
        (sum, p) => sum + p.honorariosSucumbenciais,
        0
      );
    }

    const saldoRestante = valorTotal - valorEditado;

    if (saldoRestante < 0) {
      return {
        sucesso: false,
        erro: `Soma das parcelas editadas excede o valor total do acordo`,
      };
    }

    // 5. Redistribuir saldo entre não editadas
    const quantidadeNaoEditadas = parcelasNaoEditadas.length;
    const valorPorParcela = saldoRestante / quantidadeNaoEditadas;

    const parcelasAtualizadas: Parcela[] = [];

    for (let i = 0; i < parcelasNaoEditadas.length; i++) {
      const parcela = parcelasNaoEditadas[i];
      const isUltima = i === quantidadeNaoEditadas - 1;

      // Última parcela pega o resto para evitar problemas de arredondamento
      let novoValor = isUltima
        ? saldoRestante - (valorPorParcela * (quantidadeNaoEditadas - 1))
        : valorPorParcela;

      novoValor = parseFloat(novoValor.toFixed(2));

      // Atualizar parcela
      const dadosAtualizacao =
        tipoValor === 'credito_principal'
          ? { valorBrutoCreditoPrincipal: novoValor }
          : { honorariosSucumbenciais: novoValor };

      const resultado = await atualizarParcela(parcela.id, dadosAtualizacao);

      if (resultado.sucesso && resultado.parcela) {
        parcelasAtualizadas.push(resultado.parcela);
      }
    }

    console.log('✅ Distribuição recalculada com sucesso:', {
      parcelasAtualizadas: parcelasAtualizadas.length,
      saldoRestante,
      valorPorParcela,
    });

    return {
      sucesso: true,
      parcelasAtualizadas,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao recalcular distribuição:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Reseta todas as edições manuais e redistribui valores igualmente
 *
 * @param acordoCondenacaoId ID do acordo
 * @returns Resultado do reset
 */
export async function resetarDistribuicao(
  acordoCondenacaoId: number
): Promise<RecalcularDistribuicaoResult> {
  console.log('🔄 Resetando distribuição de parcelas...', { acordoId: acordoCondenacaoId });

  try {
    // 1. Buscar acordo
    const resultadoAcordo = await buscarAcordoCondenacaoPorId(acordoCondenacaoId);
    if (!resultadoAcordo.sucesso || !resultadoAcordo.acordo) {
      return {
        sucesso: false,
        erro: resultadoAcordo.erro || 'Acordo não encontrado',
      };
    }
    const acordo = resultadoAcordo.acordo;

    // 2. Buscar todas as parcelas
    const todasParcelas = await listarParcelasDoAcordo(acordoCondenacaoId);

    if (todasParcelas.length === 0) {
      return {
        sucesso: false,
        erro: 'Nenhuma parcela encontrada para este acordo',
      };
    }

    // 3. Distribuir valores igualmente
    const numeroParcelas = todasParcelas.length;
    const valorCreditoPorParcela = acordo.valorTotal / numeroParcelas;
    const valorSucumbenciaisPorParcela = acordo.honorariosSucumbenciaisTotal / numeroParcelas;

    const parcelasAtualizadas: Parcela[] = [];

    for (let i = 0; i < todasParcelas.length; i++) {
      const parcela = todasParcelas[i];
      const isUltima = i === numeroParcelas - 1;

      // Última parcela pega o resto
      const valorCredito = isUltima
        ? acordo.valorTotal - (valorCreditoPorParcela * (numeroParcelas - 1))
        : valorCreditoPorParcela;

      const valorSucumbenciais = isUltima
        ? acordo.honorariosSucumbenciaisTotal - (valorSucumbenciaisPorParcela * (numeroParcelas - 1))
        : valorSucumbenciaisPorParcela;

      // Atualizar parcela
      const resultado = await atualizarParcela(parcela.id, {
        valorBrutoCreditoPrincipal: parseFloat(valorCredito.toFixed(2)),
        honorariosSucumbenciais: parseFloat(valorSucumbenciais.toFixed(2)),
        editadoManualmente: false, // Resetar flag de edição manual
      });

      if (resultado.sucesso && resultado.parcela) {
        parcelasAtualizadas.push(resultado.parcela);
      }
    }

    console.log('✅ Distribuição resetada com sucesso:', {
      parcelasAtualizadas: parcelasAtualizadas.length,
    });

    return {
      sucesso: true,
      parcelasAtualizadas,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao resetar distribuição:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Valida se soma das parcelas está de acordo com o total do acordo
 *
 * @param acordoCondenacaoId ID do acordo
 * @returns Resultado da validação
 */
export async function validarSomaParcelas(
  acordoCondenacaoId: number
): Promise<{
  valido: boolean;
  diferenca?: number;
  erro?: string;
}> {
  try {
    const resultadoAcordo = await buscarAcordoCondenacaoPorId(acordoCondenacaoId);
    if (!resultadoAcordo.sucesso || !resultadoAcordo.acordo) {
      return {
        valido: false,
        erro: resultadoAcordo.erro || 'Acordo não encontrado',
      };
    }
    const acordo = resultadoAcordo.acordo;

    const parcelas = await listarParcelasDoAcordo(acordoCondenacaoId);
    const somaCredito = parcelas.reduce((sum, p) => sum + p.valorBrutoCreditoPrincipal, 0);
    const somaSucumbenciais = parcelas.reduce((sum, p) => sum + p.honorariosSucumbenciais, 0);

    const diferencaCredito = Math.abs(acordo.valorTotal - somaCredito);
    const diferencaSucumbenciais = Math.abs(
      acordo.honorariosSucumbenciaisTotal - somaSucumbenciais
    );

    // Permitir diferença de até 0.01 por arredondamentos
    const margemErro = 0.01;

    if (diferencaCredito > margemErro || diferencaSucumbenciais > margemErro) {
      return {
        valido: false,
        diferenca: Math.max(diferencaCredito, diferencaSucumbenciais),
        erro: `Soma das parcelas diverge do total do acordo`,
      };
    }

    return { valido: true };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    return {
      valido: false,
      erro: `Erro ao validar: ${erroMsg}`,
    };
  }
}
