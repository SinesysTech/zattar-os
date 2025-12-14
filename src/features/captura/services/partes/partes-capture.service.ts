import type { Page } from 'playwright';
import type { CapturaPartesResult, TipoParteClassificacao } from './types';
import type { PartePJE, RepresentantePJE } from '@/features/captura/pje-trt/partes/types';
import { obterPartesProcesso } from '@/features/captura/pje-trt/partes';
import { identificarTipoParte, validarDocumentoAdvogado, type AdvogadoIdentificacao } from './identificacao-partes.service';
import { upsertClientePorCPF, upsertClientePorCNPJ, buscarClientePorCPF, buscarClientePorCNPJ, upsertParteContrariaPorCPF, upsertParteContrariaPorCNPJ, buscarParteContrariaPorCPF, buscarParteContrariaPorCNPJ } from '@/features/partes/repository-compat';
import { upsertTerceiroPorCPF, upsertTerceiroPorCNPJ, buscarTerceiroPorCPF, buscarTerceiroPorCNPJ, criarTerceiroSemDocumento } from '@/features/partes/services/terceiros/persistence/terceiro-persistence.service';
import { vincularParteProcesso } from '@/features/partes/repository-processo-partes';
import { upsertRepresentantePorCPF, buscarRepresentantePorCPF } from '@/features/partes/repository-representantes';
import { upsertEnderecoPorIdPje } from '@/features/enderecos/repository';
import type { CriarClientePFParams, CriarClientePJParams, CriarParteContrariaPFParams, CriarParteContrariaPJParams, CriarTerceiroPFParams, CriarTerceiroPJParams, UpsertTerceiroPorCPFParams, UpsertTerceiroPorCNPJParams } from '@/types/contracts/partes';
import type { GrauProcesso } from '@/features/partes/domain';
import type { ClassificacaoEndereco, EntidadeTipoEndereco, SituacaoEndereco } from '@/features/enderecos/types';
import type { SituacaoOAB, TipoRepresentante, Polo } from '@/types/domain/representantes';
import { validarPartePJE, validarPartesArray } from './schemas';
import getLogger, { withCorrelationId } from '@/lib/logger';
import { withRetry } from '@/lib/utils/retry';
import { CAPTURA_CONFIG } from './config';
import { ValidationError, PersistenceError, extractErrorInfo } from './errors';
import { upsertCadastroPJE, buscarEntidadePorIdPessoaPJE } from '@/features/partes/repository-cadastros-pje';
import type { TipoParteProcesso, PoloProcessoParte } from '@/types/domain/processo-partes';
import { TIPOS_PARTE_PROCESSO_VALIDOS } from '@/types/domain/processo-partes';

// ============================================================================
// Tipos para estruturas do PJE (dadosCompletos)
// ============================================================================

/** Estrutura de estado retornada pelo PJE */
interface EstadoPJE {
  id?: number;
  sigla?: string;
  descricao?: string;
}

/** Estrutura de naturalidade retornada pelo PJE */
interface NaturalidadePJE {
  id?: number;
  municipio?: string;
  estado?: EstadoPJE;
}

/** Estrutura de país retornada pelo PJE */
interface PaisPJE {
  id?: number;
  codigo?: string;
  descricao?: string;
}

/** Estrutura de situação na Receita (CPF/CNPJ) retornada pelo PJE */
interface SituacaoReceitaPJE {
  id?: number;
  descricao?: string;
}

/** Tipo para resultado de processamento de parte */
interface ProcessamentoParteResult {
  tipoParte: TipoParteClassificacao;
  repsCount: number;
  vinculoCriado: boolean;
}

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

/** Campos mínimos para endereço válido (pelo menos um deve estar presente) */
const CAMPOS_MINIMOS_ENDERECO = ['logradouro', 'municipio', 'cep'] as const;

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
 * 
 * CAMPOS OBRIGATÓRIOS:
 * - id_pje: Usado para buscar partes na API do PJE
 * - trt: Usado para registrar em cadastros_pje
 * - grau: Usado para registrar em cadastros_pje
 * 
 * CAMPOS OPCIONAIS:
 * - id: ID na tabela acervo. Se fornecido, cria vínculo processo_partes
 * - numero_processo: Número CNJ. Usado em logs e vínculo (opcional)
 */
