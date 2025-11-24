/**
 * Serviço de persistência para processo_partes (N:N entre processos e entidades)
 *
 * Este serviço gerencia a tabela de junção processo_partes que relaciona:
 * - Processos (tabela processos)
 * - Entidades: clientes, partes_contrarias ou terceiros (polimórfico)
 *
 * Responsabilidades:
 * - Criar/atualizar/deletar vínculos entre processos e entidades
 * - Buscar partes de um processo com dados completos da entidade
 * - Buscar processos de uma entidade com dados do processo
 * - Validar campos obrigatórios: tipo_parte, polo, ordem, principal
 * - Garantir unicidade: processo_id + tipo_entidade + entidade_id + grau
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';

import type {
  ProcessoParte,
  CriarProcessoParteParams,
  AtualizarProcessoParteParams,
  ListarProcessoPartesParams,
  ListarProcessoPartesResult,
  BuscarPartesPorProcessoParams,
  ParteComDadosCompletos,
  BuscarProcessosPorEntidadeParams,
  ProcessoComParticipacao,
  VincularParteProcessoParams,
  DesvincularParteProcessoParams,
  EntidadeTipoProcessoParte,
  TipoParteProcesso,
  PoloProcessoParte,
  GrauProcessoParte,
} from '@/backend/types/partes';

/**
 * Resultado de operações de processo_partes
 */
interface OperacaoProcessoParteResult {
  success: boolean;
  data?: ProcessoParte;
  error?: string;
}

/**
 * Converte registro do banco em ProcessoParte tipado
 */
