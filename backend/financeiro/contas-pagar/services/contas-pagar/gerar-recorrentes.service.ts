/**
 * Serviço de Geração de Contas a Pagar Recorrentes
 * Gera automaticamente novas contas baseadas em templates recorrentes
 */

import {
  buscarContasPagarRecorrentes,
  criarContaPagar,
  listarContasPagar,
} from '../persistence/contas-pagar-persistence.service';
import {
  calcularProximoVencimento,
  type ContaPagar,
  type CriarContaPagarDTO,
  type GerarRecorrentesResult,
  type FrequenciaRecorrencia,
} from '@/backend/types/financeiro/contas-pagar.types';

// ============================================================================
// Constantes
// ============================================================================

/**
 * Dias de antecedência para gerar contas recorrentes
 * (gera contas que vencem nos próximos X dias)
 */
const DIAS_ANTECEDENCIA_GERACAO = 30;

/**
 * ID do usuário de sistema para operações automáticas
 */
const USUARIO_SISTEMA_ID = 1;

// ============================================================================
// Funções Auxiliares
// ============================================================================

/**
 * Verifica se deve gerar nova conta para um template
 */
const deveGerarNovaConta = (
  template: ContaPagar,
  dataReferencia: Date,
  ultimaGerada?: ContaPagar
): boolean => {
  if (!template.frequenciaRecorrencia || !template.dataVencimento) {
    return false;
  }

  // Calcular próxima data de vencimento a partir da última gerada ou do template
  const dataBase = ultimaGerada?.dataVencimento || template.dataVencimento;
  const proximoVencimento = calcularProximoVencimento(
    dataBase,
    template.frequenciaRecorrencia
  );

  const proximaData = new Date(proximoVencimento);
  const limiteGeracao = new Date(dataReferencia);
  limiteGeracao.setDate(limiteGeracao.getDate() + DIAS_ANTECEDENCIA_GERACAO);

  // Gera se a próxima data <= limite de geração
  return proximaData <= limiteGeracao;
};

/**
 * Busca a última conta gerada a partir de um template
 */
const buscarUltimaContaGerada = async (templateId: number): Promise<ContaPagar | undefined> => {
  const resultado = await listarContasPagar({
    pagina: 1,
    limite: 1,
    ordenarPor: 'data_vencimento',
    ordem: 'desc',
  });

  // Filtrar pelo lancamento_origem_id
  const contasDoTemplate = resultado.items.filter(
    (c) => c.lancamentoOrigemId === templateId
  );

  return contasDoTemplate[0];
};

/**
 * Cria uma nova conta a partir de um template recorrente
 */
const criarContaRecorrente = async (
  template: ContaPagar,
  novaDataVencimento: string
): Promise<ContaPagar> => {
  const dados: CriarContaPagarDTO = {
    descricao: template.descricao,
    valor: template.valor,
    dataVencimento: novaDataVencimento,
    dataCompetencia: novaDataVencimento,
    contaContabilId: template.contaContabilId,
    origem: 'recorrente',
    formaPagamento: template.formaPagamento || undefined,
    contaBancariaId: template.contaBancariaId || undefined,
    centroCustoId: template.centroCustoId || undefined,
    categoria: template.categoria || undefined,
    documento: template.documento || undefined,
    clienteId: template.clienteId || undefined,
    contratoId: template.contratoId || undefined,
    recorrente: false, // A nova conta não é um template
    dadosAdicionais: {
      ...template.dadosAdicionais,
      geradoAutomaticamente: true,
      templateId: template.id,
      dataGeracao: new Date().toISOString(),
    },
  };

  return await criarContaPagar(dados, USUARIO_SISTEMA_ID);
};

// ============================================================================
// Serviço Principal
// ============================================================================

/**
 * Gera contas a pagar recorrentes baseadas em templates ativos
 *
 * Fluxo:
 * 1. Busca todos os templates recorrentes ativos
 * 2. Para cada template, verifica a última conta gerada
 * 3. Calcula a próxima data de vencimento
 * 4. Se a próxima data <= dataReferencia + 30 dias, gera nova conta
 * 5. Retorna lista de contas geradas
 *
 * @param dataReferencia - Data de referência para cálculo (default: hoje)
 * @returns Resultado da geração com lista de contas criadas
 */