export interface ProcessoParaCaptura {
  /** ID interno do processo no PJE (OBRIGATÓRIO) */
  id_pje: number;
  /** TRT do processo (ex: "TRT3", "TRT5") (OBRIGATÓRIO) */
  trt: string;
  /** Grau do processo (OBRIGATÓRIO) */
  grau: GrauProcesso;
  /** ID do processo na tabela acervo (OPCIONAL - se não fornecido, não cria vínculo) */
  id?: number;
  /** Número CNJ do processo (OPCIONAL - usado em logs e vínculo) */
  numero_processo?: string;
}

/**
 * Função auxiliar para extrair campos específicos do PJE de dadosCompletos
 * 
 * ESTRUTURA DO JSON DO PJE:
 * - Campos comuns ficam na raiz de dadosCompletos (status, situacao, autoridade)
 * - Campos de pessoa física ficam em dadosCompletos.pessoaFisica
 * - Campos de pessoa jurídica ficam em dadosCompletos.pessoaJuridica
 * 
 * NOTA: O login pode vir na raiz OU dentro de pessoaFisica/pessoaJuridica
 */
function extrairCamposPJE(parte: PartePJE) {
  const dados = parte.dadosCompletos;
  const camposExtraidos: Record<string, unknown> = {};

  // Extrair objetos específicos de PF e PJ
  const pessoaFisica = dados?.pessoaFisica as Record<string, unknown> | undefined;
  const pessoaJuridica = dados?.pessoaJuridica as Record<string, unknown> | undefined;

  // Campos comuns (podem estar na raiz ou dentro de pessoaFisica/pessoaJuridica)
  camposExtraidos.tipo_documento = parte.tipoDocumento;
  camposExtraidos.status_pje = dados?.status as string | undefined;
  camposExtraidos.situacao_pje = dados?.situacao as string | undefined;
  camposExtraidos.autoridade = dados?.autoridade !== undefined ? Boolean(dados.autoridade) : undefined;

  // Login pode estar na raiz OU dentro de pessoaFisica/pessoaJuridica
  camposExtraidos.login_pje = (dados?.login ?? pessoaFisica?.login ?? pessoaJuridica?.login) as string | undefined;

  // Campos específicos de PF (vêm de dadosCompletos.pessoaFisica)
  if (parte.tipoDocumento === 'CPF' && pessoaFisica) {
    // Sexo pode vir como "sexo" (texto) ou "codigoSexo" (código)
    camposExtraidos.sexo = (pessoaFisica.sexo ?? dados?.sexo) as string | undefined;
    camposExtraidos.nome_genitora = pessoaFisica.nomeGenitora as string | undefined;

    // Naturalidade (cast para tipo específico)
    const naturalidade = pessoaFisica.naturalidade as NaturalidadePJE | undefined;
    if (naturalidade) {
      camposExtraidos.naturalidade_id_pje = naturalidade.id !== undefined ? Number(naturalidade.id) : undefined;
      // Nome do município pode vir como "nome" ou "municipio" dependendo do TRT
      camposExtraidos.naturalidade_municipio = (naturalidade as Record<string, unknown>).nome as string | undefined ?? naturalidade.municipio;
      camposExtraidos.naturalidade_estado_id_pje = naturalidade.estado?.id !== undefined ? Number(naturalidade.estado.id) : undefined;
      camposExtraidos.naturalidade_estado_sigla = naturalidade.estado?.sigla;
      // NOTA: naturalidade_estado_descricao não existe no schema de terceiros
    }

    // UF Nascimento (cast para tipo específico)
    const ufNascimento = pessoaFisica.ufNascimento as EstadoPJE | undefined;
    if (ufNascimento) {
      camposExtraidos.uf_nascimento_id_pje = ufNascimento.id !== undefined ? Number(ufNascimento.id) : undefined;
      camposExtraidos.uf_nascimento_sigla = ufNascimento.sigla;
      camposExtraidos.uf_nascimento_descricao = ufNascimento.descricao;
    }

    // País Nascimento (cast para tipo específico)
    const paisNascimento = pessoaFisica.paisNascimento as PaisPJE | undefined;
    if (paisNascimento) {
      camposExtraidos.pais_nascimento_id_pje = paisNascimento.id !== undefined ? Number(paisNascimento.id) : undefined;
      camposExtraidos.pais_nascimento_codigo = paisNascimento.codigo;
      camposExtraidos.pais_nascimento_descricao = paisNascimento.descricao;
    }

    camposExtraidos.escolaridade_codigo = pessoaFisica.escolaridade !== undefined ? Number(pessoaFisica.escolaridade) : undefined;

    // Situação CPF Receita - o campo no PJE é "situacaoCpfReceitaFederal" (não "situacaoCpfReceita")
    const situacaoCpfReceita = pessoaFisica.situacaoCpfReceitaFederal as SituacaoReceitaPJE | undefined;
    if (situacaoCpfReceita) {
      camposExtraidos.situacao_cpf_receita_id = situacaoCpfReceita.id !== undefined ? Number(situacaoCpfReceita.id) : undefined;
      camposExtraidos.situacao_cpf_receita_descricao = situacaoCpfReceita.descricao;
    }

    // Campo é "podeUsarCelularParaMensagem" (não "podeUsarCelularMensagem")
    camposExtraidos.pode_usar_celular_mensagem = pessoaFisica.podeUsarCelularParaMensagem !== undefined
      ? Boolean(pessoaFisica.podeUsarCelularParaMensagem)
      : undefined;
  }

  // Campos específicos de PJ (vêm de dadosCompletos.pessoaJuridica)
  if (parte.tipoDocumento === 'CNPJ' && pessoaJuridica) {
    camposExtraidos.inscricao_estadual = pessoaJuridica.inscricaoEstadual as string | undefined;
    camposExtraidos.data_abertura = pessoaJuridica.dataAbertura as string | undefined;
    camposExtraidos.orgao_publico = pessoaJuridica.orgaoPublico !== undefined ? Boolean(pessoaJuridica.orgaoPublico) : undefined;

    // Tipo Pessoa - pode vir como objeto {codigo, label} ou strings separadas
    const tipoPessoaCodigo = pessoaJuridica.tipoPessoaCodigo as string | undefined;
    const tipoPessoaLabel = pessoaJuridica.tipoPessoaLabel as string | undefined;
    camposExtraidos.tipo_pessoa_codigo_pje = tipoPessoaCodigo;
    camposExtraidos.tipo_pessoa_label_pje = tipoPessoaLabel ?? pessoaJuridica.dsTipoPessoa as string | undefined;

    // Situação CNPJ Receita - o campo no PJE é "situacaoCnpjReceitaFederal"
    const situacaoCnpjReceita = pessoaJuridica.situacaoCnpjReceitaFederal as SituacaoReceitaPJE | undefined;
    if (situacaoCnpjReceita) {
      camposExtraidos.situacao_cnpj_receita_id = situacaoCnpjReceita.id !== undefined ? Number(situacaoCnpjReceita.id) : undefined;
      camposExtraidos.situacao_cnpj_receita_descricao = situacaoCnpjReceita.descricao;
    }

    camposExtraidos.ramo_atividade = pessoaJuridica.dsRamoAtividade as string | undefined;
    camposExtraidos.cpf_responsavel = pessoaJuridica.numeroCpfResponsavel as string | undefined;
    camposExtraidos.oficial = pessoaJuridica.oficial !== undefined ? Boolean(pessoaJuridica.oficial) : undefined;

    // Porte - pode vir como objeto ou campos separados (porteCodigo, porteLabel)
    const porteCodigo = pessoaJuridica.porteCodigo as number | undefined;
    const porteLabel = pessoaJuridica.porteLabel as string | undefined;
    camposExtraidos.porte_codigo = porteCodigo !== undefined ? Number(porteCodigo) : undefined;
    camposExtraidos.porte_descricao = porteLabel;

    camposExtraidos.ultima_atualizacao_pje = pessoaJuridica.ultimaAtualizacao as string | undefined;
  }

  return camposExtraidos;
}