function converterParaProcessoParte(data: Record<string, unknown>): ProcessoParte {
  return {
    id: data.id as number,
    processo_id: data.processo_id as number,
    tipo_entidade: data.tipo_entidade as EntidadeTipoProcessoParte,
    entidade_id: data.entidade_id as number,
    id_pje: data.id_pje as number,
    trt: data.trt as string,
    grau: data.grau as GrauProcessoParte,
    numero_processo: data.numero_processo as string,
    tipo_parte: data.tipo_parte as TipoParteProcesso,
    polo: data.polo as PoloProcessoParte,
    ordem: (data.ordem as number) ?? null,
    principal: (data.principal as boolean) ?? null,
    dados_pje_completo: (data.dados_pje_completo as Record<string, unknown>) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

/**
 * Valida se tipo_parte é válido
 */
function validarTipoParte(tipo_parte: string): boolean {
  const tiposValidos: TipoParteProcesso[] = [
    'AUTOR',
    'REU',
    'RECLAMANTE',
    'RECLAMADO',
    'EXEQUENTE',
    'EXECUTADO',
    'EMBARGANTE',
    'EMBARGADO',
    'APELANTE',
    'APELADO',
    'AGRAVANTE',
    'AGRAVADO',
    'PERITO',
    'MINISTERIO_PUBLICO',
    'ASSISTENTE',
    'TESTEMUNHA',
    'CUSTOS_LEGIS',
    'AMICUS_CURIAE',
    'OUTRO',
  ];
  return tiposValidos.includes(tipo_parte as TipoParteProcesso);
}

/**
 * Valida se polo é válido
 */
function validarPolo(polo: string): boolean {
  const polosValidos: PoloProcessoParte[] = ['ATIVO', 'PASSIVO', 'NEUTRO', 'TERCEIRO'];
  return polosValidos.includes(polo as PoloProcessoParte);
}

/**
 * Valida se tipo_entidade é válido
 */
function validarTipoEntidade(tipo_entidade: string): boolean {
  const tiposValidos: EntidadeTipoProcessoParte[] = ['cliente', 'parte_contraria', 'terceiro'];
  return tiposValidos.includes(tipo_entidade as EntidadeTipoProcessoParte);
}

/**
 * Valida se grau é válido
 */
function validarGrau(grau: string): boolean {
  const grausValidos: GrauProcessoParte[] = ['primeiro_grau', 'segundo_grau'];
  return grausValidos.includes(grau as GrauProcessoParte);
}

/**
 * Cria um vínculo entre processo e entidade
 */
export async function criarProcessoParte(
  params: CriarProcessoParteParams
): Promise<OperacaoProcessoParteResult> {
  const supabase = createServiceClient();

  // Validações obrigatórias
  if (!params.processo_id) {
    return {
      success: false,
      error: 'processo_id é obrigatório',
    };
  }

  if (!params.tipo_entidade || !validarTipoEntidade(params.tipo_entidade)) {
    return {
      success: false,
      error: 'tipo_entidade inválido (deve ser cliente, parte_contraria ou terceiro)',
    };
  }

  if (!params.entidade_id) {
    return {
      success: false,
      error: 'entidade_id é obrigatório',
    };
  }

  if (!params.id_pje) {
    return {
      success: false,
      error: 'id_pje é obrigatório',
    };
  }

  if (!params.trt) {
    return {
      success: false,
      error: 'trt é obrigatório',
    };
  }

  if (!params.grau || !validarGrau(params.grau)) {
    return {
      success: false,
      error: 'grau inválido (deve ser 1 ou 2)',
    };
  }

  if (!params.numero_processo) {
    return {
      success: false,
      error: 'numero_processo é obrigatório',
    };
  }

  if (!params.tipo_parte || !validarTipoParte(params.tipo_parte)) {
    return {
      success: false,
      error: 'tipo_parte inválido',
    };
  }

  if (!params.polo || !validarPolo(params.polo)) {
    return {
      success: false,
      error: 'polo inválido (deve ser ATIVO, PASSIVO, NEUTRO ou TERCEIRO)',
    };
  }

  // Verifica se já existe vínculo para evitar duplicação
  const { data: existente } = await supabase
    .from('processo_partes')
    .select('id')
    .eq('processo_id', params.processo_id)
    .eq('tipo_entidade', params.tipo_entidade)
    .eq('entidade_id', params.entidade_id)
    .eq('grau', params.grau)
    .maybeSingle();

  if (existente) {
    return {
      success: false,
      error: 'Vínculo já existe para esta entidade neste processo/grau',
    };
  }

  // Prepara dados para inserção
  const dadosInsercao = {
    processo_id: params.processo_id,
    tipo_entidade: params.tipo_entidade,
    entidade_id: params.entidade_id,
    id_pje: params.id_pje,
    trt: params.trt,
    grau: params.grau,
    numero_processo: params.numero_processo,
    tipo_parte: params.tipo_parte,
    polo: params.polo,
    ordem: params.ordem ?? null,
    principal: params.principal ?? null,
    dados_pje_completo: params.dados_pje_completo ?? null,
  };

  const { data, error } = await supabase
    .from('processo_partes')
    .insert(dadosInsercao)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar processo_parte:', error);
    return {
      success: false,
      error: `Erro ao criar vínculo: ${error.message}`,
    };
  }

  return {
    success: true,
    data: converterParaProcessoParte(data),
  };
}

/**
 * Atualiza um vínculo existente
 */
export async function atualizarProcessoParte(
  params: AtualizarProcessoParteParams
): Promise<OperacaoProcessoParteResult> {
  const supabase = createServiceClient();

  if (!params.id) {
    return {
      success: false,
      error: 'id é obrigatório',
    };
  }

  // Busca registro existente
  const { data: existente, error: erroExistente } = await supabase
    .from('processo_partes')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (erroExistente || !existente) {
    return {
      success: false,
      error: 'Vínculo não encontrado',
    };
  }

  // Validações condicionais
  if (params.tipo_entidade && !validarTipoEntidade(params.tipo_entidade)) {
    return {
      success: false,
      error: 'tipo_entidade inválido',
    };
  }

  if (params.grau && !validarGrau(params.grau)) {
    return {
      success: false,
      error: 'grau inválido',
    };
  }

  if (params.tipo_parte && !validarTipoParte(params.tipo_parte)) {
    return {
      success: false,
      error: 'tipo_parte inválido',
    };
  }

  if (params.polo && !validarPolo(params.polo)) {
    return {
      success: false,
      error: 'polo inválido',
    };
  }

  // Prepara dados para atualização (apenas campos fornecidos)
  const dadosAtualizacao: Record<string, unknown> = {};

  if (params.processo_id !== undefined) dadosAtualizacao.processo_id = params.processo_id;
  if (params.tipo_entidade !== undefined) dadosAtualizacao.tipo_entidade = params.tipo_entidade;
  if (params.entidade_id !== undefined) dadosAtualizacao.entidade_id = params.entidade_id;
  if (params.id_pje !== undefined) dadosAtualizacao.id_pje = params.id_pje;
  if (params.trt !== undefined) dadosAtualizacao.trt = params.trt;
  if (params.grau !== undefined) dadosAtualizacao.grau = params.grau;
  if (params.numero_processo !== undefined) dadosAtualizacao.numero_processo = params.numero_processo;
  if (params.tipo_parte !== undefined) dadosAtualizacao.tipo_parte = params.tipo_parte;
  if (params.polo !== undefined) dadosAtualizacao.polo = params.polo;
  if (params.ordem !== undefined) dadosAtualizacao.ordem = params.ordem;
  if (params.principal !== undefined) dadosAtualizacao.principal = params.principal;
  if (params.dados_pje_completo !== undefined) dadosAtualizacao.dados_pje_completo = params.dados_pje_completo;

  if (Object.keys(dadosAtualizacao).length === 0) {
    return {
      success: false,
      error: 'Nenhum campo para atualizar',
    };
  }

  const { data, error } = await supabase
    .from('processo_partes')
    .update(dadosAtualizacao)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar processo_parte:', error);
    return {
      success: false,
      error: `Erro ao atualizar vínculo: ${error.message}`,
    };
  }

  return {
    success: true,
    data: converterParaProcessoParte(data),
  };
}

