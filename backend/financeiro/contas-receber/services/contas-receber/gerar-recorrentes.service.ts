/**
 * Serviço de Geração de Contas a Receber Recorrentes
 * Gera automaticamente novas contas baseadas em templates recorrentes
 */

import {
  buscarContasReceberRecorrentes,
  criarContaReceber,
  buscarUltimaContaGeradaPorTemplate,
  verificarContaExistentePorTemplateEData,
} from '../persistence/contas-receber-persistence.service';
import {
  calcularProximoVencimento,
  type ContaReceber,
  type CriarContaReceberDTO,
  type GerarRecorrentesResult,
  type FrequenciaRecorrencia,
} from '@/backend/types/financeiro/contas-receber.types';

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
  template: ContaReceber,
  dataReferencia: Date,
  ultimaGerada?: ContaReceber
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
 * Usa consulta otimizada com filtro direto por lancamento_origem_id
 */
const buscarUltimaContaGerada = async (templateId: number): Promise<ContaReceber | undefined> => {
  const resultado = await buscarUltimaContaGeradaPorTemplate(templateId);
  return resultado || undefined;
};

/**
 * Cria uma nova conta a partir de um template recorrente
 */
const criarContaRecorrente = async (
  template: ContaReceber,
  novaDataVencimento: string
): Promise<ContaReceber> => {
  const dados: CriarContaReceberDTO = {
    descricao: template.descricao,
    valor: template.valor,
    dataVencimento: novaDataVencimento,
    dataCompetencia: novaDataVencimento,
    contaContabilId: template.contaContabilId,
    origem: 'recorrente',
    formaRecebimento: template.formaRecebimento || undefined,
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

  return await criarContaReceber(dados, USUARIO_SISTEMA_ID);
};

// ============================================================================
// Serviço Principal
// ============================================================================

/**
 * Gera contas a receber recorrentes baseadas em templates ativos
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
export const gerarContasReceberRecorrentes = async (
  dataReferencia?: Date
): Promise<GerarRecorrentesResult> => {
  const dataRef = dataReferencia || new Date();
  const contasGeradas: ContaReceber[] = [];
  const erros: Array<{ templateId: number; erro: string }> = [];

  try {
    // Buscar templates recorrentes ativos
    const templates = await buscarContasReceberRecorrentes();

    if (templates.length === 0) {
      return {
        sucesso: true,
        contasGeradas: [],
        total: 0,
      };
    }

    console.log(`Processando ${templates.length} templates recorrentes de contas a receber...`);

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
 * Usa consulta otimizada com filtro direto por lancamento_origem_id e data_vencimento
 */
const verificarContaExistente = async (
  templateId: number,
  dataVencimento: string
): Promise<boolean> => {
  return await verificarContaExistentePorTemplateEData(templateId, dataVencimento);
};

/**
 * Gera preview das contas que serão criadas (dry run)
 */
export const previewContasRecorrentes = async (
  dataReferencia?: Date
): Promise<{
  templates: ContaReceber[];
  contasAGerar: Array<{
    templateId: number;
    descricao: string;
    valor: number;
    proximoVencimento: string;
  }>;
}> => {
  const dataRef = dataReferencia || new Date();
  const templates = await buscarContasReceberRecorrentes();
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
  const templates = await buscarContasReceberRecorrentes();

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