/**
 * Função auxiliar para extrair campos específicos do PJE de dadosCompletos para representantes
 * NOTA: Representantes (advogados) têm dados limitados na API do PJE - apenas campos básicos
 */
function extrairCamposRepresentantePJE(rep: RepresentantePJE) {
  const dados = rep.dadosCompletos;
  const camposExtraidos: Record<string, unknown> = {};

  // Campos disponíveis para representantes na API do PJE
  camposExtraidos.situacao = dados?.situacao as string | undefined;
  camposExtraidos.status = dados?.status as string | undefined;
  camposExtraidos.principal = dados?.principal !== undefined ? Boolean(dados.principal) : undefined;
  camposExtraidos.endereco_desconhecido = dados?.enderecoDesconhecido !== undefined ? Boolean(dados.enderecoDesconhecido) : undefined;
  camposExtraidos.id_tipo_parte = dados?.idTipoParte !== undefined ? Number(dados.idTipoParte) : undefined;
  camposExtraidos.polo = normalizarPolo(dados?.polo);

  // Sexo está disponível para representantes PF
  if (rep.tipoDocumento === 'CPF') {
    camposExtraidos.sexo = dados?.sexo as string | undefined;
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
    const logger = getLogger({ service: 'captura-partes', processoId: processo.id ?? processo.id_pje });
    return capturarPartesProcessoInternal(page, processo, advogado, logger);
  });
}

