/**
 * Arquivo: captura/services/partes/partes-capture.service.ts
 *
 * PROPÓSITO:
 * Serviço principal para captura end-to-end de partes de processos do PJE-TRT.
 * Orquestra todo o fluxo: busca via API, identificação de cliente, upsert de entidades,
 * salvamento de representantes e criação de vínculos processo-partes.
 *
 * EXPORTAÇÕES:
 * - capturarPartesProcesso(): Função principal de captura
 *
 * QUEM USA ESTE ARQUIVO:
 * - app/api/captura/trt/partes/route.ts (endpoint REST)
 */

import type { Page } from 'playwright';
import type { CapturaPartesResult, CapturaPartesErro, TipoParteClassificacao } from './types';
import type { PartePJE } from '@/backend/api/pje-trt/partes/types';
import { obterPartesProcesso } from '@/backend/api/pje-trt/partes';
import { identificarTipoParte, type AdvogadoIdentificacao } from './identificacao-partes.service';
import { upsertClientePorIdPessoa } from '@/backend/clientes/services/persistence/cliente-persistence.service';
import { upsertParteContrariaPorIdPessoa } from '@/backend/partes-contrarias/services/persistence/parte-contraria-persistence.service';
import { upsertTerceiroPorIdPessoa } from '@/backend/terceiros/services/persistence/terceiro-persistence.service';
import { upsertProcessoParte } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';
import { upsertRepresentante } from '@/backend/representantes/services/representantes-persistence.service';
import type { CriarClientePFParams, CriarClientePJParams } from '@/backend/types/partes/clientes-types';
import type { CriarParteContrariaPFParams, CriarParteContrariaPJParams } from '@/backend/types/partes/partes-contrarias-types';
import type { CriarTerceiroPFParams, CriarTerceiroPJParams } from '@/lib/types/partes/terceiros';
import type { GrauAcervo } from '@/backend/types/acervo/types';

/**
 * Interface para dados básicos do processo necessários para captura
 */
export interface ProcessoParaCaptura {
  /** ID do processo na tabela acervo */
  id: number;
  /** Número CNJ do processo */
  numero_processo: string;
  /** ID interno do processo no PJE */
  id_pje: number;
  /** TRT do processo (ex: "03", "05") */
  trt: string;
  /** Grau do processo */
  grau: GrauAcervo;
}

/**
 * Função: capturarPartesProcesso
 *
 * PROPÓSITO:
 * Captura todas as partes de um processo específico do PJE, identifica quais são
 * nossos clientes, e persiste tudo no banco de dados.
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Busca partes do processo via API PJE (obterPartesProcesso)
 * 2. Para cada parte:
 *    a. Identifica tipo (cliente/parte_contraria/terceiro)
 *    b. Faz upsert da entidade apropriada
 *    c. Salva representantes da parte
 *    d. Cria vínculo em processo_partes
 * 3. Retorna resultado com contadores e erros
 *
 * TRATAMENTO DE ERROS:
 * - Erros ao processar uma parte não interrompem o processamento das demais
 * - Erros são coletados no array de erros do resultado
 * - Logging detalhado em cada etapa
 *
 * PERFORMANCE:
 * - Partes são processadas sequencialmente (evita sobrecarga no banco)
 * - Representantes de cada parte são salvos em lote
 * - Tempo típico: 2-5s por processo (depende de quantidade de partes)
 */
