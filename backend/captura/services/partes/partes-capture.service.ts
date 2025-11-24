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
import type { PartePJE, RepresentantePJE } from '@/backend/api/pje-trt/partes/types';
import { obterPartesProcesso } from '@/backend/api/pje-trt/partes';
import { identificarTipoParte, type AdvogadoIdentificacao } from './identificacao-partes.service';
import { upsertClientePorIdPessoa } from '@/backend/clientes/services/persistence/cliente-persistence.service';
import { upsertParteContrariaPorIdPessoa } from '@/backend/partes-contrarias/services/persistence/parte-contraria-persistence.service';
import { upsertTerceiroPorIdPessoa } from '@/backend/terceiros/services/persistence/terceiro-persistence.service';
import { vincularParteProcesso } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';
import { upsertRepresentantePorIdPessoa } from '@/backend/representantes/services/representantes-persistence.service';
import { upsertEnderecoPorIdPje } from '@/backend/enderecos/services/enderecos-persistence.service';
import type { CriarClientePFParams, CriarClientePJParams } from '@/backend/types/partes/clientes-types';
import type { CriarParteContrariaPFParams, CriarParteContrariaPJParams } from '@/backend/types/partes/partes-contrarias-types';
import type { UpsertTerceiroPorIdPessoaParams } from '@/backend/types/partes/terceiros-types';
import type { TipoParteProcesso, PoloProcessoParte } from '@/backend/types/partes';
import type { GrauAcervo } from '@/backend/types/acervo/types';
import type { EntidadeTipoEndereco, SituacaoEndereco, ClassificacaoEndereco } from '@/backend/types/partes/enderecos-types';
import type { SituacaoOAB, TipoRepresentante } from '@/backend/types/representantes/representantes-types';