/**
 * Busca um vínculo por ID
 */
export async function buscarProcessoPartePorId(id: number): Promise<ProcessoParte | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('processo_partes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar processo_parte:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return converterParaProcessoParte(data);
}

/**
 * Busca partes de um processo com dados completos da entidade
 * Realiza JOIN polimórfico com clientes, partes_contrarias ou terceiros
 */
export async function buscarPartesPorProcesso(
  params: BuscarPartesPorProcessoParams
): Promise<ParteComDadosCompletos[]> {
  const supabase = createServiceClient();

  // Busca todas as participações
  let query = supabase
    .from('processo_partes')
    .select('*')
    .eq('processo_id', params.processo_id)
    .order('polo', { ascending: true })
    .order('ordem', { ascending: true, nullsFirst: false });

  if (params.polo) {
    query = query.eq('polo', params.polo);
  }

  const { data: participacoes, error } = await query;

  if (error) {
    console.error('Erro ao buscar partes do processo:', error);
    return [];
  }

  if (!participacoes || participacoes.length === 0) {
    return [];
  }

  // Para cada participação, busca dados da entidade
  const partesCompletas: ParteComDadosCompletos[] = [];

  for (const participacao of participacoes) {
    const tipoEntidade = participacao.tipo_entidade as EntidadeTipoProcessoParte;
    const entidadeId = participacao.entidade_id as number;

    let tabelaEntidade = '';
    if (tipoEntidade === 'cliente') tabelaEntidade = 'clientes';
    else if (tipoEntidade === 'parte_contraria') tabelaEntidade = 'partes_contrarias';
    else if (tipoEntidade === 'terceiro') tabelaEntidade = 'terceiros';

    // Busca dados da entidade
    const { data: entidade } = await supabase
      .from(tabelaEntidade)
      .select('nome, tipo_pessoa, cpf, cnpj, emails, ddd_celular, numero_celular, ddd_telefone, numero_telefone')
      .eq('id', entidadeId)
      .maybeSingle();

    if (entidade) {
      partesCompletas.push({
        id: participacao.id as number,
        processo_id: participacao.processo_id as number,
        tipo_entidade: tipoEntidade,
        entidade_id: entidadeId,
        tipo_parte: participacao.tipo_parte as TipoParteProcesso,
        polo: participacao.polo as PoloProcessoParte,
        ordem: (participacao.ordem as number) ?? null,
        principal: (participacao.principal as boolean) ?? null,
        // Dados da entidade
        nome: entidade.nome as string,
        tipo_pessoa: entidade.tipo_pessoa as 'pf' | 'pj',
        cpf: (entidade.cpf as string) ?? null,
        cnpj: (entidade.cnpj as string) ?? null,
        emails: (entidade.emails as string[]) ?? null,
        ddd_celular: (entidade.ddd_celular as string) ?? null,
        numero_celular: (entidade.numero_celular as string) ?? null,
        ddd_telefone: (entidade.ddd_telefone as string) ?? null,
        numero_telefone: (entidade.numero_telefone as string) ?? null,
      });
    }
  }

  return partesCompletas;
}

/**
 * Busca processos de uma entidade com dados do processo
 */
