import type { Page } from 'playwright';
import type { CapturaPartesResult, CapturaPartesErro, TipoParteClassificacao } from './types';
import type { PartePJE, RepresentantePJE } from '@/backend/api/pje-trt/partes/types';
import { obterPartesProcesso } from '@/backend/api/pje-trt/partes';
import { identificarTipoParte, validarDocumentoAdvogado, type AdvogadoIdentificacao } from './identificacao-partes.service';
import { upsertClientePorIdPessoa } from '@/backend/clientes/services/persistence/cliente-persistence.service';
import { upsertParteContrariaPorIdPessoa } from '@/backend/partes-contrarias/services/persistence/parte-contraria-persistence.service';
import { upsertTerceiroPorIdPessoa } from '@/backend/terceiros/services/persistence/terceiro-persistence.service';
import { vincularParteProcesso } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';
import { upsertRepresentantePorIdPessoa, atualizarRepresentante } from '@/backend/representantes/services/representantes-persistence.service';
import { upsertEnderecoPorIdPje } from '@/backend/enderecos/services/enderecos-persistence.service';
import type { CriarClientePFParams, CriarClientePJParams } from '@/backend/types/partes/clientes-types';
import type { CriarParteContrariaPFParams, CriarParteContrariaPJParams } from '@/backend/types/partes/partes-contrarias-types';
import type { UpsertTerceiroPorIdPessoaParams } from '@/backend/types/partes/terceiros-types';
import type { TipoParteProcesso, PoloProcessoParte } from '@/backend/types/partes';
import { TIPOS_PARTE_PROCESSO_VALIDOS } from '@/backend/types/partes/processo-partes-types';
import type { GrauAcervo } from '@/backend/types/acervo/types';
import type { EntidadeTipoEndereco, SituacaoEndereco, ClassificacaoEndereco } from '@/backend/types/partes/enderecos-types';
import { CAMPOS_MINIMOS_ENDERECO } from '@/backend/types/partes/enderecos-types';
import type { SituacaoOAB, TipoRepresentante, Polo } from '@/backend/types/representantes/representantes-types';
import { PartePJESchema, validarPartePJE, validarPartesArray } from './schemas';
import getLogger, { withCorrelationId } from '@/backend/utils/logger';
import { withRetry } from '@/backend/utils/retry';
import { CAPTURA_CONFIG } from './config';
import { ValidationError, PersistenceError, extractErrorInfo } from './errors';

/**
 * Normaliza o valor de polo do PJE para o formato interno
 * PJE pode retornar valores em diferentes formatos (uppercase, lowercase, variações)
 */
function normalizarPolo(poloStr: unknown): Polo | null {
  if (!poloStr || typeof poloStr !== 'string') {
    return null;
  }

  const poloNormalizado = poloStr.trim().toLowerCase();

  switch (poloNormalizado) {
    case 'ativo':
      return 'ativo';
    case 'passivo':
      return 'passivo';
    case 'outros':
    case 'outro':
    case 'terceiro':
      return 'outros';
    default:
      return 'outros';
  }
}

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
 * Função auxiliar para validar endereço do PJE
 * Utiliza CAMPOS_MINIMOS_ENDERECO para verificar campos obrigatórios
 */
