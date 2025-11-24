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
import type { SituacaoOAB, TipoRepresentante, Polo } from '@/backend/types/representantes/representantes-types';

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
      console.warn(`[CAPTURA-PARTES] Valor de polo desconhecido '${poloStr}', retornando 'outros'`);
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
    camposExtraidos.naturalidade_id_pje = dados?.naturalidade?.id !== undefined ? Number(dados.naturalidade.id) : undefined;
    camposExtraidos.naturalidade_municipio = dados?.naturalidade?.municipio as string | undefined;
    camposExtraidos.naturalidade_estado_id_pje = dados?.naturalidade?.estado?.id !== undefined ? Number(dados.naturalidade.estado.id) : undefined;
    camposExtraidos.naturalidade_estado_sigla = dados?.naturalidade?.estado?.sigla as string | undefined;
    camposExtraidos.uf_nascimento_id_pje = dados?.ufNascimento?.id !== undefined ? Number(dados.ufNascimento.id) : undefined;
    camposExtraidos.uf_nascimento_sigla = dados?.ufNascimento?.sigla as string | undefined;
    camposExtraidos.uf_nascimento_descricao = dados?.ufNascimento?.descricao as string | undefined;
    camposExtraidos.pais_nascimento_id_pje = dados?.paisNascimento?.id !== undefined ? Number(dados.paisNascimento.id) : undefined;
    camposExtraidos.pais_nascimento_codigo = dados?.paisNascimento?.codigo as string | undefined;
    camposExtraidos.pais_nascimento_descricao = dados?.paisNascimento?.descricao as string | undefined;
    camposExtraidos.escolaridade_codigo = dados?.escolaridade !== undefined ? Number(dados.escolaridade) : undefined;
    camposExtraidos.situacao_cpf_receita_id = dados?.situacaoCpfReceita?.id !== undefined ? Number(dados.situacaoCpfReceita.id) : undefined;
    camposExtraidos.situacao_cpf_receita_descricao = dados?.situacaoCpfReceita?.descricao as string | undefined;
    camposExtraidos.pode_usar_celular_mensagem = dados?.podeUsarCelularMensagem !== undefined ? Boolean(dados.podeUsarCelularMensagem) : undefined;
  }

  // Campos específicos de PJ
  if (parte.tipoDocumento === 'CNPJ') {
    camposExtraidos.inscricao_estadual = dados?.inscricaoEstadual as string | undefined;
    camposExtraidos.data_abertura = dados?.dataAbertura as string | undefined;
    camposExtraidos.orgao_publico = dados?.orgaoPublico !== undefined ? Boolean(dados.orgaoPublico) : undefined;
    camposExtraidos.tipo_pessoa_codigo_pje = dados?.tipoPessoa?.codigo as string | undefined;
    camposExtraidos.tipo_pessoa_label_pje = dados?.tipoPessoa?.label as string | undefined;
    camposExtraidos.situacao_cnpj_receita_id = dados?.situacaoCnpjReceita?.id !== undefined ? Number(dados.situacaoCnpjReceita.id) : undefined;
    camposExtraidos.situacao_cnpj_receita_descricao = dados?.situacaoCnpjReceita?.descricao as string | undefined;
    camposExtraidos.ramo_atividade = dados?.ramoAtividade as string | undefined;
    camposExtraidos.cpf_responsavel = dados?.cpfResponsavel as string | undefined;
    camposExtraidos.oficial = dados?.oficial !== undefined ? Boolean(dados.oficial) : undefined;
    camposExtraidos.porte_codigo = dados?.porte?.codigo !== undefined ? Number(dados.porte.codigo) : undefined;
    camposExtraidos.porte_descricao = dados?.porte?.descricao as string | undefined;
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

    // 1. Valida documento do advogado UMA ÚNICA VEZ (antes de processar qualquer parte)
    // Se inválido, lança erro e interrompe toda a captura (evita erros repetidos por parte)
    validarDocumentoAdvogado(advogado);

    // 2. Busca partes via API PJE
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

    // 3. Processa cada parte sequencialmente
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

          // 2c. Processa e salva endereço (se houver) e vincula à entidade
          const enderecoId = await processarEndereco(parte, tipoParte, entidadeId);
          if (enderecoId) {
            await vincularEnderecoNaEntidade(tipoParte, entidadeId, enderecoId);
          }

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
  tipoParte: TipoParteClassificacao,
  processo: ProcessoParaCaptura
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
        const result = await upsertClientePorIdPessoa(params);
        return result.sucesso && result.cliente ? result.cliente.id : null;
      } else {
        const params: CriarClientePJParams & { id_pessoa_pje: number } = {
          ...dadosCompletos,
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
          ...dadosCompletos,
          tipo_pessoa: 'pf',
          cpf: parte.numeroDocumento,
        };
        const result = await upsertParteContrariaPorIdPessoa(params);
        return result.sucesso && result.parteContraria ? result.parteContraria.id : null;
      } else {
        const params: CriarParteContrariaPJParams & { id_pessoa_pje: number } = {
          ...dadosCompletos,
          tipo_pessoa: 'pj',
          cnpj: parte.numeroDocumento,
        };
        const result = await upsertParteContrariaPorIdPessoa(params);
        return result.sucesso && result.parteContraria ? result.parteContraria.id : null;
      }
    } else {
      // Upsert em tabela terceiros
      const params = {
        ...dadosCompletos,
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

  console.log(
    `[CAPTURA-PARTES] Processando ${representantes.length} representante(s) da ${tipoParte} (ID: ${parteId})`
  );

  for (let index = 0; index < representantes.length; index++) {
    const rep = representantes[index];

    try {
      const tipo_pessoa: 'pf' | 'pj' = rep.tipoDocumento === 'CPF' ? 'pf' : 'pj';

      // Extrai campos extras do PJE
      const camposExtras = extrairCamposRepresentantePJE(rep);

      // Primeiro cria/atualiza o representante SEM endereco_id
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
        // dados_anteriores será populado automaticamente pelo persistence service com o estado anterior do registro
        dados_anteriores: null,
        ordem: index,
        ...camposExtras,
      });

      if (result.sucesso && result.representante) {
        count++;
        console.log(
          `[CAPTURA-PARTES] ✓ Representante salvo: ${rep.nome} (${tipo_pessoa === 'pf' ? 'CPF' : 'CNPJ'}: ${rep.numeroDocumento}) - OAB: ${rep.numeroOAB || 'N/A'}`
        );

        // Agora processa o endereço usando o ID do representante
        if (rep.dadosCompletos?.endereco) {
          const enderecoId = await processarEnderecoRepresentante(
            rep,
            result.representante.id
          );

          // Se conseguiu salvar o endereço, atualiza o representante com o endereco_id
          if (enderecoId) {
            await atualizarRepresentante({
              id: result.representante.id,
              endereco_id: enderecoId,
            });
          }
        }
      } else {
        console.warn(
          `[CAPTURA-PARTES] ✗ Falha ao salvar representante: ${rep.nome} - ${result.erro}`
        );
      }
    } catch (error) {
      // Capturar erro de constraint violation (CPF/CNPJ duplicado, constraint UNIQUE)
      if (error instanceof Error && error.message.includes('Representante já cadastrado')) {
        console.error(
          `[CAPTURA-PARTES] Constraint UNIQUE violation para representante ${rep.nome} (CPF/CNPJ: ${rep.numeroDocumento}, parte_id: ${parteId}, processo: ${processo.numero_processo}): ${error.message}`
        );
      } else {
        console.error(`[CAPTURA-PARTES] Erro ao salvar representante ${rep.nome}:`, error);
      }
      // Continua com próximo representante
    }
  }

  console.log(
    `[CAPTURA-PARTES] Representantes salvos: ${count}/${representantes.length} para ${tipoParte} (ID: ${parteId})`
  );

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
      console.warn(`[CAPTURA-PARTES] Mapeando polo 'OUTROS' para 'TERCEIRO'`);
      return 'TERCEIRO';
    default:
      console.warn(`[CAPTURA-PARTES] Polo desconhecido '${poloPJE}', mapeando para 'TERCEIRO'`);
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
    console.warn(`[CAPTURA-PARTES] Tipo de parte desconhecido '${tipoParte}', usando 'OUTRO' como fallback`);
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
  try {
    const result = await vincularParteProcesso({
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

/**
 * Processa e salva endereço de um representante
 * Retorna ID do endereço criado/atualizado ou null se falhou
 */
async function processarEnderecoRepresentante(
  rep: RepresentantePJE,
  representanteId: number
): Promise<number | null> {
  // Verifica se o representante tem endereço
  if (!rep.dadosCompletos?.endereco) {
    return null;
  }

  const enderecoPJE = rep.dadosCompletos.endereco as unknown as EnderecoPJE;

  try {
    const result = await upsertEnderecoPorIdPje({
      id_pje: Number(enderecoPJE?.id || 0),
      entidade_tipo: 'representante' as EntidadeTipoEndereco,
      entidade_id: representanteId, // Now using the correct representante ID
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
        `[CAPTURA-PARTES] Endereço salvo para representante ${rep.nome}: ${result.endereco.logradouro}, ${result.endereco.municipio}-${result.endereco.estado_sigla}`
      );
      return result.endereco.id;
    }

    return null;
  } catch (error) {
    console.error(`[CAPTURA-PARTES] Erro ao processar endereço de representante ${rep.nome}:`, error);
    return null;
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
      console.error(
        `[CAPTURA-PARTES] Erro ao vincular endereço ${enderecoId} à ${tipoParte} ${entidadeId}:`,
        error
      );
    } else {
      console.log(
        `[CAPTURA-PARTES] ✓ Endereço ${enderecoId} vinculado à ${tipoParte} ${entidadeId}`
      );
    }
  } catch (error) {
    console.error(
      `[CAPTURA-PARTES] Erro ao vincular endereço à ${tipoParte}:`,
      error
    );
  }
}