export const gerarContasPagarRecorrentes = async (
  dataReferencia?: Date
): Promise<GerarRecorrentesResult> => {
  const dataRef = dataReferencia || new Date();
  const contasGeradas: ContaPagar[] = [];
  const erros: Array<{ templateId: number; erro: string }> = [];

  try {
    // Buscar templates recorrentes ativos
    const templates = await buscarContasPagarRecorrentes();

    if (templates.length === 0) {
      return {
        sucesso: true,
        contasGeradas: [],
        total: 0,
      };
    }

    console.log(`Processando ${templates.length} templates recorrentes...`);

    for (const template of templates) {
      try {
        // Verificar se template tem os dados necessários
        if (!template.frequenciaRecorrencia || !template.dataVencimento) {
          console.warn(`Template ${template.id} sem frequência ou data de vencimento`);
          continue;
        }

        // Buscar última conta gerada deste template
        const ultimaGerada = await buscarUltimaContaGerada(template.id);

        // Verificar se deve gerar nova conta
        if (!deveGerarNovaConta(template, dataRef, ultimaGerada)) {
          console.debug(`Template ${template.id}: não precisa gerar nova conta`);
          continue;
        }

        // Calcular nova data de vencimento
        const dataBase = ultimaGerada?.dataVencimento || template.dataVencimento;
        const novaDataVencimento = calcularProximoVencimento(
          dataBase,
          template.frequenciaRecorrencia
        );

        // Verificar se já existe conta com esta data de vencimento
        // (evitar duplicatas)
        const jaExiste = await verificarContaExistente(template.id, novaDataVencimento);
        if (jaExiste) {
          console.debug(`Template ${template.id}: conta para ${novaDataVencimento} já existe`);
          continue;
        }

        // Gerar nova conta
        console.log(`Gerando conta recorrente do template ${template.id} para ${novaDataVencimento}`);
        const novaConta = await criarContaRecorrente(template, novaDataVencimento);

        contasGeradas.push(novaConta);
      } catch (error) {
        const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`Erro ao processar template ${template.id}:`, mensagemErro);
        erros.push({ templateId: template.id, erro: mensagemErro });
      }
    }

    return {
      sucesso: erros.length === 0,
      contasGeradas,
      total: contasGeradas.length,
      erros: erros.length > 0 ? erros : undefined,
    };
  } catch (error) {
    console.error('Erro ao gerar contas recorrentes:', error);
    return {
      sucesso: false,
      contasGeradas: [],
      total: 0,
      erros: [
        {
          templateId: 0,
          erro: error instanceof Error ? error.message : 'Erro ao processar recorrências',
        },
      ],
    };
  }
};

/**
 * Verifica se já existe conta para o template na data especificada
 */
const verificarContaExistente = async (
  templateId: number,
  dataVencimento: string
): Promise<boolean> => {
  const resultado = await listarContasPagar({
    pagina: 1,
    limite: 1,
    dataVencimentoInicio: dataVencimento,
    dataVencimentoFim: dataVencimento,
  });

  // Verificar se existe conta com mesmo lancamento_origem_id e data
  return resultado.items.some(
    (c) =>
      c.lancamentoOrigemId === templateId &&
      c.dataVencimento === dataVencimento
  );
};

/**
 * Gera preview das contas que serão criadas (dry run)
 */
export const previewContasRecorrentes = async (
  dataReferencia?: Date
): Promise<{
  templates: ContaPagar[];
  contasAGerar: Array<{
    templateId: number;
    descricao: string;
    valor: number;
    proximoVencimento: string;
  }>;
}> => {
  const dataRef = dataReferencia || new Date();
  const templates = await buscarContasPagarRecorrentes();
  const contasAGerar: Array<{
    templateId: number;
    descricao: string;
    valor: number;
    proximoVencimento: string;
  }> = [];

  for (const template of templates) {
    if (!template.frequenciaRecorrencia || !template.dataVencimento) {
      continue;
    }

    const ultimaGerada = await buscarUltimaContaGerada(template.id);

    if (!deveGerarNovaConta(template, dataRef, ultimaGerada)) {
      continue;
    }

    const dataBase = ultimaGerada?.dataVencimento || template.dataVencimento;
    const proximoVencimento = calcularProximoVencimento(
      dataBase,
      template.frequenciaRecorrencia
    );

    const jaExiste = await verificarContaExistente(template.id, proximoVencimento);
    if (jaExiste) {
      continue;
    }

    contasAGerar.push({
      templateId: template.id,
      descricao: template.descricao,
      valor: template.valor,
      proximoVencimento,
    });
  }

  return { templates, contasAGerar };
};

/**
 * Calcula estatísticas de recorrência
 */
export const estatisticasRecorrencia = async (): Promise<{
  totalTemplates: number;
  porFrequencia: Record<FrequenciaRecorrencia, number>;
  valorMensalEstimado: number;
}> => {
  const templates = await buscarContasPagarRecorrentes();

  const porFrequencia: Record<FrequenciaRecorrencia, number> = {
    semanal: 0,
    quinzenal: 0,
    mensal: 0,
    bimestral: 0,
    trimestral: 0,
    semestral: 0,
    anual: 0,
  };

  let valorMensalEstimado = 0;

  for (const template of templates) {
    if (template.frequenciaRecorrencia) {
      porFrequencia[template.frequenciaRecorrencia]++;

      // Calcular equivalente mensal
      switch (template.frequenciaRecorrencia) {
        case 'semanal':
          valorMensalEstimado += template.valor * 4.33; // ~4.33 semanas por mês
          break;
        case 'quinzenal':
          valorMensalEstimado += template.valor * 2;
          break;
        case 'mensal':
          valorMensalEstimado += template.valor;
          break;
        case 'bimestral':
          valorMensalEstimado += template.valor / 2;
          break;
        case 'trimestral':
          valorMensalEstimado += template.valor / 3;
          break;
        case 'semestral':
          valorMensalEstimado += template.valor / 6;
          break;
        case 'anual':
          valorMensalEstimado += template.valor / 12;
          break;
      }
    }
  }

  return {
    totalTemplates: templates.length,
    porFrequencia,
    valorMensalEstimado: Math.round(valorMensalEstimado * 100) / 100,
  };
};
