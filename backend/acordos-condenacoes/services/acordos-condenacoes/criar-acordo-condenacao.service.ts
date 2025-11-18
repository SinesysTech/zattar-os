// Serviço de criação de acordo/condenação
// Gerencia lógica de negócio para cadastrar acordos/condenações com parcelas

import {
  criarAcordoCondenacao as criarAcordoCondenacaoDb,
  type AcordoCondenacaoDados,
  type AcordoCondenacao,
} from '../persistence/acordo-condenacao-persistence.service';
import {
  criarParcelas,
  type ParcelaDados,
} from '../persistence/parcela-persistence.service';

/**
 * Resultado da criação de acordo
 */
export interface CriarAcordoResult {
  sucesso: boolean;
  acordo?: AcordoCondenacao;
  parcelas?: any[];
  erro?: string;
}

/**
 * Dados para criar acordo com parcelas
 */
export interface CriarAcordoComParcelasParams extends AcordoCondenacaoDados {
  formaPagamentoPadrao: 'transferencia_direta' | 'deposito_judicial' | 'deposito_recursal';
  intervaloEntreParcelas?: number; // Dias entre parcelas (padrão: 30)
}

/**
 * Cria acordo/condenação com parcelas automaticamente
 *
 * Fluxo:
 * 1. Valida dados de entrada
 * 2. Cria registro principal em acordos_condenacoes
 * 3. Calcula e distribui valores entre parcelas
 * 4. Cria parcelas no banco
 * 5. Retorna acordo com parcelas criadas
 */
export async function criarAcordoComParcelas(
  params: CriarAcordoComParcelasParams
): Promise<CriarAcordoResult> {
  console.log('📝 Iniciando criação de acordo/condenação...', {
    tipo: params.tipo,
    direcao: params.direcao,
    valorTotal: params.valorTotal,
    numeroParcelas: params.numeroParcelas,
  });

  try {
    // 1. Validações
    const validacao = validarDadosAcordo(params);
    if (!validacao.valido) {
      return {
        sucesso: false,
        erro: validacao.erro,
      };
    }

    // 2. Criar acordo principal
    const resultadoAcordo = await criarAcordoCondenacaoDb(params);

    if (!resultadoAcordo.sucesso || !resultadoAcordo.acordo) {
      return {
        sucesso: false,
        erro: resultadoAcordo.erro || 'Erro ao criar acordo',
      };
    }

    const acordo = resultadoAcordo.acordo;

    // 3. Calcular e criar parcelas
    const parcelasParams = calcularParcelas(acordo, params);
    const resultadoParcelas = await criarParcelas(parcelasParams);

    if (!resultadoParcelas.sucesso) {
      // Se falhou ao criar parcelas, deveria reverter acordo (TODO: transaction)
      console.error('❌ Erro ao criar parcelas:', resultadoParcelas.erro);
      return {
        sucesso: false,
        erro: `Acordo criado mas falhou ao criar parcelas: ${resultadoParcelas.erro}`,
      };
    }

    console.log('✅ Acordo/condenação criado com sucesso:', {
      acordoId: acordo.id,
      numeroParcelas: resultadoParcelas.parcelas?.length || 0,
    });

    return {
      sucesso: true,
      acordo,
      parcelas: resultadoParcelas.parcelas,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao criar acordo/condenação:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Valida dados do acordo
 */
function validarDadosAcordo(params: CriarAcordoComParcelasParams): {
  valido: boolean;
  erro?: string;
} {
  // Validar campos obrigatórios
  if (!params.processoId) {
    return { valido: false, erro: 'processo_id é obrigatório' };
  }
  if (!params.tipo) {
    return { valido: false, erro: 'tipo é obrigatório' };
  }
  if (!params.direcao) {
    return { valido: false, erro: 'direcao é obrigatório' };
  }
  if (!params.valorTotal || params.valorTotal <= 0) {
    return { valido: false, erro: 'valor_total deve ser maior que zero' };
  }
  if (!params.numeroParcelas || params.numeroParcelas <= 0) {
    return { valido: false, erro: 'numero_parcelas deve ser maior que zero' };
  }

  // Validar regras específicas de custas processuais
  if (params.tipo === 'custas_processuais') {
    if (params.direcao !== 'pagamento') {
      return {
        valido: false,
        erro: 'Custas processuais devem ter direcao = "pagamento"',
      };
    }
    if (params.numeroParcelas !== 1) {
      return {
        valido: false,
        erro: 'Custas processuais devem ter parcela única',
      };
    }
    if (params.formaDistribuicao) {
      return {
        valido: false,
        erro: 'Custas processuais não podem ter forma_distribuicao',
      };
    }
  }

  // Validar forma de distribuição para recebimentos
  if (params.direcao === 'recebimento' && params.tipo !== 'custas_processuais') {
    if (!params.formaDistribuicao) {
      return {
        valido: false,
        erro: 'Recebimentos devem ter forma_distribuicao definida',
      };
    }
  }

  // Validar percentual do escritório
  if (params.percentualEscritorio !== undefined) {
    if (params.percentualEscritorio < 0 || params.percentualEscritorio > 100) {
      return {
        valido: false,
        erro: 'percentual_escritorio deve estar entre 0 e 100',
      };
    }
  }

  return { valido: true };
}

/**
 * Calcula parcelas com distribuição de valores
 */
function calcularParcelas(
  acordo: AcordoCondenacao,
  params: CriarAcordoComParcelasParams
): ParcelaDados[] {
  const numeroParcelas = acordo.numeroParcelas;
  const intervalo = params.intervaloEntreParcelas || 30; // 30 dias padrão
  const parcelas: ParcelaDados[] = [];

  // Distribuir crédito principal igualmente
  const valorPorParcela = acordo.valorTotal / numeroParcelas;

  // Distribuir honorários sucumbenciais igualmente
  const honorariosSucumbenciaisPorParcela =
    acordo.honorariosSucumbenciaisTotal / numeroParcelas;

  // Data base para vencimentos
  const dataBase = new Date(acordo.dataVencimentoPrimeiraParcela);

  for (let i = 0; i < numeroParcelas; i++) {
    // Calcular data de vencimento (parcela 1 = dataBase, parcela 2 = dataBase + intervalo, etc)
    const dataVencimento = new Date(dataBase);
    dataVencimento.setDate(dataVencimento.getDate() + i * intervalo);

    // Ajuste para última parcela (arredondamento)
    const valorParcela = i === numeroParcelas - 1
      ? acordo.valorTotal - (valorPorParcela * (numeroParcelas - 1)) // Última parcela pega o resto
      : valorPorParcela;

    const honorariosParcela = i === numeroParcelas - 1
      ? acordo.honorariosSucumbenciaisTotal - (honorariosSucumbenciaisPorParcela * (numeroParcelas - 1))
      : honorariosSucumbenciaisPorParcela;

    parcelas.push({
      acordoCondenacaoId: acordo.id,
      numeroParcela: i + 1,
      valorBrutoCreditoPrincipal: parseFloat(valorParcela.toFixed(2)),
      honorariosSucumbenciais: parseFloat(honorariosParcela.toFixed(2)),
      dataVencimento: dataVencimento.toISOString().split('T')[0], // YYYY-MM-DD
      formaPagamento: params.formaPagamentoPadrao,
      editadoManualmente: false,
    });
  }

  return parcelas;
}