interface EnderecoPJE {
  id?: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  idMunicipio?: number;
  municipio?: string;
  municipioIbge?: string;
  estado?: { id?: number; sigla?: string; descricao?: string };
  pais?: { id?: number; codigo?: string; descricao?: string };
  nroCep?: string;
  classificacoesEndereco?: ClassificacaoEndereco[];
  correspondencia?: boolean;
  situacao?: string;
  idUsuarioCadastrador?: number;
  dtAlteracao?: string;
}

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
 *    c. Processa e salva endereço (se houver)
 *    d. Salva representantes da parte
 *    e. Cria vínculo em processo_partes
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
    payloadBruto: null,
  };

  try {
    console.log(
      `[CAPTURA-PARTES] Iniciando captura de partes do processo ${processo.numero_processo} (ID: ${processo.id})`
    );

    // 1. Busca partes via API PJE
    const { partes, payloadBruto } = await obterPartesProcesso(page, processo.id_pje);
    resultado.totalPartes = partes.length;
    resultado.payloadBruto = payloadBruto;

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
        const entidadeId = await processarParte(parte, tipoParte);

        if (entidadeId) {
          // Incrementa contador do tipo apropriado
          if (tipoParte === 'cliente') resultado.clientes++;
          else if (tipoParte === 'parte_contraria') resultado.partesContrarias++;
          else if (tipoParte === 'terceiro') resultado.terceiros++;

          // 2c. Processa e salva endereço (se houver)
          await processarEndereco(parte, tipoParte, entidadeId);

          // 2d. Salva representantes da parte
          if (parte.representantes && parte.representantes.length > 0) {
            const repsCount = await processarRepresentantes(
              parte.representantes,
              tipoParte,
              entidadeId,
              processo
            );
            resultado.representantes += repsCount;
          }

          // 2e. Cria vínculo processo-parte
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
  tipoParte: TipoParteClassificacao
): Promise<number | null> {
  const isPessoaFisica = parte.tipoDocumento === 'CPF';

  // Mapeia dados comuns (SEM trt/grau/numero_processo/id_pje - vão para processo_partes)
  const dadosComuns = {
    id_pessoa_pje: parte.idPessoa,
    nome: parte.nome,
    emails: parte.emails.length > 0 ? parte.emails : undefined,
    ddd_celular: parte.telefones[0]?.ddd || undefined,
    numero_celular: parte.telefones[0]?.numero || undefined,
    ddd_residencial: parte.telefones[1]?.ddd || undefined,
    numero_residencial: parte.telefones[1]?.numero || undefined,
    dados_anteriores: parte.dadosCompletos,
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
      const params = {
        ...dadosComuns,
        tipo_pessoa: isPessoaFisica ? ('pf' as const) : ('pj' as const),
        cpf: isPessoaFisica ? parte.numeroDocumento : undefined,
        cnpj: !isPessoaFisica ? parte.numeroDocumento : undefined,
        tipo_parte: parte.tipoParte,
        polo: parte.polo,
        // id_pje removido
        processo_id: 0,
        trt: '',
        grau: '',
        numero_processo: '',
      } as unknown as UpsertTerceiroPorIdPessoaParams;
      
      const result = await upsertTerceiroPorIdPessoa(params);
      return result.sucesso && result.terceiro ? result.terceiro.id : null;
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
  representantes: RepresentantePJE[],
  tipoParte: TipoParteClassificacao,
  parteId: number,
  processo: ProcessoParaCaptura
): Promise<number> {
  let count = 0;

  for (const rep of representantes) {
    try {
      const tipo_pessoa: 'pf' | 'pj' = rep.tipoDocumento === 'CPF' ? 'pf' : 'pj';

      const result = await upsertRepresentantePorIdPessoa({
        id_pessoa_pje: rep.idPessoa,
        parte_tipo: tipoParte,
        parte_id: parteId,
        trt: processo.trt,
        grau: processo.grau,
        numero_processo: processo.numero_processo,
        tipo_pessoa,
        nome: rep.nome,
        cpf: tipo_pessoa === 'pf' ? rep.numeroDocumento : undefined,
        cnpj: tipo_pessoa === 'pj' ? rep.numeroDocumento : undefined,
        numero_oab: rep.numeroOAB || undefined,
        situacao_oab: (rep.situacaoOAB as unknown as SituacaoOAB) || undefined,
        tipo: (rep.tipo as unknown as TipoRepresentante) || undefined,
        emails: rep.email ? [rep.email] : undefined,
        ddd_celular: rep.telefones?.[0]?.ddd || undefined,
        numero_celular: rep.telefones?.[0]?.numero || undefined,
        dados_anteriores: rep.dadosCompletos as Record<string, unknown> | null | undefined,
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
    const result = await vincularParteProcesso({
      processo_id: processo.id,
      tipo_entidade: tipoParte,
      entidade_id: entidadeId,
      id_pje: parte.idParte,
      id_pessoa_pje: parte.idPessoa,
      tipo_parte: parte.tipoParte as TipoParteProcesso,
      polo: parte.polo as PoloProcessoParte, // É do tipo 'ATIVO' | 'PASSIVO' | 'OUTROS' mas a interface espera 'PoloProcessoParte'
      trt: processo.trt,
      grau: processo.grau,
      numero_processo: processo.numero_processo,
      principal: parte.principal,
      ordem,
      dados_pje_completo: parte.dadosCompletos,
    });

    return result.success;
  } catch (error) {
    console.error(
      `[CAPTURA-PARTES] Erro ao criar vínculo processo-parte para ${parte.nome}:`,
      error
    );
    return false;
  }
}

/**
 * Processa e salva endereço de uma parte
 * Retorna ID do endereço criado/atualizado ou null se falhou
 */
async function processarEndereco(
  parte: PartePJE,
  tipoParte: TipoParteClassificacao,
  entidadeId: number
): Promise<number | null> {
  // Verifica se a parte tem endereço
  if (!parte.dadosCompletos?.endereco) {
    return null;
  }

  const enderecoPJE = parte.dadosCompletos.endereco as unknown as EnderecoPJE;

  try {
    const result = await upsertEnderecoPorIdPje({
      id_pje: Number(enderecoPJE?.id || 0),
      entidade_tipo: tipoParte as EntidadeTipoEndereco,
      entidade_id: entidadeId,
      logradouro: enderecoPJE?.logradouro ? String(enderecoPJE.logradouro) : undefined,
      numero: enderecoPJE?.numero ? String(enderecoPJE.numero) : undefined,
      complemento: enderecoPJE?.complemento ? String(enderecoPJE.complemento) : undefined,
      bairro: enderecoPJE?.bairro ? String(enderecoPJE.bairro) : undefined,
      id_municipio_pje: enderecoPJE?.idMunicipio ? Number(enderecoPJE.idMunicipio) : undefined,
      municipio: enderecoPJE?.municipio ? String(enderecoPJE.municipio) : undefined,
      municipio_ibge: enderecoPJE?.municipioIbge ? String(enderecoPJE.municipioIbge) : undefined,
      estado_id_pje: enderecoPJE?.estado?.id ? Number(enderecoPJE.estado.id) : undefined,
      estado_sigla: enderecoPJE?.estado?.sigla ? String(enderecoPJE.estado.sigla) : undefined,
      estado_descricao: enderecoPJE?.estado?.descricao ? String(enderecoPJE.estado.descricao) : undefined,
      pais_id_pje: enderecoPJE?.pais?.id ? Number(enderecoPJE.pais.id) : undefined,
      pais_codigo: enderecoPJE?.pais?.codigo ? String(enderecoPJE.pais.codigo) : undefined,
      pais_descricao: enderecoPJE?.pais?.descricao ? String(enderecoPJE.pais.descricao) : undefined,
      cep: enderecoPJE?.nroCep ? String(enderecoPJE.nroCep) : undefined,
      classificacoes_endereco: enderecoPJE?.classificacoesEndereco || undefined,
      correspondencia: enderecoPJE?.correspondencia !== undefined ? Boolean(enderecoPJE.correspondencia) : undefined,
      situacao: (enderecoPJE?.situacao as unknown as SituacaoEndereco) || undefined,
      id_usuario_cadastrador_pje: enderecoPJE?.idUsuarioCadastrador ? Number(enderecoPJE.idUsuarioCadastrador) : undefined,
      data_alteracao_pje: enderecoPJE?.dtAlteracao ? String(enderecoPJE.dtAlteracao) : undefined,
    });

    if (result.sucesso && result.endereco) {
      console.log(
        `[CAPTURA-PARTES] Endereço salvo para ${parte.nome}: ${result.endereco.logradouro}, ${result.endereco.municipio}-${result.endereco.estado_sigla}`
      );
      return result.endereco.id;
    }

    return null;
  } catch (error) {
    console.error(`[CAPTURA-PARTES] Erro ao processar endereço de ${parte.nome}:`, error);
    return null;
  }
}