export async function capturarPartesProcesso(
  page: Page,
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao
): Promise<CapturaPartesResult> {
  const inicio = Date.now();
  const resultado: CapturaPartesResult = {
    processoId: processo.id,
    numeroProcesso: processo.numero_processo,
    totalPartes: 0,
    clientes: 0,
    partesContrarias: 0,
    terceiros: 0,
    representantes: 0,
    vinculos: 0,
    erros: [],
    duracaoMs: 0,
  };

  try {
    console.log(
      `[CAPTURA-PARTES] Iniciando captura de partes do processo ${processo.numero_processo} (ID: ${processo.id})`
    );

    // 1. Busca partes via API PJE
    const partes = await obterPartesProcesso(page, processo.id_pje);
    resultado.totalPartes = partes.length;

    console.log(
      `[CAPTURA-PARTES] Encontradas ${partes.length} partes no processo ${processo.numero_processo}`
    );

    // Se não há partes, retorna resultado vazio
    if (partes.length === 0) {
      resultado.duracaoMs = Date.now() - inicio;
      return resultado;
    }

    // 2. Processa cada parte sequencialmente
    for (let i = 0; i < partes.length; i++) {
      const parte = partes[i];

      try {
        console.log(
          `[CAPTURA-PARTES] Processando parte ${i + 1}/${partes.length}: ${parte.nome}`
        );

        // 2a. Identifica tipo da parte
        const tipoParte = identificarTipoParte(parte, advogado);

        // 2b. Faz upsert da entidade apropriada
        const entidadeId = await processarParte(parte, tipoParte, processo);

        if (entidadeId) {
          // Incrementa contador do tipo apropriado
          if (tipoParte === 'cliente') resultado.clientes++;
          else if (tipoParte === 'parte_contraria') resultado.partesContrarias++;
          else if (tipoParte === 'terceiro') resultado.terceiros++;

          // 2c. Salva representantes da parte
          if (parte.representantes && parte.representantes.length > 0) {
            const repsCount = await processarRepresentantes(
              parte.representantes,
              tipoParte,
              entidadeId,
              processo.numero_processo
            );
            resultado.representantes += repsCount;
          }

          // 2d. Cria vínculo processo-parte
          const vinculoCriado = await criarVinculoProcessoParte(
            processo,
            tipoParte,
            entidadeId,
            parte,
            i
          );

          if (vinculoCriado) resultado.vinculos++;
        }
      } catch (error) {
        // Loga erro e adiciona ao array de erros, mas continua processando
        const erro: CapturaPartesErro = {
          parteIndex: i,
          parteDados: {
            idParte: parte.idParte,
            nome: parte.nome,
            tipoParte: parte.tipoParte,
          },
          erro: error instanceof Error ? error.message : String(error),
        };

        resultado.erros.push(erro);

        console.error(
          `[CAPTURA-PARTES] Erro ao processar parte ${i + 1}/${partes.length} (${parte.nome}):`,
          error
        );
      }
    }

    resultado.duracaoMs = Date.now() - inicio;

    console.log(
      `[CAPTURA-PARTES] Captura concluída para processo ${processo.numero_processo}:`,
      `Clientes: ${resultado.clientes}, Partes Contrárias: ${resultado.partesContrarias}, Terceiros: ${resultado.terceiros},`,
      `Representantes: ${resultado.representantes}, Vínculos: ${resultado.vinculos}, Erros: ${resultado.erros.length},`,
      `Tempo: ${resultado.duracaoMs}ms`
    );

    return resultado;
  } catch (error) {
    console.error(
      `[CAPTURA-PARTES] Erro fatal ao capturar partes do processo ${processo.numero_processo}:`,
      error
    );

    // Atualiza duração e propaga exceção
    resultado.duracaoMs = Date.now() - inicio;
    throw error;
  }
}

/**
 * Processa uma parte individual: faz upsert da entidade apropriada
 * Retorna ID da entidade criada/atualizada ou null se falhou
 */
