// Serviço de persistência de terceiros
// Gerencia operações de CRUD na tabela terceiros (tabela global, sem vinculação direta a processos)

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  Terceiro,
  CriarTerceiroParams,
  AtualizarTerceiroParams,
  ListarTerceirosParams,
  ListarTerceirosResult,
  UpsertTerceiroPorIdPessoaParams,
  BuscarTerceirosPorProcessoParams,
} from '@/backend/types/partes/terceiros-types';

/**
 * Resultado de operação
 */
export interface OperacaoTerceiroResult {
  sucesso: boolean;
  terceiro?: Terceiro;
  erro?: string;
}

/**
 * Valida CPF básico (formato)
 */
function validarCpf(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  return cpfLimpo.length === 11;
}

/**
 * Valida CNPJ básico (formato)
 */
function validarCnpj(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  return cnpjLimpo.length === 14;
}

/**
 * Valida formato de e-mail
 */
function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normaliza CPF removendo formatação
 */
function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Normaliza CNPJ removendo formatação
 */
function normalizarCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Converte dados do banco para formato de retorno
 */
function converterParaTerceiro(data: Record<string, unknown>): Terceiro {
  const tipo_pessoa = data.tipo_pessoa as 'pf' | 'pj';

  const base = {
    id: data.id as number,
    id_pje: data.id_pje as number,
    id_pessoa_pje: data.id_pessoa_pje as number,
    tipo_parte: data.tipo_parte as
      | 'PERITO'
      | 'MINISTERIO_PUBLICO'
      | 'ASSISTENTE'
      | 'TESTEMUNHA'
      | 'CUSTOS_LEGIS'
      | 'AMICUS_CURIAE'
      | 'OUTRO',
    polo: data.polo as 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO',
    tipo_pessoa,
    nome: data.nome as string,
    nome_social: (data.nome_social as string | null) ?? null,
    emails: (data.emails as string[] | null) ?? null,
    ddd_celular: (data.ddd_celular as string | null) ?? null,
    numero_celular: (data.numero_celular as string | null) ?? null,
    ddd_residencial: (data.ddd_residencial as string | null) ?? null,
    numero_residencial: (data.numero_residencial as string | null) ?? null,
    ddd_comercial: (data.ddd_comercial as string | null) ?? null,
    numero_comercial: (data.numero_comercial as string | null) ?? null,
    fax: (data.fax as string | null) ?? null,
    situacao: (data.situacao as 'A' | 'I' | 'E' | 'H' | null) ?? null,
    observacoes: (data.observacoes as string | null) ?? null,
    dados_anteriores: (data.dados_anteriores as Record<string, unknown> | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };

  if (tipo_pessoa === 'pf') {
    return {
      ...base,
      tipo_pessoa: 'pf',
      cpf: data.cpf as string,
      cnpj: null,
      tipo_documento: (data.tipo_documento as string | null) ?? null,
      numero_rg: (data.numero_rg as string | null) ?? null,
      orgao_emissor_rg: (data.orgao_emissor_rg as string | null) ?? null,
      uf_rg: (data.uf_rg as string | null) ?? null,
      data_expedicao_rg: (data.data_expedicao_rg as string | null) ?? null,
      sexo: (data.sexo as string | null) ?? null,
      nome_genitora: (data.nome_genitora as string | null) ?? null,
      data_nascimento: (data.data_nascimento as string | null) ?? null,
      nacionalidade: (data.nacionalidade as string | null) ?? null,
      naturalidade: (data.naturalidade as string | null) ?? null,
      municipio_nascimento: (data.municipio_nascimento as string | null) ?? null,
      uf_nascimento: (data.uf_nascimento as string | null) ?? null,
      pais_nacionalidade: (data.pais_nacionalidade as string | null) ?? null,
      profissao: (data.profissao as string | null) ?? null,
      estado_civil: (data.estado_civil as string | null) ?? null,
      grau_instrucao: (data.grau_instrucao as string | null) ?? null,
      necessidade_especial: (data.necessidade_especial as string | null) ?? null,
      inscricao_estadual: null,
      inscricao_municipal: null,
      data_abertura: null,
      orgao_publico: null,
      ds_tipo_pessoa: null,
      ramo_atividade: null,
      porte_codigo: null,
      porte_descricao: null,
      qualificacao_responsavel: null,
      nome_fantasia: null,
      status_pje: null,
    };
  } else {
    return {
      ...base,
      tipo_pessoa: 'pj',
      cnpj: data.cnpj as string,
      cpf: null,
      inscricao_estadual: (data.inscricao_estadual as string | null) ?? null,
      inscricao_municipal: (data.inscricao_municipal as string | null) ?? null,
      data_abertura: (data.data_abertura as string | null) ?? null,
      orgao_publico: (data.orgao_publico as boolean | null) ?? null,
      ds_tipo_pessoa: (data.ds_tipo_pessoa as string | null) ?? null,
      ramo_atividade: (data.ramo_atividade as string | null) ?? null,
      porte_codigo: (data.porte_codigo as string | null) ?? null,
      porte_descricao: (data.porte_descricao as string | null) ?? null,
      qualificacao_responsavel: (data.qualificacao_responsavel as string | null) ?? null,
      capital_social: (data.capital_social as number | null) ?? null,
      nome_fantasia: (data.nome_fantasia as string | null) ?? null,
      status_pje: (data.status_pje as string | null) ?? null,
      tipo_documento: null,
      numero_rg: null,
      orgao_emissor_rg: null,
      uf_rg: null,
      data_expedicao_rg: null,
      sexo: null,
      nome_genitora: null,
      data_nascimento: null,
      nacionalidade: null,
      naturalidade: null,
      municipio_nascimento: null,
      uf_nascimento: null,
      pais_nacionalidade: null,
      profissao: null,
      estado_civil: null,
      grau_instrucao: null,
      necessidade_especial: null,
    };
  }
}

/**
 * Cria um novo terceiro no sistema
 */
export async function criarTerceiro(
  params: CriarTerceiroParams
): Promise<OperacaoTerceiroResult> {
  const supabase = createServiceClient();

  try {
    // Validações obrigatórias
    if (!params.tipo_pessoa) {
      return { sucesso: false, erro: 'Tipo de pessoa é obrigatório' };
    }

    if (!params.nome?.trim()) {
      return { sucesso: false, erro: 'Nome é obrigatório' };
    }

    if (!params.tipo_parte) {
      return { sucesso: false, erro: 'Tipo de parte é obrigatório' };
    }

    if (!params.polo) {
      return { sucesso: false, erro: 'Polo é obrigatório' };
    }

    // Validações específicas por tipo de pessoa
    if (params.tipo_pessoa === 'pf') {
      if (!params.cpf?.trim()) {
        return { sucesso: false, erro: 'CPF é obrigatório para pessoa física' };
      }

      if (!validarCpf(params.cpf)) {
        return { sucesso: false, erro: 'CPF inválido (deve conter 11 dígitos)' };
      }
    } else if (params.tipo_pessoa === 'pj') {
      if (!params.cnpj?.trim()) {
        return { sucesso: false, erro: 'CNPJ é obrigatório para pessoa jurídica' };
      }

      if (!validarCnpj(params.cnpj)) {
        return { sucesso: false, erro: 'CNPJ inválido (deve conter 14 dígitos)' };
      }
    }

    // Validação de emails se fornecidos
    if (params.emails) {
      for (const email of params.emails) {
        if (email && !validarEmail(email)) {
          return { sucesso: false, erro: `E-mail inválido: ${email}` };
        }
      }
    }

    // Preparar dados para inserção
    const dadosNovos: Record<string, unknown> = {
      id_pje: params.id_pje,
      id_pessoa_pje: params.id_pessoa_pje,
      tipo_parte: params.tipo_parte,
      polo: params.polo,
      tipo_pessoa: params.tipo_pessoa,
      nome: params.nome.trim(),
      nome_social: params.nome_social?.trim() || null,
      emails: params.emails ?? null,
      ddd_celular: params.ddd_celular?.trim() || null,
      numero_celular: params.numero_celular?.trim() || null,
      ddd_residencial: params.ddd_residencial?.trim() || null,
      numero_residencial: params.numero_residencial?.trim() || null,
      ddd_comercial: params.ddd_comercial?.trim() || null,
      numero_comercial: params.numero_comercial?.trim() || null,
      fax: params.fax?.trim() || null,
      situacao: params.situacao ?? null,
      observacoes: params.observacoes?.trim() || null,
      dados_anteriores: params.dados_anteriores ?? null,
    };

    if (params.tipo_pessoa === 'pf') {
      dadosNovos.cpf = normalizarCpf(params.cpf);
      dadosNovos.tipo_documento = params.tipo_documento?.trim() || null;
      dadosNovos.numero_rg = params.numero_rg?.trim() || null;
      dadosNovos.orgao_emissor_rg = params.orgao_emissor_rg?.trim() || null;
      dadosNovos.uf_rg = params.uf_rg?.trim() || null;
      dadosNovos.data_expedicao_rg = params.data_expedicao_rg || null;
      dadosNovos.sexo = params.sexo?.trim() || null;
      dadosNovos.nome_genitora = params.nome_genitora?.trim() || null;
      dadosNovos.data_nascimento = params.data_nascimento || null;
      dadosNovos.nacionalidade = params.nacionalidade?.trim() || null;
      dadosNovos.naturalidade = params.naturalidade?.trim() || null;
      dadosNovos.municipio_nascimento = params.municipio_nascimento?.trim() || null;
      dadosNovos.uf_nascimento = params.uf_nascimento?.trim() || null;
      dadosNovos.pais_nacionalidade = params.pais_nacionalidade?.trim() || null;
      dadosNovos.profissao = params.profissao?.trim() || null;
      dadosNovos.estado_civil = params.estado_civil?.trim() || null;
      dadosNovos.grau_instrucao = params.grau_instrucao?.trim() || null;
      dadosNovos.necessidade_especial = params.necessidade_especial?.trim() || null;
    } else {
      dadosNovos.cnpj = normalizarCnpj(params.cnpj);
      dadosNovos.inscricao_estadual = params.inscricao_estadual?.trim() || null;
      dadosNovos.inscricao_municipal = params.inscricao_municipal?.trim() || null;
      dadosNovos.data_abertura = params.data_abertura || null;
      dadosNovos.orgao_publico = params.orgao_publico ?? null;
      dadosNovos.ds_tipo_pessoa = params.ds_tipo_pessoa?.trim() || null;
      dadosNovos.ramo_atividade = params.ramo_atividade?.trim() || null;
      dadosNovos.porte_codigo = params.porte_codigo?.trim() || null;
      dadosNovos.porte_descricao = params.porte_descricao?.trim() || null;
      dadosNovos.qualificacao_responsavel = params.qualificacao_responsavel?.trim() || null;
      dadosNovos.nome_fantasia = params.nome_fantasia?.trim() || null;
      dadosNovos.status_pje = params.status_pje?.trim() || null;
    }

    const { data, error } = await supabase.from('terceiros').insert(dadosNovos).select().single();

    if (error) {
      console.error('Erro ao criar terceiro:', error);
      return { sucesso: false, erro: `Erro ao criar terceiro: ${error.message}` };
    }

    return {
      sucesso: true,
      terceiro: converterParaTerceiro(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar terceiro:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Atualiza um terceiro existente
 */
export async function atualizarTerceiro(
  params: AtualizarTerceiroParams
): Promise<OperacaoTerceiroResult> {
  const supabase = createServiceClient();

  try {
    const { data: existente, error: erroBusca } = await supabase
      .from('terceiros')
      .select('id, tipo_pessoa')
      .eq('id', params.id)
      .single();

    if (erroBusca || !existente) {
      return { sucesso: false, erro: 'Terceiro não encontrado' };
    }

    const tipoPessoaAtual = existente.tipo_pessoa as 'pf' | 'pj';

    if (params.tipo_pessoa && params.tipo_pessoa !== tipoPessoaAtual) {
      return { sucesso: false, erro: 'Não é permitido alterar o tipo de pessoa' };
    }

    // Preparar dados para atualização
    const dadosAtualizacao: Record<string, unknown> = {};

    if (params.id_pje !== undefined) dadosAtualizacao.id_pje = params.id_pje;
    if (params.id_pessoa_pje !== undefined) dadosAtualizacao.id_pessoa_pje = params.id_pessoa_pje;
    if (params.tipo_parte !== undefined) dadosAtualizacao.tipo_parte = params.tipo_parte;
    if (params.polo !== undefined) dadosAtualizacao.polo = params.polo;
    if (params.nome !== undefined) dadosAtualizacao.nome = params.nome.trim();
    if (params.nome_social !== undefined)
      dadosAtualizacao.nome_social = params.nome_social?.trim() || null;
    if (params.emails !== undefined) dadosAtualizacao.emails = params.emails;
    if (params.ddd_celular !== undefined)
      dadosAtualizacao.ddd_celular = params.ddd_celular?.trim() || null;
    if (params.numero_celular !== undefined)
      dadosAtualizacao.numero_celular = params.numero_celular?.trim() || null;
    if (params.ddd_residencial !== undefined)
      dadosAtualizacao.ddd_residencial = params.ddd_residencial?.trim() || null;
    if (params.numero_residencial !== undefined)
      dadosAtualizacao.numero_residencial = params.numero_residencial?.trim() || null;
    if (params.ddd_comercial !== undefined)
      dadosAtualizacao.ddd_comercial = params.ddd_comercial?.trim() || null;
    if (params.numero_comercial !== undefined)
      dadosAtualizacao.numero_comercial = params.numero_comercial?.trim() || null;
    if (params.fax !== undefined) dadosAtualizacao.fax = params.fax?.trim() || null;
    if (params.situacao !== undefined) dadosAtualizacao.situacao = params.situacao;
    if (params.observacoes !== undefined)
      dadosAtualizacao.observacoes = params.observacoes?.trim() || null;
    if (params.dados_anteriores !== undefined)
      dadosAtualizacao.dados_anteriores = params.dados_anteriores;

    // Campos específicos por tipo de pessoa (mesma lógica de clientes/partes_contrarias)
    if (tipoPessoaAtual === 'pf' && params.tipo_pessoa === 'pf') {
      if (params.cpf !== undefined) dadosAtualizacao.cpf = normalizarCpf(params.cpf);
      if (params.tipo_documento !== undefined)
        dadosAtualizacao.tipo_documento = params.tipo_documento?.trim() || null;
      if (params.numero_rg !== undefined)
        dadosAtualizacao.numero_rg = params.numero_rg?.trim() || null;
      if (params.orgao_emissor_rg !== undefined)
        dadosAtualizacao.orgao_emissor_rg = params.orgao_emissor_rg?.trim() || null;
      if (params.uf_rg !== undefined) dadosAtualizacao.uf_rg = params.uf_rg?.trim() || null;
      if (params.data_expedicao_rg !== undefined)
        dadosAtualizacao.data_expedicao_rg = params.data_expedicao_rg;
      if (params.sexo !== undefined) dadosAtualizacao.sexo = params.sexo?.trim() || null;
      if (params.nome_genitora !== undefined)
        dadosAtualizacao.nome_genitora = params.nome_genitora?.trim() || null;
      if (params.data_nascimento !== undefined)
        dadosAtualizacao.data_nascimento = params.data_nascimento;
      if (params.nacionalidade !== undefined)
        dadosAtualizacao.nacionalidade = params.nacionalidade?.trim() || null;
      if (params.naturalidade !== undefined)
        dadosAtualizacao.naturalidade = params.naturalidade?.trim() || null;
      if (params.municipio_nascimento !== undefined)
        dadosAtualizacao.municipio_nascimento = params.municipio_nascimento?.trim() || null;
      if (params.uf_nascimento !== undefined)
        dadosAtualizacao.uf_nascimento = params.uf_nascimento?.trim() || null;
      if (params.pais_nacionalidade !== undefined)
        dadosAtualizacao.pais_nacionalidade = params.pais_nacionalidade?.trim() || null;
      if (params.profissao !== undefined)
        dadosAtualizacao.profissao = params.profissao?.trim() || null;
      if (params.estado_civil !== undefined)
        dadosAtualizacao.estado_civil = params.estado_civil?.trim() || null;
      if (params.grau_instrucao !== undefined)
        dadosAtualizacao.grau_instrucao = params.grau_instrucao?.trim() || null;
      if (params.necessidade_especial !== undefined)
        dadosAtualizacao.necessidade_especial = params.necessidade_especial?.trim() || null;
    } else if (tipoPessoaAtual === 'pj' && params.tipo_pessoa === 'pj') {
      if (params.cnpj !== undefined) dadosAtualizacao.cnpj = normalizarCnpj(params.cnpj);
      if (params.inscricao_estadual !== undefined)
        dadosAtualizacao.inscricao_estadual = params.inscricao_estadual?.trim() || null;
      if (params.inscricao_municipal !== undefined)
        dadosAtualizacao.inscricao_municipal = params.inscricao_municipal?.trim() || null;
      if (params.data_abertura !== undefined) dadosAtualizacao.data_abertura = params.data_abertura;
      if (params.orgao_publico !== undefined) dadosAtualizacao.orgao_publico = params.orgao_publico;
      if (params.ds_tipo_pessoa !== undefined)
        dadosAtualizacao.ds_tipo_pessoa = params.ds_tipo_pessoa?.trim() || null;
      if (params.ramo_atividade !== undefined)
        dadosAtualizacao.ramo_atividade = params.ramo_atividade?.trim() || null;
      if (params.porte_codigo !== undefined)
        dadosAtualizacao.porte_codigo = params.porte_codigo?.trim() || null;
      if (params.porte_descricao !== undefined)
        dadosAtualizacao.porte_descricao = params.porte_descricao?.trim() || null;
      if (params.qualificacao_responsavel !== undefined)
        dadosAtualizacao.qualificacao_responsavel =
          params.qualificacao_responsavel?.trim() || null;
      if (params.nome_fantasia !== undefined)
        dadosAtualizacao.nome_fantasia = params.nome_fantasia?.trim() || null;
      if (params.status_pje !== undefined)
        dadosAtualizacao.status_pje = params.status_pje?.trim() || null;
    }

    const { data, error } = await supabase
      .from('terceiros')
      .update(dadosAtualizacao)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar terceiro:', error);
      return { sucesso: false, erro: `Erro ao atualizar: ${error.message}` };
    }

    return {
      sucesso: true,
      terceiro: converterParaTerceiro(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao atualizar terceiro:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Busca um terceiro por ID
 */
export async function buscarTerceiroPorId(id: number): Promise<Terceiro | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.from('terceiros').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar terceiro: ${error.message}`);
  }

  return data ? converterParaTerceiro(data) : null;
}

/**
 * Busca um terceiro por id_pessoa_pje
 */
export async function buscarTerceiroPorIdPessoaPje(id_pessoa_pje: number): Promise<Terceiro | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('terceiros')
    .select('*')
    .eq('id_pessoa_pje', id_pessoa_pje)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar por id_pessoa_pje: ${error.message}`);
  }

  return data ? converterParaTerceiro(data) : null;
}

/**
 * Busca terceiros por processo
 */
export async function buscarTerceirosPorProcesso(
  params: BuscarTerceirosPorProcessoParams
): Promise<Terceiro[]> {
  const supabase = createServiceClient();

  let query = supabase.from('terceiros').select('*').eq('processo_id', params.processo_id);

  if (params.tipo_parte) {
    query = query.eq('tipo_parte', params.tipo_parte);
  }

  const { data, error } = await query.order('tipo_parte', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar terceiros por processo: ${error.message}`);
  }

  return (data || []).map(converterParaTerceiro);
}

/**
 * Lista terceiros com filtros e paginação
 */
export async function listarTerceiros(
  params: ListarTerceirosParams = {}
): Promise<ListarTerceirosResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from('terceiros').select('*', { count: 'exact' });

  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `nome.ilike.%${busca}%,nome_social.ilike.%${busca}%,cpf.ilike.%${busca}%,cnpj.ilike.%${busca}%`
    );
  }

  if (params.tipo_pessoa) {
    query = query.eq('tipo_pessoa', params.tipo_pessoa);
  }

  if (params.tipo_parte) {
    query = query.eq('tipo_parte', params.tipo_parte);
  }

  if (params.polo) {
    query = query.eq('polo', params.polo);
  }

  if (params.nome) {
    query = query.ilike('nome', `%${params.nome}%`);
  }

  if (params.cpf) {
    query = query.eq('cpf', normalizarCpf(params.cpf));
  }

  if (params.cnpj) {
    query = query.eq('cnpj', normalizarCnpj(params.cnpj));
  }

  if (params.id_pessoa_pje) {
    query = query.eq('id_pessoa_pje', params.id_pessoa_pje);
  }

  const ordenarPor = params.ordenar_por ?? 'created_at';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar terceiros: ${error.message}`);
  }

  const terceiros = (data || []).map(converterParaTerceiro);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    terceiros,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

/**
 * Upsert por id_pessoa_pje (cria se não existir, atualiza se existir)
 */
export async function upsertTerceiroPorIdPessoa(
  params: UpsertTerceiroPorIdPessoaParams
): Promise<OperacaoTerceiroResult> {
  try {
    const existente = await buscarTerceiroPorIdPessoaPje(params.id_pessoa_pje);

    if (existente) {
      return await atualizarTerceiro({
        id: existente.id,
        ...params,
      });
    } else {
      return await criarTerceiro(params);
    }
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao fazer upsert:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Deleta um terceiro por ID
 */
export async function deletarTerceiro(id: number): Promise<OperacaoTerceiroResult> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase.from('terceiros').delete().eq('id', id);

    if (error) {
      console.error('Erro ao deletar terceiro:', error);
      return { sucesso: false, erro: `Erro ao deletar: ${error.message}` };
    }

    return { sucesso: true };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao deletar:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}