/**
 * Função: persistirPartesProcesso
 *
 * PROPÓSITO:
 * Persiste partes já buscadas de um processo. Diferente de capturarPartesProcesso,
 * esta função NÃO faz busca na API do PJE - ela apenas persiste as partes fornecidas.
 * Útil quando as partes já foram buscadas em uma etapa anterior (ex: dados-complementares.service).
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Recebe partes já buscadas como parâmetro
 * 2. Para cada parte:
 *    a. Identifica tipo (cliente/parte_contraria/terceiro)
 *    b. Faz upsert da entidade apropriada
 *    c. Processa e salva endereço (se houver)
 *    d. Salva representantes da parte
 *    e. Cria vínculo em processo_partes (se processo.id estiver disponível)
 * 3. Retorna resultado com contadores e erros
 */
export async function persistirPartesProcesso(
  partes: PartePJE[],
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao
): Promise<CapturaPartesResult> {
  return withCorrelationId(async () => {
    const logger = getLogger({ service: 'persistir-partes', processoId: processo.id ?? processo.id_pje });
    return persistirPartesProcessoInternal(partes, processo, advogado, logger);
  });
}

/**
 * Função interna para persistir partes já buscadas
 */
async function persistirPartesProcessoInternal(
  partes: PartePJE[],
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao,
  logger: ReturnType<typeof getLogger>
): Promise<CapturaPartesResult> {
  const inicio = performance.now();
  const resultado: CapturaPartesResult = {
    processoId: processo.id ?? processo.id_pje,
    numeroProcesso: processo.numero_processo ?? `PJE:${processo.id_pje}`,
    totalPartes: partes.length,
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
    logger.info({ idPje: processo.id_pje, totalPartes: partes.length }, 'Persistindo partes já buscadas');

    // 1. Valida documento do advogado
    validarDocumentoAdvogado(advogado);

    // 2. Se não há partes, retorna resultado vazio
    if (partes.length === 0) {
      resultado.duracaoMs = performance.now() - inicio;
      return resultado;
    }

    // 3. Valida schema PJE antes do processamento
    const partesValidadas = validarPartesArray(partes);

    // 4. Processa partes em paralelo com controle de concorrência
    const resultadosProcessamento = await processarPartesEmLote(partesValidadas, processo, advogado, logger);

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
        resultado.erros.push({
          parteIndex: -1,
          parteDados: { idParte: 0, nome: 'Desconhecido', tipoParte: 'DESCONHECIDO' },
          erro: errorInfo.message,
        });
      }
    }

    resultado.duracaoMs = performance.now() - inicio;

    logger.info({
      ...resultado,
    }, 'Persistência concluída');

    return resultado;
  } catch (error) {
    const errorInfo = extractErrorInfo(error);
    logger.error(errorInfo, 'Erro fatal ao persistir partes');
    resultado.duracaoMs = performance.now() - inicio;
    throw error;
  }
}

/**
 * Função interna com a lógica de captura (busca + persistência)
 */