function validarEnderecoPJE(endereco: EnderecoPJE): { valido: boolean; avisos: string[] } {
  const avisos: string[] = [];

  if (!endereco.id || endereco.id <= 0) {
    avisos.push('ID do endereço inválido ou ausente');
  }

  if (!endereco.logradouro?.trim()) {
    avisos.push('Logradouro obrigatório');
  }

  if (!endereco.municipio?.trim()) {
    avisos.push('Município obrigatório');
  }

  if (!endereco.estado?.sigla?.trim()) {
    avisos.push('Estado obrigatório');
  }

  if (!endereco.nroCep?.trim()) {
    avisos.push('CEP obrigatório');
  }

  // Mapeia os campos do PJE para os campos esperados
  const camposPJE: Record<string, unknown> = {
    logradouro: endereco.logradouro,
    municipio: endereco.municipio,
    cep: endereco.nroCep, // Nota: no PJE o campo é nroCep
  };

  // Verifica quais campos mínimos estão presentes
  const camposPresentes = CAMPOS_MINIMOS_ENDERECO.filter(campo => !!camposPJE[campo]);

  // Adiciona avisos para campos ausentes
  CAMPOS_MINIMOS_ENDERECO.forEach(campo => {
    if (!camposPJE[campo]) {
      avisos.push(`Endereço sem ${campo}`);
    }
  });

  // Endereço é válido se tiver ID válido E pelo menos um campo mínimo
  const valido = !!(endereco.id && endereco.id > 0 && camposPresentes.length > 0);
  return { valido, avisos };
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
 * Função auxiliar para extrair campos específicos do PJE de dadosCompletos
 */
function extrairCamposPJE(parte: PartePJE) {
  const dados = parte.dadosCompletos;
  const camposExtraidos: Record<string, unknown> = {};

  // Campos comuns
  camposExtraidos.tipo_documento = parte.tipoDocumento;
  camposExtraidos.status_pje = dados?.status as string | undefined;
  camposExtraidos.situacao_pje = dados?.situacao as string | undefined;
  camposExtraidos.login_pje = dados?.login as string | undefined;
  camposExtraidos.autoridade = dados?.autoridade !== undefined ? Boolean(dados.autoridade) : undefined;

  // Campos específicos de PF
  if (parte.tipoDocumento === 'CPF') {
    camposExtraidos.sexo = dados?.sexo as string | undefined;
    camposExtraidos.nome_genitora = dados?.nomeGenitora as string | undefined;
    camposExtraidos.naturalidade_id_pje = (dados?.naturalidade as any)?.id !== undefined ? Number((dados.naturalidade as any).id) : undefined;
    camposExtraidos.naturalidade_municipio = (dados?.naturalidade as any)?.municipio as string | undefined;
    camposExtraidos.naturalidade_estado_id_pje = (dados?.naturalidade as any)?.estado?.id !== undefined ? Number((dados.naturalidade as any).estado.id) : undefined;
    camposExtraidos.naturalidade_estado_sigla = (dados?.naturalidade as any)?.estado?.sigla as string | undefined;
    camposExtraidos.naturalidade_estado_descricao = (dados?.naturalidade as any)?.estado?.descricao as string | undefined;
    camposExtraidos.uf_nascimento_id_pje = (dados?.ufNascimento as any)?.id !== undefined ? Number((dados.ufNascimento as any).id) : undefined;
    camposExtraidos.uf_nascimento_sigla = (dados?.ufNascimento as any)?.sigla as string | undefined;
    camposExtraidos.uf_nascimento_descricao = (dados?.ufNascimento as any)?.descricao as string | undefined;
    camposExtraidos.pais_nascimento_id_pje = (dados?.paisNascimento as any)?.id !== undefined ? Number((dados.paisNascimento as any).id) : undefined;
    camposExtraidos.pais_nascimento_codigo = (dados?.paisNascimento as any)?.codigo as string | undefined;
    camposExtraidos.pais_nascimento_descricao = (dados?.paisNascimento as any)?.descricao as string | undefined;
    camposExtraidos.escolaridade_codigo = dados?.escolaridade !== undefined ? Number(dados.escolaridade) : undefined;
    camposExtraidos.situacao_cpf_receita_id = (dados?.situacaoCpfReceita as any)?.id !== undefined ? Number((dados.situacaoCpfReceita as any).id) : undefined;
    camposExtraidos.situacao_cpf_receita_descricao = (dados?.situacaoCpfReceita as any)?.descricao as string | undefined;
    camposExtraidos.pode_usar_celular_mensagem = dados?.podeUsarCelularMensagem !== undefined ? Boolean(dados.podeUsarCelularMensagem) : undefined;
  }

  // Campos específicos de PJ
  if (parte.tipoDocumento === 'CNPJ') {
    camposExtraidos.inscricao_estadual = dados?.inscricaoEstadual as string | undefined;
    camposExtraidos.data_abertura = dados?.dataAbertura as string | undefined;
    camposExtraidos.orgao_publico = dados?.orgaoPublico !== undefined ? Boolean(dados.orgaoPublico) : undefined;
    camposExtraidos.tipo_pessoa_codigo_pje = (dados?.tipoPessoa as any)?.codigo as string | undefined;
    camposExtraidos.tipo_pessoa_label_pje = (dados?.tipoPessoa as any)?.label as string | undefined;
    camposExtraidos.situacao_cnpj_receita_id = (dados?.situacaoCnpjReceita as any)?.id !== undefined ? Number((dados.situacaoCnpjReceita as any).id) : undefined;
    camposExtraidos.situacao_cnpj_receita_descricao = (dados?.situacaoCnpjReceita as any)?.descricao as string | undefined;
    camposExtraidos.ramo_atividade = dados?.ramoAtividade as string | undefined;
    camposExtraidos.cpf_responsavel = dados?.cpfResponsavel as string | undefined;
    camposExtraidos.oficial = dados?.oficial !== undefined ? Boolean(dados.oficial) : undefined;
    camposExtraidos.porte_codigo = (dados?.porte as any)?.codigo !== undefined ? Number((dados.porte as any).codigo) : undefined;
    camposExtraidos.porte_descricao = (dados?.porte as any)?.descricao as string | undefined;
    camposExtraidos.ultima_atualizacao_pje = dados?.ultimaAtualizacao as string | undefined;
  }

  // Logs para campos não encontrados (debug)
  const camposComunsEsperados = ['status', 'situacao', 'login', 'autoridade'];
  const camposPFEsperados = ['sexo', 'nomeGenitora', 'naturalidade', 'ufNascimento', 'paisNascimento', 'escolaridade', 'situacaoCpfReceita', 'podeUsarCelularMensagem'];
  const camposPJEsperados = ['inscricaoEstadual', 'dataAbertura', 'orgaoPublico', 'tipoPessoa', 'situacaoCnpjReceita', 'ramoAtividade', 'cpfResponsavel', 'oficial', 'porte', 'ultimaAtualizacao'];

  const camposNaoEncontrados: string[] = [];

  camposComunsEsperados.forEach(campo => {
    if (dados?.[campo] === undefined) camposNaoEncontrados.push(campo);
  });

  if (parte.tipoDocumento === 'CPF') {
    camposPFEsperados.forEach(campo => {
      if (dados?.[campo] === undefined) camposNaoEncontrados.push(campo);
    });
  } else if (parte.tipoDocumento === 'CNPJ') {
    camposPJEsperados.forEach(campo => {
      if (dados?.[campo] === undefined) camposNaoEncontrados.push(campo);
    });
  }

  if (camposNaoEncontrados.length > 0) {
    console.debug(`[DEBUG-CAMPOS-PJE] Campos não encontrados em dadosCompletos para parte ${parte.nome}: ${camposNaoEncontrados.join(', ')}`);
  }

  return camposExtraidos;
}

/**
 * Função auxiliar para extrair campos específicos do PJE de dadosCompletos para representantes
 */
function extrairCamposRepresentantePJE(rep: RepresentantePJE) {
  const dados = rep.dadosCompletos;
  const camposExtraidos: Record<string, unknown> = {};

  // Campos comuns
  camposExtraidos.situacao = dados?.situacao as string | undefined;
  camposExtraidos.status = dados?.status as string | undefined;
  camposExtraidos.principal = dados?.principal !== undefined ? Boolean(dados.principal) : undefined;
  camposExtraidos.endereco_desconhecido = dados?.enderecoDesconhecido !== undefined ? Boolean(dados.enderecoDesconhecido) : undefined;
  camposExtraidos.id_tipo_parte = dados?.idTipoParte !== undefined ? Number(dados.idTipoParte) : undefined;
  camposExtraidos.polo = normalizarPolo(dados?.polo);

  // Campos específicos de PF
  if (rep.tipoDocumento === 'CPF') {
    camposExtraidos.sexo = dados?.sexo as string | undefined;
    camposExtraidos.data_nascimento = dados?.dataNascimento as string | undefined;
    camposExtraidos.nome_mae = dados?.nomeMae as string | undefined;
    camposExtraidos.nome_pai = dados?.nomePai as string | undefined;
    camposExtraidos.nacionalidade = dados?.nacionalidade as string | undefined;
    camposExtraidos.estado_civil = dados?.estadoCivil as string | undefined;
    camposExtraidos.uf_nascimento = dados?.ufNascimento as string | undefined;
    camposExtraidos.municipio_nascimento = dados?.municipioNascimento as string | undefined;
    camposExtraidos.pais_nascimento = dados?.paisNascimento as string | undefined;
  }

  // Campos específicos de PJ
  if (rep.tipoDocumento === 'CNPJ') {
    camposExtraidos.razao_social = dados?.razaoSocial as string | undefined;
    camposExtraidos.nome_fantasia = dados?.nomeFantasia as string | undefined;
    camposExtraidos.inscricao_estadual = dados?.inscricaoEstadual as string | undefined;
    camposExtraidos.tipo_empresa = dados?.tipoEmpresa as string | undefined;
  }

  // Logs para campos não encontrados (debug)
  const camposComunsEsperados = ['situacao', 'status', 'principal', 'enderecoDesconhecido', 'idTipoParte', 'polo'];
  const camposPFEsperados = ['sexo', 'dataNascimento', 'nomeMae', 'nomePai', 'nacionalidade', 'estadoCivil', 'ufNascimento', 'municipioNascimento', 'paisNascimento'];
  const camposPJEsperados = ['razaoSocial', 'nomeFantasia', 'inscricaoEstadual', 'tipoEmpresa'];

  const camposNaoEncontrados: string[] = [];

  camposComunsEsperados.forEach(campo => {
    if (dados?.[campo] === undefined) camposNaoEncontrados.push(campo);
  });

  if (rep.tipoDocumento === 'CPF') {
    camposPFEsperados.forEach(campo => {
      if (dados?.[campo] === undefined) camposNaoEncontrados.push(campo);
    });
  } else if (rep.tipoDocumento === 'CNPJ') {
    camposPJEsperados.forEach(campo => {
      if (dados?.[campo] === undefined) camposNaoEncontrados.push(campo);
    });
  }

  if (camposNaoEncontrados.length > 0) {
    console.debug(`[DEBUG-CAMPOS-PJE] Campos não encontrados em dadosCompletos para representante ${rep.nome}: ${camposNaoEncontrados.join(', ')}`);
  }

  return camposExtraidos;
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
 * - Partes são processadas em paralelo com controle de concorrência
 * - Representantes são salvos em lote
 * - Tempo típico: 2-5s por processo (depende de quantidade de partes)
 */
export async function capturarPartesProcesso(
  page: Page,
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao
): Promise<CapturaPartesResult> {
  return withCorrelationId(async () => {
    const logger = getLogger({ service: 'captura-partes', processoId: processo.id });
    return capturarPartesProcessoInternal(page, processo, advogado, logger);
  });
}

/**
 * Função interna com a lógica de captura
 */
async function capturarPartesProcessoInternal(
  page: Page,
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao,
  logger: ReturnType<typeof getLogger>
): Promise<CapturaPartesResult> {
  const inicio = performance.now();
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

  const metricas = {
    buscarPartesPJE: 0,
    processarPartes: 0,
    processarRepresentantes: 0,
    processarEnderecos: 0,
    criarVinculos: 0,
  };

  try {
    logger.info({ numeroProcesso: processo.numero_processo }, 'Iniciando captura de partes');

    // 1. Valida documento do advogado UMA ÚNICA VEZ (antes de processar qualquer parte)
    // Se inválido, lança erro e interrompe toda a captura (evita erros repetidos por parte)
    validarDocumentoAdvogado(advogado);

    // 2. Busca partes via API PJE
    const inicioBuscar = performance.now();
    const { partes, payloadBruto } = await obterPartesProcesso(page, processo.id_pje);
    metricas.buscarPartesPJE = performance.now() - inicioBuscar;
    resultado.totalPartes = partes.length;
    resultado.payloadBruto = payloadBruto;

    logger.info({ totalPartes: partes.length, duracaoMs: metricas.buscarPartesPJE }, 'Partes encontradas no PJE');

    // Se não há partes, retorna resultado vazio
    if (partes.length === 0) {
      resultado.duracaoMs = performance.now() - inicio;
      return resultado;
    }

    // 3. Valida schema PJE antes do processamento
    const partesValidadas = validarPartesArray(partes);

    // 4. Processa partes em paralelo com controle de concorrência
    const inicioProcessar = performance.now();
    const resultadosProcessamento = await processarPartesEmLote(partesValidadas, processo, advogado, logger);
    metricas.processarPartes = performance.now() - inicioProcessar;

    // 5. Agrega resultados
    for (const res of resultadosProcessamento) {
      if (res.status === 'fulfilled') {
        const { tipoParte, repsCount, vinculoCriado } = res.value;
        if (tipoParte === 'cliente') resultado.clientes++;
        else if (tipoParte === 'parte_contraria') resultado.partesContrarias++;
        else if (tipoParte === 'terceiro') resultado.terceiros++;
        resultado.representantes += repsCount;
        if (vinculoCriado) resultado.vinculos++;
      } else {
        const error = res.reason;
        const errorInfo = extractErrorInfo(error);
        logger.error({ error: errorInfo }, 'Erro ao processar parte');
        // Adiciona erro ao resultado (assumindo que o erro contém info da parte)
        resultado.erros.push({
          parteIndex: -1, // Não temos índice exato em paralelo
          parteDados: { idParte: 0, nome: 'Desconhecido', tipoParte: 'DESCONHECIDO' },
          erro: errorInfo.message,
        });
      }
    }

    resultado.duracaoMs = performance.now() - inicio;

    logger.info({
      ...resultado,
      metricas,
    }, 'Captura concluída');

    // Alerta se performance abaixo do esperado
    if (resultado.duracaoMs > CAPTURA_CONFIG.PERFORMANCE_THRESHOLD_MS) {
      logger.warn({
        ...resultado,
        metricas,
        threshold: CAPTURA_CONFIG.PERFORMANCE_THRESHOLD_MS
      }, 'Performance abaixo do esperado');
    }

    return resultado;
  } catch (error) {
    const errorInfo = extractErrorInfo(error);
    logger.error(errorInfo, 'Erro fatal ao capturar partes');

    // Atualiza duração e propaga erro
    resultado.duracaoMs = performance.now() - inicio;
    throw error;
  }
}

/**
 * Processa partes em lote com controle de concorrência
 * Mantém índice global de ordem para garantir ordenação consistente em processo_partes
 */
async function processarPartesEmLote(
  partes: PartePJE[],
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao,
  logger: ReturnType<typeof getLogger>
): Promise<PromiseSettledResult<{ tipoParte: TipoParteClassificacao; repsCount: number; vinculoCriado: boolean }>[]> {
  // Cria pares de (parte, índice global) para manter ordenação
  const partesComIndice = partes.map((parte, indexGlobal) => ({ parte, indexGlobal }));

  // Se paralelização não estiver habilitada, processa sequencialmente
  if (!CAPTURA_CONFIG.ENABLE_PARALLEL_PROCESSING) {
    const resultados: PromiseSettledResult<any>[] = [];
    for (const { parte, indexGlobal } of partesComIndice) {
      try {
        const resultado = await processarParteComRetry(parte, indexGlobal, processo, advogado, logger);
        resultados.push({ status: 'fulfilled' as const, value: resultado });
      } catch (error) {
        resultados.push({ status: 'rejected' as const, reason: error });
      }
    }
    return resultados;
  }

  // Divide em lotes para controlar concorrência
  const lotes: Array<Array<{ parte: PartePJE; indexGlobal: number }>> = [];
  for (let i = 0; i < partesComIndice.length; i += CAPTURA_CONFIG.MAX_CONCURRENT_PARTES) {
    lotes.push(partesComIndice.slice(i, i + CAPTURA_CONFIG.MAX_CONCURRENT_PARTES));
  }

  const todosResultados: PromiseSettledResult<any>[] = [];

  for (const lote of lotes) {
    const promises = lote.map(({ parte, indexGlobal }) =>
      processarParteComRetry(parte, indexGlobal, processo, advogado, logger)
    );
    const resultadosLote = await Promise.allSettled(promises);
    todosResultados.push(...resultadosLote);
  }

  return todosResultados;
}

/**
 * Processa uma parte com retry e transação
 */
async function processarParteComRetry(
  parte: PartePJE,
  index: number,
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao,
  logger: ReturnType<typeof getLogger>
): Promise<{ tipoParte: TipoParteClassificacao; repsCount: number; vinculoCriado: boolean }> {
  return withRetry(async () => {
    logger.info({ parteIndex: index, parteName: parte.nome }, 'Processando parte');

    // Valida parte
    validarPartePJE(parte);

    // Identifica tipo da parte
    const tipoParte = identificarTipoParte(parte, advogado);

    // Processa com transação
    const { repsCount, vinculoCriado } = await processarParteComTransacao(parte, tipoParte, processo, index, logger);

    return { tipoParte, repsCount, vinculoCriado };
  }, {
    maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
    baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
    maxDelay: CAPTURA_CONFIG.RETRY_MAX_DELAY_MS
  });
}

/**
 * Processa uma parte com transação (upsert entidade + vínculo + endereço)
 */
async function processarParteComTransacao(
  parte: PartePJE,
  tipoParte: TipoParteClassificacao,
  processo: ProcessoParaCaptura,
  ordem: number,
  logger: ReturnType<typeof getLogger>
): Promise<{ repsCount: number; vinculoCriado: boolean }> {
  let entidadeId: number | null = null;
  let entidadeCriada = false;
  let vinculoCriado = false;

  try {
    // 1. Upsert da entidade
    const resultado = await processarParte(parte, tipoParte, processo);
    if (!resultado) {
      throw new PersistenceError('Falha ao criar entidade', 'insert', tipoParte, { parte: parte.nome });
    }
    entidadeId = resultado.id;
    entidadeCriada = resultado.criado;

    // 2. Processa endereço e vincula
    const enderecoId = await processarEndereco(parte, tipoParte, entidadeId);
    if (enderecoId) {
      await vincularEnderecoNaEntidade(tipoParte, entidadeId, enderecoId);
    }

    // 3. Cria vínculo processo-parte
    vinculoCriado = await criarVinculoProcessoParte(processo, tipoParte, entidadeId, parte, ordem);
    if (!vinculoCriado) {
      throw new PersistenceError('Falha ao criar vínculo', 'insert', 'vinculo', { parte: parte.nome });
    }

    // 4. Processa representantes
    const repsCount = parte.representantes ? await processarRepresentantes(parte.representantes, tipoParte, entidadeId, processo, logger) : 0;

    return { repsCount, vinculoCriado };
  } catch (error) {
    // Rollback manual: só deleta entidade se ela foi criada NESTA operação
    // Se foi apenas atualizada, mantém a entidade existente
    if (entidadeId && entidadeCriada && !vinculoCriado) {
      try {
        await deletarEntidade(tipoParte, entidadeId);
        logger.warn({ entidadeId, tipoParte }, 'Rollback: entidade criada deletada devido a erro');
      } catch (rollbackError) {
        logger.error({ rollbackError, entidadeId }, 'Erro no rollback da entidade');
      }
    }
    throw error;
  }
}

/**
 * Deleta entidade (para rollback)
 */
async function deletarEntidade(tipoParte: TipoParteClassificacao, entidadeId: number): Promise<void> {
  const { createClient } = await import('@/backend/utils/supabase/server-client');
  const supabase = await createClient();

  let tableName: string;
  if (tipoParte === 'cliente') tableName = 'clientes';
  else if (tipoParte === 'parte_contraria') tableName = 'partes_contrarias';
  else tableName = 'terceiros';

  await supabase.from(tableName).delete().eq('id', entidadeId);
}

/**
 * Processa uma parte individual: faz upsert da entidade apropriada
 * Retorna objeto com ID da entidade e indicador se foi criada (true) ou atualizada (false)
 * Retorna null se falhou
 */
async function processarParte(
  parte: PartePJE,
  tipoParte: TipoParteClassificacao,
  processo: ProcessoParaCaptura
): Promise<{ id: number; criado: boolean } | null> {
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
    dados_pje_completo: parte.dadosCompletos,
  };

  // Extrai campos adicionais do PJE
  const camposExtras = extrairCamposPJE(parte);

  // Mescla dados comuns com campos extras
  const dadosCompletos = { ...dadosComuns, ...camposExtras };

  try {
    if (tipoParte === 'cliente') {
      // Upsert em tabela clientes
      if (isPessoaFisica) {
        const params: CriarClientePFParams & { id_pessoa_pje: number } = {
          ...dadosCompletos,
          tipo_pessoa: 'pf',
          cpf: parte.numeroDocumento,
        };
        const result = await withRetry(() => upsertClientePorIdPessoa(params), {
          maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
          baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
        });
        return result.sucesso && result.cliente ? { id: result.cliente.id, criado: result.criado || false } : null;
      } else {
        const params: CriarClientePJParams & { id_pessoa_pje: number } = {
          ...dadosCompletos,
          tipo_pessoa: 'pj',
          cnpj: parte.numeroDocumento,
        };
        const result = await withRetry(() => upsertClientePorIdPessoa(params), {
          maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
          baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
        });
        return result.sucesso && result.cliente ? { id: result.cliente.id, criado: result.criado || false } : null;
      }
    } else if (tipoParte === 'parte_contraria') {
      // Upsert em tabela partes_contrarias
      if (isPessoaFisica) {
        const params: CriarParteContrariaPFParams & { id_pessoa_pje: number } = {
          ...dadosComuns,
          tipo_pessoa: 'pf',
          cpf: parte.numeroDocumento,
        };
        const result = await withRetry(() => upsertParteContrariaPorIdPessoa(params), {
          maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
          baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
        });
        return result.sucesso && result.parteContraria ? { id: result.parteContraria.id, criado: result.criado || false } : null;
      } else {
        const params: CriarParteContrariaPJParams & { id_pessoa_pje: number } = {
          ...dadosComuns,
          tipo_pessoa: 'pj',
          cnpj: parte.numeroDocumento,
        };
        const result = await withRetry(() => upsertParteContrariaPorIdPessoa(params), {
          maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
          baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
        });
        return result.sucesso && result.parteContraria ? { id: result.parteContraria.id, criado: result.criado || false } : null;
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
        processo_id: processo.id,
        trt: processo.trt,
        grau: processo.grau,
        numero_processo: processo.numero_processo,
      } as unknown as UpsertTerceiroPorIdPessoaParams;

      const result = await withRetry(() => upsertTerceiroPorIdPessoa(params), {
        maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
        baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
      });
      return result.sucesso && result.terceiro ? { id: result.terceiro.id, criado: result.criado || false } : null;
    }
  } catch (error) {
    throw new PersistenceError(`Erro ao processar parte ${parte.nome}`, 'upsert', tipoParte, { parte: parte.nome, error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Processa e salva representantes de uma parte em lote
 * Retorna quantidade de representantes salvos com sucesso
 */
async function processarRepresentantes(
  representantes: RepresentantePJE[],
  tipoParte: TipoParteClassificacao,
  parteId: number,
  processo: ProcessoParaCaptura,
  logger: ReturnType<typeof getLogger>
): Promise<number> {
  let count = 0;

  logger.info({ count: representantes.length, parteId }, 'Processando representantes');

  // Coleta todos os parâmetros primeiro
  const representantesParams = representantes.map((rep, index) => {
    const tipo_pessoa: 'pf' | 'pj' = rep.tipoDocumento === 'CPF' ? 'pf' : 'pj';

    // Extrai campos extras do PJE
    const camposExtras = extrairCamposRepresentantePJE(rep);

    return {
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
      ordem: index,
      ...camposExtras,
    };
  });

  // Upsert em lote com Promise.allSettled
  const promises = representantesParams.map(params =>
    withRetry(() => upsertRepresentantePorIdPessoa(params), {
      maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
      baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
    })
  );

  const resultados = await Promise.allSettled(promises);

  for (let i = 0; i < resultados.length; i++) {
    const res = resultados[i];
    const rep = representantes[i];

    if (res.status === 'fulfilled') {
      const result = res.value;
      if (result.sucesso && result.representante) {
        count++;
        logger.debug({ nome: rep.nome, numeroDocumento: rep.numeroDocumento }, 'Representante salvo');

        // Processa endereço do representante se houver
        if (rep.dadosCompletos?.endereco) {
          const enderecoId = await processarEnderecoRepresentante(rep, tipoParte, parteId, processo);
          if (enderecoId) {
            await atualizarRepresentante({
              id: result.representante.id,
              endereco_id: enderecoId,
            });
          }
        }
      } else {
        logger.warn({ nome: rep.nome, erro: result.erro }, 'Falha ao salvar representante');
      }
    } else {
      logger.error({ nome: rep.nome, error: res.reason }, 'Erro ao salvar representante');
    }
  }

  logger.info({ salvos: count, total: representantes.length }, 'Representantes processados');
  return count;
}

/**
 * Mapeia polo do PJE para o sistema interno
 */
function mapearPoloParaSistema(poloPJE: 'ATIVO' | 'PASSIVO' | 'OUTROS'): PoloProcessoParte {
  switch (poloPJE) {
    case 'ATIVO':
      return 'ATIVO';
    case 'PASSIVO':
      return 'PASSIVO';
    case 'OUTROS':
      return 'TERCEIRO';
    default:
      return 'TERCEIRO';
  }
}

/**
 * Valida tipo de parte do PJE contra tipos válidos do sistema
 * Usa TIPOS_PARTE_PROCESSO_VALIDOS como fonte única de verdade
 */
function validarTipoParteProcesso(tipoParte: string): TipoParteProcesso {
  // Verifica se o tipo existe nas chaves do objeto Record
  if (tipoParte in TIPOS_PARTE_PROCESSO_VALIDOS) {
    return tipoParte as TipoParteProcesso;
  } else {
    return 'OUTRO';
  }
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
  // Validação prévia
  if (entidadeId <= 0) {
    throw new ValidationError('entidadeId inválido', { entidadeId, parte: parte.nome });
  }
  if (!parte.idParte) {
    throw new ValidationError('idParte ausente', { parte: parte.nome });
  }

  try {
    const result = await withRetry(() => vincularParteProcesso({
      processo_id: processo.id,
      tipo_entidade: tipoParte,
      entidade_id: entidadeId,
      id_pje: parte.idParte,
      id_pessoa_pje: parte.idPessoa,
      tipo_parte: validarTipoParteProcesso(parte.tipoParte),
      polo: mapearPoloParaSistema(parte.polo),
      trt: processo.trt,
      grau: processo.grau,
      numero_processo: processo.numero_processo,
      principal: parte.principal,
      ordem,
      dados_pje_completo: parte.dadosCompletos,
    }), {
      maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
      baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
    });

    if (!result.success) {
      throw new PersistenceError('Falha ao criar vínculo', 'insert', 'vinculo', { processo_id: processo.id, tipo_entidade: tipoParte, entidade_id: entidadeId, erro: result.error });
    }

    return true;
  } catch (error) {
    throw error;
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

  const { valido, avisos } = validarEnderecoPJE(enderecoPJE);
  if (!valido) {
    return null;
  }

  try {
    const result = await withRetry(() => upsertEnderecoPorIdPje({
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
      estado: enderecoPJE?.estado?.sigla ? String(enderecoPJE.estado.sigla) : undefined,
      pais_id_pje: enderecoPJE?.pais?.id ? Number(enderecoPJE.pais.id) : undefined,
      pais_codigo: enderecoPJE?.pais?.codigo ? String(enderecoPJE.pais.codigo) : undefined,
      pais_descricao: enderecoPJE?.pais?.descricao ? String(enderecoPJE.pais.descricao) : undefined,
      pais: enderecoPJE?.pais?.descricao ? String(enderecoPJE.pais.descricao) : undefined,
      cep: enderecoPJE?.nroCep ? String(enderecoPJE.nroCep) : undefined,
      classificacoes_endereco: enderecoPJE?.classificacoesEndereco || undefined,
      correspondencia: enderecoPJE?.correspondencia !== undefined ? Boolean(enderecoPJE.correspondencia) : undefined,
      situacao: (enderecoPJE?.situacao as unknown as SituacaoEndereco) || undefined,
      id_usuario_cadastrador_pje: enderecoPJE?.idUsuarioCadastrador ? Number(enderecoPJE.idUsuarioCadastrador) : undefined,
      data_alteracao_pje: enderecoPJE?.dtAlteracao ? String(enderecoPJE.dtAlteracao) : undefined,
      dados_pje_completo: enderecoPJE as unknown as Record<string, unknown>, // Store complete PJE address JSON for audit
    }), {
      maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
      baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
    });

    if (result.sucesso && result.endereco) {
      return result.endereco.id;
    }

    return null;
  } catch (error) {
    throw new PersistenceError(`Erro ao processar endereço de ${parte.nome}`, 'upsert', 'endereco', { parte: parte.nome, error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Processa e salva endereço de um representante
 * Retorna ID do endereço criado/atualizado ou null se falhou
 */
async function processarEnderecoRepresentante(
  rep: RepresentantePJE,
  tipoParte: TipoParteClassificacao,
  parteId: number,
  processo: ProcessoParaCaptura
): Promise<number | null> {
  // Verifica se o representante tem endereço
  if (!rep.dadosCompletos?.endereco) {
    return null;
  }

  const enderecoPJE = rep.dadosCompletos.endereco as unknown as EnderecoPJE;

  const { valido, avisos } = validarEnderecoPJE(enderecoPJE);
  if (!valido) {
    return null;
  }

  try {
    const result = await withRetry(() => upsertEnderecoPorIdPje({
      id_pje: Number(enderecoPJE?.id || 0),
      entidade_tipo: tipoParte as EntidadeTipoEndereco,
      entidade_id: parteId,
      trt: processo.trt,
      grau: processo.grau,
      numero_processo: processo.numero_processo,
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
      estado: enderecoPJE?.estado?.sigla ? String(enderecoPJE.estado.sigla) : undefined,
      pais_id_pje: enderecoPJE?.pais?.id ? Number(enderecoPJE.pais.id) : undefined,
      pais_codigo: enderecoPJE?.pais?.codigo ? String(enderecoPJE.pais.codigo) : undefined,
      pais_descricao: enderecoPJE?.pais?.descricao ? String(enderecoPJE.pais.descricao) : undefined,
      pais: enderecoPJE?.pais?.descricao ? String(enderecoPJE.pais.descricao) : undefined,
      cep: enderecoPJE?.nroCep ? String(enderecoPJE.nroCep) : undefined,
      classificacoes_endereco: enderecoPJE?.classificacoesEndereco || undefined,
      correspondencia: enderecoPJE?.correspondencia !== undefined ? Boolean(enderecoPJE.correspondencia) : undefined,
      situacao: (enderecoPJE?.situacao as unknown as SituacaoEndereco) || undefined,
      id_usuario_cadastrador_pje: enderecoPJE?.idUsuarioCadastrador ? Number(enderecoPJE.idUsuarioCadastrador) : undefined,
      data_alteracao_pje: enderecoPJE?.dtAlteracao ? String(enderecoPJE.dtAlteracao) : undefined,
      dados_pje_completo: enderecoPJE as unknown as Record<string, unknown>, // Store complete PJE address JSON for audit
    }), {
      maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
      baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
    });

    if (result.sucesso && result.endereco) {
      return result.endereco.id;
    }

    return null;
  } catch (error) {
    throw new PersistenceError(`Erro ao processar endereço de representante ${rep.nome}`, 'upsert', 'endereco', { representante: rep.nome, error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Vincula endereço à entidade (cliente, parte_contraria ou terceiro)
 * Atualiza o campo endereco_id na tabela apropriada
 */
async function vincularEnderecoNaEntidade(
  tipoParte: TipoParteClassificacao,
  entidadeId: number,
  enderecoId: number
): Promise<void> {
  try {
    const { createClient } = await import('@/backend/utils/supabase/server-client');
    const supabase = await createClient();

    let tableName: string;
    if (tipoParte === 'cliente') {
      tableName = 'clientes';
    } else if (tipoParte === 'parte_contraria') {
      tableName = 'partes_contrarias';
    } else {
      tableName = 'terceiros';
    }

    const { error } = await supabase
      .from(tableName)
      .update({ endereco_id: enderecoId })
      .eq('id', entidadeId);

    if (error) {
      throw new PersistenceError(`Erro ao vincular endereço ${enderecoId} à ${tipoParte} ${entidadeId}`, 'update', tipoParte, { enderecoId, entidadeId, error: error.message });
    }
  } catch (error) {
    throw error;
  }
}