async function processarParte(
  parte: PartePJE,
  tipoParte: TipoParteClassificacao,
  processo: ProcessoParaCaptura
): Promise<number | null> {
  const isPessoaFisica = parte.tipoDocumento === 'CPF';

  // Mapeia dados comuns
  const dadosComuns = {
    id_pje: parte.idParte,
    id_pessoa_pje: parte.idPessoa,
    trt: processo.trt,
    grau: processo.grau,
    numero_processo: processo.numero_processo,
    nome: parte.nome,
    emails: parte.emails.length > 0 ? parte.emails : null,
    ddd_celular: parte.telefones[0]?.ddd || null,
    numero_celular: parte.telefones[0]?.numero || null,
    ddd_telefone: parte.telefones[1]?.ddd || null,
    numero_telefone: parte.telefones[1]?.numero || null,
    dados_pje_completo: parte.dadosCompletos,
  };

  try {
    if (tipoParte === 'cliente') {
      // Upsert em tabela clientes
      if (isPessoaFisica) {
        const params: CriarClientePFParams & { id_pessoa_pje: number } = {
          ...dadosComuns,
          tipo_pessoa: 'pf',
          cpf: parte.numeroDocumento,
        };
        const result = await upsertClientePorIdPessoa(params);
        return result.sucesso && result.cliente ? result.cliente.id : null;
      } else {
        const params: CriarClientePJParams & { id_pessoa_pje: number } = {
          ...dadosComuns,
          tipo_pessoa: 'pj',
          cnpj: parte.numeroDocumento,
        };
        const result = await upsertClientePorIdPessoa(params);
        return result.sucesso && result.cliente ? result.cliente.id : null;
      }
    } else if (tipoParte === 'parte_contraria') {
      // Upsert em tabela partes_contrarias
      if (isPessoaFisica) {
        const params: CriarParteContrariaPFParams & { id_pessoa_pje: number } = {
          ...dadosComuns,
          tipo_pessoa: 'pf',
          cpf: parte.numeroDocumento,
        };
        const result = await upsertParteContrariaPorIdPessoa(params);
        return result.sucesso && result.parteContraria ? result.parteContraria.id : null;
      } else {
        const params: CriarParteContrariaPJParams & { id_pessoa_pje: number } = {
          ...dadosComuns,
          tipo_pessoa: 'pj',
          cnpj: parte.numeroDocumento,
        };
        const result = await upsertParteContrariaPorIdPessoa(params);
        return result.sucesso && result.parteContraria ? result.parteContraria.id : null;
      }
    } else {
      // Upsert em tabela terceiros
      if (isPessoaFisica) {
        const params: CriarTerceiroPFParams & { id_pessoa_pje: number } = {
          ...dadosComuns,
          tipo_pessoa: 'pf',
          cpf: parte.numeroDocumento,
          tipo_parte: parte.tipoParte as any,
          polo: parte.polo as any,
        };
        const result = await upsertTerceiroPorIdPessoa(params);
        return result.sucesso && result.terceiro ? result.terceiro.id : null;
      } else {
        const params: CriarTerceiroPJParams & { id_pessoa_pje: number } = {
          ...dadosComuns,
          tipo_pessoa: 'pj',
          cnpj: parte.numeroDocumento,
          tipo_parte: parte.tipoParte as any,
          polo: parte.polo as any,
        };
        const result = await upsertTerceiroPorIdPessoa(params);
        return result.sucesso && result.terceiro ? result.terceiro.id : null;
      }
    }
  } catch (error) {
    console.error(`[CAPTURA-PARTES] Erro ao processar parte ${parte.nome}:`, error);
    throw error;
  }
}

/**
 * Processa e salva representantes de uma parte
 * Retorna quantidade de representantes salvos com sucesso
 */
async function processarRepresentantes(
  representantes: any[],
  tipoParte: TipoParteClassificacao,
  parteId: number,
  numeroProcesso: string
): Promise<number> {
  let count = 0;

  for (const rep of representantes) {
    try {
      const result = await upsertRepresentante({
        id_pessoa_pje: rep.idPessoa,
        parte_tipo: tipoParte,
        parte_id: parteId,
        numero_processo: numeroProcesso,
        nome: rep.nome,
        cpf: rep.tipoDocumento === 'CPF' ? rep.numeroDocumento : null,
        cnpj: rep.tipoDocumento === 'CNPJ' ? rep.numeroDocumento : null,
        numero_oab: rep.numeroOAB,
        uf_oab: rep.ufOAB,
        situacao_oab: rep.situacaoOAB,
        tipo: rep.tipo,
        email: rep.email,
        ddd_celular: rep.telefones[0]?.ddd || null,
        numero_celular: rep.telefones[0]?.numero || null,
        dados_pje_completo: rep.dadosCompletos,
      });

      if (result.sucesso) count++;
    } catch (error) {
      console.error(`[CAPTURA-PARTES] Erro ao salvar representante ${rep.nome}:`, error);
      // Continua com próximo representante
    }
  }

  return count;
}

/**
 * Cria vínculo entre processo e parte na tabela processo_partes
 * Retorna true se criado com sucesso, false caso contrário
 */
async function criarVinculoProcessoParte(
  processo: ProcessoParaCaptura,
  tipoParte: TipoParteClassificacao,
  entidadeId: number,
  parte: PartePJE,
  ordem: number
): Promise<boolean> {
  try {
    const result = await upsertProcessoParte({
      processo_id: processo.id,
      entidade_tipo: tipoParte,
      entidade_id: entidadeId,
      polo: parte.polo.toLowerCase() as 'ativo' | 'passivo' | 'outros',
      tipo_parte: parte.tipoParte,
      principal: parte.principal,
      ordem,
      dados_pje_completo: parte.dadosCompletos,
    });

    return result.sucesso;
  } catch (error) {
    console.error(
      `[CAPTURA-PARTES] Erro ao criar vínculo processo-parte para ${parte.nome}:`,
      error
    );
    return false;
  }
}