async function capturarPartesProcessoInternal(
  page: Page,
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao,
  logger: ReturnType<typeof getLogger>
): Promise<CapturaPartesResult> {
  const inicio = performance.now();
  const resultado: CapturaPartesResult = {
    processoId: processo.id ?? processo.id_pje, // Usa id_pje se id do acervo não disponível
    numeroProcesso: processo.numero_processo ?? `PJE:${processo.id_pje}`,
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
    logger.info({ idPje: processo.id_pje, numeroProcesso: processo.numero_processo }, 'Iniciando captura de partes');

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
    const resultados: PromiseSettledResult<ProcessamentoParteResult>[] = [];
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

  const todosResultados: PromiseSettledResult<ProcessamentoParteResult>[] = [];

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
  const processarFn = async () => {
    logger.info({ parteIndex: index, parteName: parte.nome }, 'Processando parte');

    // Valida parte
    validarPartePJE(parte);

    // Identifica tipo da parte
    const tipoParte = identificarTipoParte(parte, advogado);

    // Processa com transação
    const { repsCount, vinculoCriado } = await processarParteComTransacao(parte, tipoParte, processo, index, logger);

    return { tipoParte, repsCount, vinculoCriado };
  };

  // Se retry não estiver habilitado, executa diretamente
  if (!CAPTURA_CONFIG.ENABLE_RETRY) {
    return await processarFn();
  }

  return withRetry(processarFn, {
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
  // 1. Upsert da entidade
  const resultado = await processarParte(parte, tipoParte, processo);
  if (!resultado) {
    throw new PersistenceError('Falha ao criar entidade', 'insert', tipoParte, { parte: parte.nome });
  }
  const entidadeId = resultado.id;

  // 2. Processa endereço e vincula
  const enderecoId = await processarEndereco(parte, tipoParte, entidadeId);
  if (enderecoId) {
    await vincularEnderecoNaEntidade(tipoParte, entidadeId, enderecoId);
  }

  // 3. Cria vínculo processo-parte
  const vinculoCriado = await criarVinculoProcessoParte(processo, tipoParte, entidadeId, parte, ordem);
  if (!vinculoCriado) {
    throw new PersistenceError('Falha ao criar vínculo', 'insert', 'vinculo', { parte: parte.nome });
  }

  // 4. Processa representantes
  const repsCount = parte.representantes ? await processarRepresentantes(parte.representantes, tipoParte, entidadeId, processo, logger) : 0;

  return { repsCount, vinculoCriado };
}

/**
 * Processa uma parte individual: faz upsert da entidade apropriada usando CPF/CNPJ como chave
 * Retorna objeto com ID da entidade ou null se falhou
 */
async function processarParte(
  parte: PartePJE,
  tipoParte: TipoParteClassificacao,
  processo: ProcessoParaCaptura
): Promise<{ id: number } | null> {
  const isPessoaFisica = parte.tipoDocumento === 'CPF';

  // Extrair e normalizar CPF/CNPJ
  const documento = parte.numeroDocumento;
  const documentoNormalizado = normalizarDocumento(documento);

  // Mapeia dados comuns (SEM id_pessoa_pje - agora vai para cadastros_pje)
  const dadosComuns = {
    nome: parte.nome,
    emails: parte.emails.length > 0 ? parte.emails : undefined,
    ddd_celular: parte.telefones[0]?.ddd || undefined,
    numero_celular: parte.telefones[0]?.numero || undefined,
    ddd_residencial: parte.telefones[1]?.ddd || undefined,
    numero_residencial: parte.telefones[1]?.numero || undefined,
  };

  // Extrai campos adicionais do PJE
  const camposExtras = extrairCamposPJE(parte);

  // Mescla dados comuns com campos extras
  const dadosCompletos = { ...dadosComuns, ...camposExtras };

  // Validar se o documento tem comprimento correto (CPF=11, CNPJ=14)
  const temDocumentoValido = documentoNormalizado &&
    ((isPessoaFisica && documentoNormalizado.length === 11) ||
      (!isPessoaFisica && documentoNormalizado.length === 14));

  try {
    let entidadeId: number | null = null;

    if (tipoParte === 'cliente') {
      // Cliente sem documento válido não pode ser processado
      if (!temDocumentoValido) {
        console.warn(`[PARTES] Cliente "${parte.nome}" sem documento válido (${isPessoaFisica ? 'CPF' : 'CNPJ'}) - ignorando`);
        return null;
      }

      // Buscar entidade existente por CPF/CNPJ
      const entidadeExistente = isPessoaFisica
        ? await buscarClientePorCPF(documentoNormalizado)
        : await buscarClientePorCNPJ(documentoNormalizado);

      if (entidadeExistente) {
        // UPDATE: entidade já existe
        entidadeId = entidadeExistente.id;
        // Entidade já existe - dados mantidos como estão
      } else {
        // INSERT: nova entidade
        if (isPessoaFisica) {
          const params: CriarClientePFParams = {
            ...dadosCompletos,
            tipo_pessoa: 'pf',
            cpf: documentoNormalizado,
          };
          const result = await withRetry(() => upsertClientePorCPF(params), {
            maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
            baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
          });
          if (result.sucesso && result.cliente) {
            entidadeId = result.cliente.id;
          } else {
            throw new PersistenceError(
              `Erro ao criar cliente PF: ${result.erro || 'erro desconhecido'}`,
              'insert',
              'cliente',
              { parte: parte.nome, cpf: documentoNormalizado }
            );
          }
        } else {
          const params: CriarClientePJParams = {
            ...dadosCompletos,
            tipo_pessoa: 'pj',
            cnpj: documentoNormalizado,
          };
          const result = await withRetry(() => upsertClientePorCNPJ(params), {
            maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
            baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
          });
          if (result.sucesso && result.cliente) {
            entidadeId = result.cliente.id;
          } else {
            throw new PersistenceError(
              `Erro ao criar cliente PJ: ${result.erro || 'erro desconhecido'}`,
              'insert',
              'cliente',
              { parte: parte.nome, cnpj: documentoNormalizado }
            );
          }
        }
      }
    } else if (tipoParte === 'parte_contraria') {
      // Parte contrária sem documento válido não pode ser processada
      if (!temDocumentoValido) {
        console.warn(`[PARTES] Parte contrária "${parte.nome}" sem documento válido (${isPessoaFisica ? 'CPF' : 'CNPJ'}) - ignorando`);
        return null;
      }

      // Buscar entidade existente por CPF/CNPJ
      const entidadeExistente = isPessoaFisica
        ? await buscarParteContrariaPorCPF(documentoNormalizado)
        : await buscarParteContrariaPorCNPJ(documentoNormalizado);

      if (entidadeExistente) {
        // UPDATE: entidade já existe
        entidadeId = entidadeExistente.id;
      } else {
        // INSERT: nova entidade
        if (isPessoaFisica) {
          const params: CriarParteContrariaPFParams = {
            ...dadosComuns,
            tipo_pessoa: 'pf',
            cpf: documentoNormalizado,
          };
          const result = await withRetry(() => upsertParteContrariaPorCPF(params), {
            maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
            baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
          });
          if (result.sucesso && result.parteContraria) {
            entidadeId = result.parteContraria.id;
          } else {
            throw new PersistenceError(
              `Erro ao criar parte contrária PF: ${result.erro || 'erro desconhecido'}`,
              'insert',
              'parte_contraria',
              { parte: parte.nome, cpf: documentoNormalizado }
            );
          }
        } else {
          const params: CriarParteContrariaPJParams = {
            ...dadosComuns,
            tipo_pessoa: 'pj',
            cnpj: documentoNormalizado,
          };
          const result = await withRetry(() => upsertParteContrariaPorCNPJ(params), {
            maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
            baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS
          });
          if (result.sucesso && result.parteContraria) {
            entidadeId = result.parteContraria.id;
          } else {
            throw new PersistenceError(
              `Erro ao criar parte contrária PJ: ${result.erro || 'erro desconhecido'}`,
              'insert',
              'parte_contraria',
              { parte: parte.nome, cnpj: documentoNormalizado }
            );
          }
        }
      }
    } else {
      // TERCEIROS: Tratamento especial para partes sem documento válido (ex: Ministério Público)
      if (temDocumentoValido) {
        // Buscar entidade existente por CPF/CNPJ
        const entidadeExistente = isPessoaFisica
          ? await buscarTerceiroPorCPF(documentoNormalizado)
          : await buscarTerceiroPorCNPJ(documentoNormalizado);

        if (entidadeExistente) {
          // UPDATE: entidade já existe
          entidadeId = entidadeExistente.id;
        } else {
          // INSERT: nova entidade com documento
          const params: CriarTerceiroPFParams | CriarTerceiroPJParams = {
            ...dadosCompletos,
            tipo_pessoa: isPessoaFisica ? 'pf' : 'pj',
            cpf: isPessoaFisica ? documentoNormalizado : undefined,
            cnpj: !isPessoaFisica ? documentoNormalizado : undefined,
            tipo_parte: parte.tipoParte,
            polo: parte.polo,
          } as CriarTerceiroPFParams | CriarTerceiroPJParams;

          const result = isPessoaFisica
            ? await withRetry<import('@/features/partes/services/terceiros/persistence/terceiro-persistence.service').OperacaoTerceiroResult & { criado: boolean }>(
              () => upsertTerceiroPorCPF(params as UpsertTerceiroPorCPFParams),
              {
                maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
                baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
              }
            )
            : await withRetry<import('@/features/partes/services/terceiros/persistence/terceiro-persistence.service').OperacaoTerceiroResult & { criado: boolean }>(
              () => upsertTerceiroPorCNPJ(params as UpsertTerceiroPorCNPJParams),
              {
                maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
                baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
              }
            );
          if (result.sucesso && result.terceiro) {
            entidadeId = result.terceiro.id;
          } else {
            // Erro ao criar terceiro COM documento - lançar exceção com erro específico
            throw new PersistenceError(
              `Erro ao criar terceiro com documento: ${result.erro || 'erro desconhecido'}`,
              'insert',
              'terceiro',
              { parte: parte.nome, documento: documentoNormalizado }
            );
          }
        }
      } else {
        // SEM DOCUMENTO VÁLIDO: Buscar via cadastros_pje (id_pessoa_pje) ou criar novo
        // Isso é comum para entidades como Ministério Público, Peritos sem CPF cadastrado, Testemunhas, etc.
        console.log(`[PARTES] Terceiro "${parte.nome}" sem documento válido - usando busca por id_pessoa_pje`);

        // 1. Tentar encontrar entidade existente via cadastros_pje
        const cadastroExistente = await buscarEntidadePorIdPessoaPJE({
          id_pessoa_pje: parte.idPessoa,
          sistema: 'pje_trt',
          tribunal: processo.trt,
          grau: processo.grau === 'primeiro_grau' ? 'primeiro_grau' : 'segundo_grau',
        });

        if (cadastroExistente && cadastroExistente.tipo_entidade === 'terceiro') {
          // Entidade já existe - retornar ID existente
          entidadeId = cadastroExistente.entidade_id;
          console.log(`[PARTES] Terceiro "${parte.nome}" encontrado via cadastros_pje: ID ${entidadeId}`);
        } else {
          // 2. Criar nova entidade sem documento
          // Determina tipo_pessoa baseado no nome (heurística: nomes com "MINISTÉRIO", "UNIÃO", etc são PJ)
          const pareceSerPJ = /^(MINISTÉRIO|MINISTERIO|UNIÃO|UNIAO|ESTADO|MUNICÍPIO|MUNICIPIO|INSTITUTO|INSS|IBAMA|ANVISA|RECEITA|FAZENDA|FUNDAÇÃO|FUNDACAO|AUTARQUIA|EMPRESA|ÓRGÃO|ORGAO)/i.test(parte.nome.trim());
          const tipoPessoaInferido: 'pf' | 'pj' = pareceSerPJ ? 'pj' : 'pf';

          const params = {
            nome: parte.nome,
            tipo_pessoa: tipoPessoaInferido,
            tipo_parte: parte.tipoParte,
            polo: parte.polo,
            emails: parte.emails.length > 0 ? parte.emails : undefined,
            ddd_celular: parte.telefones[0]?.ddd || undefined,
            numero_celular: parte.telefones[0]?.numero || undefined,
            ddd_residencial: parte.telefones[1]?.ddd || undefined,
            numero_residencial: parte.telefones[1]?.numero || undefined,
          };

          const result = await withRetry(
            () => criarTerceiroSemDocumento(params),
            {
              maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
              baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
            }
          );

          if (result.sucesso && result.terceiro) {
            entidadeId = result.terceiro.id;
            console.log(`[PARTES] Terceiro "${parte.nome}" criado sem documento: ID ${entidadeId}`);
          } else {
            // Erro ao criar terceiro SEM documento - lançar exceção com erro específico
            throw new PersistenceError(
              `Erro ao criar terceiro sem documento: ${result.erro || 'erro desconhecido'}`,
              'insert',
              'terceiro',
              { parte: parte.nome, idPessoa: parte.idPessoa }
            );
          }
        }
      }
    }

    // Após upsert da entidade, registrar em cadastros_pje
    if (entidadeId) {
      try {
        await upsertCadastroPJE({
          tipo_entidade: tipoParte,
          entidade_id: entidadeId,
          id_pessoa_pje: parte.idPessoa,
          sistema: 'pje_trt',
          tribunal: processo.trt,
          grau: processo.grau === 'primeiro_grau' ? 'primeiro_grau' : 'segundo_grau',
          dados_cadastro_pje: parte.dadosCompletos,
        });
      } catch (cadastroError) {
        // Log erro mas não falha a captura - dados principais já salvos
        console.error(`Erro ao registrar em cadastros_pje para ${tipoParte} ${entidadeId}:`, cadastroError);
      }
    }

    return entidadeId ? { id: entidadeId } : null;
  } catch (error) {
    throw new PersistenceError(`Erro ao processar parte ${parte.nome}`, 'upsert', tipoParte, { parte: parte.nome, error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Normaliza documento removendo máscara (pontos, traços, barras)
 * Retorna string vazia se documento for null/undefined (ex: MPT, União Federal)
 */
function normalizarDocumento(documento: string | null | undefined): string {
  if (!documento) return '';
  return documento.replace(/[.\-/]/g, '');
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

  for (const rep of representantes) {
    try {
      // Extrair e normalizar CPF com validação de null/empty
      if (!rep.numeroDocumento || String(rep.numeroDocumento).trim() === '') {
        logger.warn({ nome: rep.nome }, 'Representante sem CPF; ignorando');
        continue;
      }
      const cpf = String(rep.numeroDocumento);
      const cpfNormalizado = normalizarDocumento(cpf);

      // Buscar representante existente por CPF
      const representanteExistente = await buscarRepresentantePorCPF(cpfNormalizado);

      let representanteId: number | null = null;

      if (representanteExistente) {
        // UPDATE: representante já existe
        representanteId = representanteExistente.id;
      } else {
        // INSERT: novo representante
        const camposExtras = extrairCamposRepresentantePJE(rep);

        const params = {
          nome: rep.nome,
          cpf: cpfNormalizado,
          numero_oab: rep.numeroOAB || undefined,
          situacao_oab: (rep.situacaoOAB as unknown as SituacaoOAB) || undefined,
          tipo: (rep.tipo as unknown as TipoRepresentante) || undefined,
          email: rep.email || undefined,
          ddd_celular: rep.telefones?.[0]?.ddd || undefined,
          numero_celular: rep.telefones?.[0]?.numero || undefined,
          ...camposExtras,
        };

        const result = await upsertRepresentantePorCPF(params);
        if (result.sucesso && result.representante) {
          representanteId = result.representante.id;
        }
      }

      // Após upsert, registrar em cadastros_pje
      if (representanteId) {
        try {
          await upsertCadastroPJE({
            tipo_entidade: 'representante',
            entidade_id: representanteId,
            id_pessoa_pje: rep.idPessoa,
            sistema: 'pje_trt',
            tribunal: processo.trt,
            grau: processo.grau === 'primeiro_grau' ? 'primeiro_grau' : 'segundo_grau',
            dados_cadastro_pje: rep.dadosCompletos,
          });
        } catch (cadastroError) {
          // Log erro mas não falha a captura
          console.error(`Erro ao registrar representante em cadastros_pje:`, cadastroError);
        }

        count++;
        logger.debug({ nome: rep.nome, numeroDocumento: rep.numeroDocumento }, 'Representante salvo');
      }

      // Processa endereço do representante se houver
      if (rep.dadosCompletos?.endereco && representanteId) {
        const enderecoId = await processarEnderecoRepresentante(rep, tipoParte, parteId, processo);
        if (enderecoId) {
          // Vincular endereço ao representante (assumindo função existe ou similar)
          // Nota: Implementação pode variar, aqui assumimos atualização direta
        }
      }
    } catch (error) {
      logger.error({ nome: rep.nome, error: error instanceof Error ? error.message : String(error) }, 'Erro ao salvar representante');
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
 * 
 * NOTA: Se processo.id (ID no acervo) não estiver disponível, 
 * retorna false sem criar vínculo (partes são salvas, mas sem vínculo)
 */
async function criarVinculoProcessoParte(
  processo: ProcessoParaCaptura,
  tipoParte: TipoParteClassificacao,
  entidadeId: number,
  parte: PartePJE,
  ordem: number
): Promise<boolean> {
  // Se não temos ID do processo no acervo, não podemos criar vínculo
  // Isso permite capturar partes mesmo sem o processo estar no acervo ainda
  if (!processo.id) {
    return false; // Pula criação de vínculo silenciosamente
  }

  // Validação prévia
  if (entidadeId <= 0) {
    throw new ValidationError('entidadeId inválido', { entidadeId, parte: parte.nome });
  }
  if (!parte.idParte) {
    throw new ValidationError('idParte ausente', { parte: parte.nome });
  }

  try {
    const result = await withRetry(() => vincularParteProcesso({
      processo_id: processo.id!,
      tipo_entidade: tipoParte,
      entidade_id: entidadeId,
      id_pje: parte.idParte,
      id_pessoa_pje: parte.idPessoa,
      tipo_parte: validarTipoParteProcesso(parte.tipoParte),
      polo: mapearPoloParaSistema(parte.polo),
      trt: processo.trt,
      grau: processo.grau,
      numero_processo: processo.numero_processo ?? '', // Fallback para string vazia
      principal: parte.principal ?? false, // Default false se PJE não retornar
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

  const { valido } = validarEnderecoPJE(enderecoPJE);
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

  const { valido } = validarEnderecoPJE(enderecoPJE);
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
    const { createServiceClient } = await import('@/lib/supabase/service-client');
    const supabase = createServiceClient();

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