export async function buscarProcessosPorEntidade(
  params: BuscarProcessosPorEntidadeParams
): Promise<ProcessoComParticipacao[]> {
  const supabase = createServiceClient();

  if (!validarTipoEntidade(params.tipo_entidade)) {
    console.error('tipo_entidade inválido:', params.tipo_entidade);
    return [];
  }

  // Busca todas as participações da entidade
  const { data: participacoes, error } = await supabase
    .from('processo_partes')
    .select('*')
    .eq('tipo_entidade', params.tipo_entidade)
    .eq('entidade_id', params.entidade_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar processos da entidade:', error);
    return [];
  }

  if (!participacoes || participacoes.length === 0) {
    return [];
  }

  // Para cada participação, busca dados do processo
  const processosCompletos: ProcessoComParticipacao[] = [];

  for (const participacao of participacoes) {
    const processoId = participacao.processo_id as number;

    // Busca dados do processo
    const { data: processo } = await supabase
      .from('processos')
      .select('classe_judicial, codigo_status_processo, data_autuacao, nome_parte_autora, nome_parte_re')
      .eq('id', processoId)
      .maybeSingle();

    if (processo) {
      processosCompletos.push({
        id: participacao.id as number,
        processo_id: processoId,
        numero_processo: participacao.numero_processo as string,
        trt: participacao.trt as string,
        grau: participacao.grau as GrauProcessoParte,
        tipo_parte: participacao.tipo_parte as TipoParteProcesso,
        polo: participacao.polo as PoloProcessoParte,
        ordem: (participacao.ordem as number) ?? null,
        principal: (participacao.principal as boolean) ?? null,
        // Dados do processo
        classe_judicial: (processo.classe_judicial as string) ?? null,
        codigo_status_processo: (processo.codigo_status_processo as string) ?? null,
        data_autuacao: (processo.data_autuacao as string) ?? null,
        nome_parte_autora: (processo.nome_parte_autora as string) ?? null,
        nome_parte_re: (processo.nome_parte_re as string) ?? null,
      });
    }
  }

  return processosCompletos;
}

/**
 * Lista vínculos com filtros e paginação
 */
export async function listarProcessoPartes(
  params: ListarProcessoPartesParams = {}
): Promise<ListarProcessoPartesResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  // Query base
  let query = supabase.from('processo_partes').select('*', { count: 'exact' });

  // Filtros por entidade
  if (params.tipo_entidade) {
    query = query.eq('tipo_entidade', params.tipo_entidade);
  }
  if (params.entidade_id) {
    query = query.eq('entidade_id', params.entidade_id);
  }

  // Filtros por processo
  if (params.processo_id) {
    query = query.eq('processo_id', params.processo_id);
  }
  if (params.trt) {
    query = query.eq('trt', params.trt);
  }
  if (params.grau) {
    query = query.eq('grau', params.grau);
  }
  if (params.numero_processo) {
    query = query.ilike('numero_processo', `%${params.numero_processo}%`);
  }

  // Filtros de participação
  if (params.polo) {
    query = query.eq('polo', params.polo);
  }
  if (params.tipo_parte) {
    query = query.eq('tipo_parte', params.tipo_parte);
  }
  if (params.principal !== undefined) {
    query = query.eq('principal', params.principal);
  }

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'created_at';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Erro ao listar processo_partes:', error);
    return {
      processoPartes: [],
      total: 0,
      pagina,
      limite,
      totalPaginas: 0,
    };
  }

  const processoPartes = (data || []).map(converterParaProcessoParte);
  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    processoPartes,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

/**
 * Vincula entidade a processo (alias semântico para criarProcessoParte)
 */
export async function vincularParteProcesso(
  params: VincularParteProcessoParams
): Promise<OperacaoProcessoParteResult> {
  return await criarProcessoParte(params);
}

/**
 * Desvincula entidade de processo (remove participação)
 */
export async function desvincularParteProcesso(
  params: DesvincularParteProcessoParams
): Promise<OperacaoProcessoParteResult> {
  const supabase = createServiceClient();

  if (!params.id) {
    return {
      success: false,
      error: 'id é obrigatório',
    };
  }

  // Busca registro antes de deletar
  const participacao = await buscarProcessoPartePorId(params.id);

  if (!participacao) {
    return {
      success: false,
      error: 'Vínculo não encontrado',
    };
  }

  const { error } = await supabase.from('processo_partes').delete().eq('id', params.id);

  if (error) {
    console.error('Erro ao desvincular parte do processo:', error);
    return {
      success: false,
      error: `Erro ao desvincular: ${error.message}`,
    };
  }

  return {
    success: true,
    data: participacao,
  };
}

/**
 * Deleta um vínculo (alias para desvincularParteProcesso)
 */
export async function deletarProcessoParte(id: number): Promise<OperacaoProcessoParteResult> {
  return await desvincularParteProcesso({ id });
}
