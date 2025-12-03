// Serviço de persistência de terceiros
// Gerencia operações de CRUD na tabela terceiros (tabela global, sem vinculação direta a processos)

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { Terceiro } from '@/types/domain/partes';
import type { ProcessoRelacionado } from '@/types/domain/processo-relacionado';
import type {
  CriarTerceiroParams,
  AtualizarTerceiroParams,
  ListarTerceirosParams,
  ListarTerceirosResult,
  UpsertTerceiroPorCPFParams,
  UpsertTerceiroPorCNPJParams,
  UpsertTerceiroPorDocumentoParams,
  TerceiroComEndereco,
} from '@/types/contracts/partes';
import { converterParaEndereco } from '@/backend/enderecos/services/enderecos-persistence.service';

/**
 * Terceiro com endereço e processos relacionados
 */
export type TerceiroComEnderecoEProcessos = TerceiroComEndereco & {
  processos_relacionados: ProcessoRelacionado[];
};

/**
 * Resultado de operação
 */
export interface OperacaoTerceiroResult {
  sucesso: boolean;
  terceiro?: Terceiro;
  erro?: string;
  /** Indica se a entidade foi criada (true) ou atualizada (false) - apenas para upsert */
  criado?: boolean;
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

  // Campos base comuns a PF e PJ (conforme TerceiroBase)
  const base = {
    id: data.id as number,
    id_tipo_parte: (data.id_tipo_parte as number | null) ?? null,
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
    nome_fantasia: (data.nome_fantasia as string | null) ?? null,
    emails: (data.emails as string[] | null) ?? null,
    ddd_celular: (data.ddd_celular as string | null) ?? null,
    numero_celular: (data.numero_celular as string | null) ?? null,
    ddd_residencial: (data.ddd_residencial as string | null) ?? null,
    numero_residencial: (data.numero_residencial as string | null) ?? null,
    ddd_comercial: (data.ddd_comercial as string | null) ?? null,
    numero_comercial: (data.numero_comercial as string | null) ?? null,
    // Flags
    principal: (data.principal as boolean | null) ?? null,
    autoridade: (data.autoridade as boolean | null) ?? null,
    endereco_desconhecido: (data.endereco_desconhecido as boolean | null) ?? null,
    // Status PJE
    status_pje: (data.status_pje as string | null) ?? null,
    situacao_pje: (data.situacao_pje as string | null) ?? null,
    login_pje: (data.login_pje as string | null) ?? null,
    ordem: (data.ordem as number | null) ?? null,
    // Controle
    observacoes: (data.observacoes as string | null) ?? null,
    dados_anteriores: (data.dados_anteriores as Record<string, unknown> | null) ?? null,
    ativo: (data.ativo as boolean | null) ?? null,
    endereco_id: (data.endereco_id as number | null) ?? null,
    ultima_atualizacao_pje: (data.ultima_atualizacao_pje as string | null) ?? null,
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
      rg: (data.rg as string | null) ?? null,
      sexo: (data.sexo as string | null) ?? null,
      nome_genitora: (data.nome_genitora as string | null) ?? null,
      data_nascimento: data.data_nascimento as string | null,
      genero: (data.genero as string | null) ?? null,
      estado_civil: (data.estado_civil as string | null) ?? null,
      nacionalidade: (data.nacionalidade as string | null) ?? null,
      // Campos detalhados do PJE - UF Nascimento
      uf_nascimento_id_pje: (data.uf_nascimento_id_pje as number | null) ?? null,
      uf_nascimento_sigla: (data.uf_nascimento_sigla as string | null) ?? null,
      uf_nascimento_descricao: (data.uf_nascimento_descricao as string | null) ?? null,
      // Campos detalhados do PJE - Naturalidade
      naturalidade_id_pje: (data.naturalidade_id_pje as number | null) ?? null,
      naturalidade_municipio: (data.naturalidade_municipio as string | null) ?? null,
      naturalidade_estado_id_pje: (data.naturalidade_estado_id_pje as number | null) ?? null,
      naturalidade_estado_sigla: (data.naturalidade_estado_sigla as string | null) ?? null,
      // Campos detalhados do PJE - País Nascimento
      pais_nascimento_id_pje: (data.pais_nascimento_id_pje as number | null) ?? null,
      pais_nascimento_codigo: (data.pais_nascimento_codigo as string | null) ?? null,
      pais_nascimento_descricao: (data.pais_nascimento_descricao as string | null) ?? null,
      // Outros campos do PJE
      escolaridade_codigo: (data.escolaridade_codigo as number | null) ?? null,
      situacao_cpf_receita_id: (data.situacao_cpf_receita_id as number | null) ?? null,
      situacao_cpf_receita_descricao: (data.situacao_cpf_receita_descricao as string | null) ?? null,
      pode_usar_celular_mensagem: (data.pode_usar_celular_mensagem as boolean | null) ?? null,
    };
  } else {
    return {
      ...base,
      tipo_pessoa: 'pj',
      cnpj: data.cnpj as string,
      cpf: null,
      inscricao_estadual: (data.inscricao_estadual as string | null) ?? null,
      data_abertura: data.data_abertura as string | null,
      data_fim_atividade: data.data_fim_atividade as string | null,
      orgao_publico: (data.orgao_publico as boolean | null) ?? null,
      tipo_pessoa_codigo_pje: (data.tipo_pessoa_codigo_pje as string | null) ?? null,
      tipo_pessoa_label_pje: (data.tipo_pessoa_label_pje as string | null) ?? null,
      tipo_pessoa_validacao_receita: (data.tipo_pessoa_validacao_receita as string | null) ?? null,
      ds_tipo_pessoa: (data.ds_tipo_pessoa as string | null) ?? null,
      situacao_cnpj_receita_id: (data.situacao_cnpj_receita_id as number | null) ?? null,
      situacao_cnpj_receita_descricao: (data.situacao_cnpj_receita_descricao as string | null) ?? null,
      ramo_atividade: (data.ramo_atividade as string | null) ?? null,
      cpf_responsavel: (data.cpf_responsavel as string | null) ?? null,
      oficial: (data.oficial as boolean | null) ?? null,
      ds_prazo_expediente_automatico: (data.ds_prazo_expediente_automatico as string | null) ?? null,
      porte_codigo: (data.porte_codigo as number | null) ?? null,
      porte_descricao: (data.porte_descricao as string | null) ?? null,
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

    // Preparar dados para inserção (campos comuns conforme tipos)
    const dadosNovos: Record<string, unknown> = {
      tipo_parte: params.tipo_parte,
      polo: params.polo,
      tipo_pessoa: params.tipo_pessoa,
      nome: params.nome.trim(),
      nome_fantasia: params.nome_fantasia?.trim() || null,
      emails: params.emails ?? null,
      ddd_celular: params.ddd_celular?.trim() || null,
      numero_celular: params.numero_celular?.trim() || null,
      ddd_residencial: params.ddd_residencial?.trim() || null,
      numero_residencial: params.numero_residencial?.trim() || null,
      ddd_comercial: params.ddd_comercial?.trim() || null,
      numero_comercial: params.numero_comercial?.trim() || null,
      // Flags
      principal: params.principal ?? null,
      autoridade: params.autoridade ?? null,
      endereco_desconhecido: params.endereco_desconhecido ?? null,
      // Status PJE
      status_pje: params.status_pje?.trim() || null,
      situacao_pje: params.situacao_pje?.trim() || null,
      login_pje: params.login_pje?.trim() || null,
      ordem: params.ordem ?? null,
      // Controle
      observacoes: params.observacoes?.trim() || null,
      dados_anteriores: params.dados_anteriores ?? null,
      ativo: params.ativo ?? true,
      endereco_id: params.endereco_id ?? null,
    };

    if (params.tipo_pessoa === 'pf') {
      dadosNovos.cpf = normalizarCpf(params.cpf);
      dadosNovos.tipo_documento = params.tipo_documento?.trim() || null;
      dadosNovos.rg = params.rg?.trim() || null;
      dadosNovos.sexo = params.sexo?.trim() || null;
      dadosNovos.nome_genitora = params.nome_genitora?.trim() || null;
      dadosNovos.data_nascimento = params.data_nascimento || null;
      dadosNovos.genero = params.genero?.trim() || null;
      dadosNovos.estado_civil = params.estado_civil?.trim() || null;
      dadosNovos.nacionalidade = params.nacionalidade?.trim() || null;
      // Campos detalhados do PJE - UF Nascimento
      dadosNovos.uf_nascimento_id_pje = params.uf_nascimento_id_pje ?? null;
      dadosNovos.uf_nascimento_sigla = params.uf_nascimento_sigla?.trim() || null;
      dadosNovos.uf_nascimento_descricao = params.uf_nascimento_descricao?.trim() || null;
      // Campos detalhados do PJE - Naturalidade
      dadosNovos.naturalidade_id_pje = params.naturalidade_id_pje ?? null;
      dadosNovos.naturalidade_municipio = params.naturalidade_municipio?.trim() || null;
      dadosNovos.naturalidade_estado_id_pje = params.naturalidade_estado_id_pje ?? null;
      dadosNovos.naturalidade_estado_sigla = params.naturalidade_estado_sigla?.trim() || null;
      // Campos detalhados do PJE - País Nascimento
      dadosNovos.pais_nascimento_id_pje = params.pais_nascimento_id_pje ?? null;
      dadosNovos.pais_nascimento_codigo = params.pais_nascimento_codigo?.trim() || null;
      dadosNovos.pais_nascimento_descricao = params.pais_nascimento_descricao?.trim() || null;
      // Outros campos do PJE
      dadosNovos.escolaridade_codigo = params.escolaridade_codigo ?? null;
      dadosNovos.situacao_cpf_receita_id = params.situacao_cpf_receita_id ?? null;
      dadosNovos.situacao_cpf_receita_descricao = params.situacao_cpf_receita_descricao?.trim() || null;
      dadosNovos.pode_usar_celular_mensagem = params.pode_usar_celular_mensagem ?? null;
    } else {
      dadosNovos.cnpj = normalizarCnpj(params.cnpj);
      dadosNovos.inscricao_estadual = params.inscricao_estadual?.trim() || null;
      dadosNovos.data_abertura = params.data_abertura || null;
      dadosNovos.data_fim_atividade = params.data_fim_atividade || null;
      dadosNovos.orgao_publico = params.orgao_publico ?? null;
      dadosNovos.tipo_pessoa_codigo_pje = params.tipo_pessoa_codigo_pje?.trim() || null;
      dadosNovos.tipo_pessoa_label_pje = params.tipo_pessoa_label_pje?.trim() || null;
      dadosNovos.tipo_pessoa_validacao_receita = params.tipo_pessoa_validacao_receita?.trim() || null;
      dadosNovos.ds_tipo_pessoa = params.ds_tipo_pessoa?.trim() || null;
      dadosNovos.situacao_cnpj_receita_id = params.situacao_cnpj_receita_id ?? null;
      dadosNovos.situacao_cnpj_receita_descricao = params.situacao_cnpj_receita_descricao?.trim() || null;
      dadosNovos.ramo_atividade = params.ramo_atividade?.trim() || null;
      dadosNovos.cpf_responsavel = params.cpf_responsavel?.trim() || null;
      dadosNovos.oficial = params.oficial ?? null;
      dadosNovos.ds_prazo_expediente_automatico = params.ds_prazo_expediente_automatico?.trim() || null;
      dadosNovos.porte_codigo = params.porte_codigo ?? null;
      dadosNovos.porte_descricao = params.porte_descricao?.trim() || null;
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

    // Preparar dados para atualização (campos comuns conforme tipos)
    const dadosAtualizacao: Record<string, unknown> = {};

    if (params.tipo_parte !== undefined) dadosAtualizacao.tipo_parte = params.tipo_parte;
    if (params.polo !== undefined) dadosAtualizacao.polo = params.polo;
    if (params.nome !== undefined) dadosAtualizacao.nome = params.nome.trim();
    if (params.nome_fantasia !== undefined)
      dadosAtualizacao.nome_fantasia = params.nome_fantasia?.trim() || null;
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
    // Flags
    if (params.principal !== undefined) dadosAtualizacao.principal = params.principal;
    if (params.autoridade !== undefined) dadosAtualizacao.autoridade = params.autoridade;
    if (params.endereco_desconhecido !== undefined)
      dadosAtualizacao.endereco_desconhecido = params.endereco_desconhecido;
    // Status PJE
    if (params.status_pje !== undefined)
      dadosAtualizacao.status_pje = params.status_pje?.trim() || null;
    if (params.situacao_pje !== undefined)
      dadosAtualizacao.situacao_pje = params.situacao_pje?.trim() || null;
    if (params.login_pje !== undefined)
      dadosAtualizacao.login_pje = params.login_pje?.trim() || null;
    if (params.ordem !== undefined) dadosAtualizacao.ordem = params.ordem;
    // Controle
    if (params.observacoes !== undefined)
      dadosAtualizacao.observacoes = params.observacoes?.trim() || null;
    if (params.dados_anteriores !== undefined)
      dadosAtualizacao.dados_anteriores = params.dados_anteriores;
    if (params.ativo !== undefined) dadosAtualizacao.ativo = params.ativo;
    if (params.endereco_id !== undefined) dadosAtualizacao.endereco_id = params.endereco_id;

    // Campos específicos por tipo de pessoa (conforme tipos definidos)
    if (tipoPessoaAtual === 'pf' && params.tipo_pessoa === 'pf') {
      if (params.cpf !== undefined) dadosAtualizacao.cpf = normalizarCpf(params.cpf);
      if (params.tipo_documento !== undefined)
        dadosAtualizacao.tipo_documento = params.tipo_documento?.trim() || null;
      if (params.rg !== undefined) dadosAtualizacao.rg = params.rg?.trim() || null;
      if (params.sexo !== undefined) dadosAtualizacao.sexo = params.sexo?.trim() || null;
      if (params.nome_genitora !== undefined)
        dadosAtualizacao.nome_genitora = params.nome_genitora?.trim() || null;
      if (params.data_nascimento !== undefined)
        dadosAtualizacao.data_nascimento = params.data_nascimento;
      if (params.genero !== undefined) dadosAtualizacao.genero = params.genero?.trim() || null;
      if (params.estado_civil !== undefined)
        dadosAtualizacao.estado_civil = params.estado_civil?.trim() || null;
      if (params.nacionalidade !== undefined)
        dadosAtualizacao.nacionalidade = params.nacionalidade?.trim() || null;
      // Campos detalhados do PJE - UF Nascimento
      if (params.uf_nascimento_id_pje !== undefined)
        dadosAtualizacao.uf_nascimento_id_pje = params.uf_nascimento_id_pje;
      if (params.uf_nascimento_sigla !== undefined)
        dadosAtualizacao.uf_nascimento_sigla = params.uf_nascimento_sigla?.trim() || null;
      if (params.uf_nascimento_descricao !== undefined)
        dadosAtualizacao.uf_nascimento_descricao = params.uf_nascimento_descricao?.trim() || null;
      // Campos detalhados do PJE - Naturalidade
      if (params.naturalidade_id_pje !== undefined)
        dadosAtualizacao.naturalidade_id_pje = params.naturalidade_id_pje;
      if (params.naturalidade_municipio !== undefined)
        dadosAtualizacao.naturalidade_municipio = params.naturalidade_municipio?.trim() || null;
      if (params.naturalidade_estado_id_pje !== undefined)
        dadosAtualizacao.naturalidade_estado_id_pje = params.naturalidade_estado_id_pje;
      if (params.naturalidade_estado_sigla !== undefined)
        dadosAtualizacao.naturalidade_estado_sigla = params.naturalidade_estado_sigla?.trim() || null;
      // Campos detalhados do PJE - País Nascimento
      if (params.pais_nascimento_id_pje !== undefined)
        dadosAtualizacao.pais_nascimento_id_pje = params.pais_nascimento_id_pje;
      if (params.pais_nascimento_codigo !== undefined)
        dadosAtualizacao.pais_nascimento_codigo = params.pais_nascimento_codigo?.trim() || null;
      if (params.pais_nascimento_descricao !== undefined)
        dadosAtualizacao.pais_nascimento_descricao = params.pais_nascimento_descricao?.trim() || null;
      // Outros campos do PJE
      if (params.escolaridade_codigo !== undefined)
        dadosAtualizacao.escolaridade_codigo = params.escolaridade_codigo;
      if (params.situacao_cpf_receita_id !== undefined)
        dadosAtualizacao.situacao_cpf_receita_id = params.situacao_cpf_receita_id;
      if (params.situacao_cpf_receita_descricao !== undefined)
        dadosAtualizacao.situacao_cpf_receita_descricao = params.situacao_cpf_receita_descricao?.trim() || null;
      if (params.pode_usar_celular_mensagem !== undefined)
        dadosAtualizacao.pode_usar_celular_mensagem = params.pode_usar_celular_mensagem;
    } else if (tipoPessoaAtual === 'pj' && params.tipo_pessoa === 'pj') {
      if (params.cnpj !== undefined) dadosAtualizacao.cnpj = normalizarCnpj(params.cnpj);
      if (params.inscricao_estadual !== undefined)
        dadosAtualizacao.inscricao_estadual = params.inscricao_estadual?.trim() || null;
      if (params.data_abertura !== undefined) dadosAtualizacao.data_abertura = params.data_abertura;
      if (params.data_fim_atividade !== undefined)
        dadosAtualizacao.data_fim_atividade = params.data_fim_atividade;
      if (params.orgao_publico !== undefined) dadosAtualizacao.orgao_publico = params.orgao_publico;
      if (params.tipo_pessoa_codigo_pje !== undefined)
        dadosAtualizacao.tipo_pessoa_codigo_pje = params.tipo_pessoa_codigo_pje?.trim() || null;
      if (params.tipo_pessoa_label_pje !== undefined)
        dadosAtualizacao.tipo_pessoa_label_pje = params.tipo_pessoa_label_pje?.trim() || null;
      if (params.tipo_pessoa_validacao_receita !== undefined)
        dadosAtualizacao.tipo_pessoa_validacao_receita = params.tipo_pessoa_validacao_receita?.trim() || null;
      if (params.ds_tipo_pessoa !== undefined)
        dadosAtualizacao.ds_tipo_pessoa = params.ds_tipo_pessoa?.trim() || null;
      if (params.situacao_cnpj_receita_id !== undefined)
        dadosAtualizacao.situacao_cnpj_receita_id = params.situacao_cnpj_receita_id;
      if (params.situacao_cnpj_receita_descricao !== undefined)
        dadosAtualizacao.situacao_cnpj_receita_descricao = params.situacao_cnpj_receita_descricao?.trim() || null;
      if (params.ramo_atividade !== undefined)
        dadosAtualizacao.ramo_atividade = params.ramo_atividade?.trim() || null;
      if (params.cpf_responsavel !== undefined)
        dadosAtualizacao.cpf_responsavel = params.cpf_responsavel?.trim() || null;
      if (params.oficial !== undefined) dadosAtualizacao.oficial = params.oficial;
      if (params.ds_prazo_expediente_automatico !== undefined)
        dadosAtualizacao.ds_prazo_expediente_automatico = params.ds_prazo_expediente_automatico?.trim() || null;
      if (params.porte_codigo !== undefined) dadosAtualizacao.porte_codigo = params.porte_codigo;
      if (params.porte_descricao !== undefined)
        dadosAtualizacao.porte_descricao = params.porte_descricao?.trim() || null;
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
 * Busca um terceiro por CPF (com cache)
 */
export async function buscarTerceiroPorCPF(cpf: string): Promise<Terceiro | null> {
  const supabase = createServiceClient();
  const cpfNormalizado = normalizarCpf(cpf);

  // Cache não implementado para terceiros ainda - TODO: adicionar se necessário

  const { data, error } = await supabase
    .from('terceiros')
    .select('*')
    .eq('cpf', cpfNormalizado)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar terceiro por CPF: ${error.message}`);
  }

  return data ? converterParaTerceiro(data) : null;
}

/**
 * Busca um terceiro por CNPJ (com cache)
 */
export async function buscarTerceiroPorCNPJ(cnpj: string): Promise<Terceiro | null> {
  const supabase = createServiceClient();
  const cnpjNormalizado = normalizarCnpj(cnpj);

  // Cache não implementado para terceiros ainda - TODO: adicionar se necessário

  const { data, error } = await supabase
    .from('terceiros')
    .select('*')
    .eq('cnpj', cnpjNormalizado)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar terceiro por CNPJ: ${error.message}`);
  }

  return data ? converterParaTerceiro(data) : null;
}

/**
 * Busca terceiros por nome (busca parcial com ILIKE)
 * Retorna um array com todos os terceiros que contêm o nome buscado
 */
export async function buscarTerceirosPorNome(nome: string): Promise<Terceiro[]> {
  const supabase = createServiceClient();
  const nomeBusca = nome.trim();

  if (!nomeBusca) {
    return [];
  }

  const { data, error } = await supabase
    .from('terceiros')
    .select('*')
    .ilike('nome', `%${nomeBusca}%`)
    .order('nome', { ascending: true })
    .limit(100); // Limitar a 100 resultados para evitar sobrecarga

  if (error) {
    throw new Error(`Erro ao buscar terceiros por nome: ${error.message}`);
  }

  return (data || []).map(converterParaTerceiro);
}

/**
 * @deprecated Esta função está obsoleta pois terceiros agora é uma tabela global.
 * Use uma query via processo_partes para buscar terceiros de um processo específico.
 * A vinculação é feita através da tabela processo_partes com tipo_entidade='terceiro'.
 */
export async function buscarTerceirosPorProcesso(
  __params: { processo_id: number; tipo_parte?: string }
): Promise<Terceiro[]> {
  throw new Error(
    'buscarTerceirosPorProcesso está obsoleto. Use query via processo_partes para buscar terceiros de um processo.'
  );
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
      `nome.ilike.%${busca}%,nome_fantasia.ilike.%${busca}%,cpf.ilike.%${busca}%,cnpj.ilike.%${busca}%`
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

  // id_pessoa_pje foi movido para cadastros_pje

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
 * Upsert terceiro por CPF
 */
export async function upsertTerceiroPorCPF(
  params: UpsertTerceiroPorCPFParams
): Promise<OperacaoTerceiroResult & { criado: boolean }> {
  try {
    const supabase = createServiceClient();
    const cpfNormalizado = normalizarCpf(params.cpf);

    const { data: existente } = await supabase
      .from('terceiros')
      .select('id')
      .eq('cpf', cpfNormalizado)
      .maybeSingle();

    const criado = !existente;

    const row: Record<string, unknown> = {
      ...params,
      tipo_pessoa: 'pf',
      cpf: cpfNormalizado,
    };

    let data, error;

    if (existente) {
      // UPDATE existente - evita usar upsert com constraints parciais
      const result = await supabase
        .from('terceiros')
        .update(row)
        .eq('id', existente.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // INSERT novo
      const result = await supabase
        .from('terceiros')
        .insert(row)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      return { sucesso: false, erro: error.message, criado: false };
    }

    return { sucesso: true, terceiro: converterParaTerceiro(data), criado };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}`, criado: false };
  }
}

/**
 * Upsert terceiro por CNPJ
 */
export async function upsertTerceiroPorCNPJ(
  params: UpsertTerceiroPorCNPJParams
): Promise<OperacaoTerceiroResult & { criado: boolean }> {
  try {
    const supabase = createServiceClient();
    const cnpjNormalizado = normalizarCnpj(params.cnpj);

    const { data: existente } = await supabase
      .from('terceiros')
      .select('id')
      .eq('cnpj', cnpjNormalizado)
      .maybeSingle();

    const criado = !existente;

    const row: Record<string, unknown> = {
      ...params,
      tipo_pessoa: 'pj',
      cnpj: cnpjNormalizado,
    };

    let data, error;

    if (existente) {
      // UPDATE existente - evita usar upsert com constraints parciais
      const result = await supabase
        .from('terceiros')
        .update(row)
        .eq('id', existente.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // INSERT novo
      const result = await supabase
        .from('terceiros')
        .insert(row)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      return { sucesso: false, erro: error.message, criado: false };
    }

    return { sucesso: true, terceiro: converterParaTerceiro(data), criado };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}`, criado: false };
  }
}

/**
 * Upsert terceiro por documento (CPF ou CNPJ)
 */
export async function upsertTerceiroPorDocumento(
  params: UpsertTerceiroPorDocumentoParams
): Promise<OperacaoTerceiroResult & { criado: boolean }> {
  return 'cpf' in params ? upsertTerceiroPorCPF(params) : upsertTerceiroPorCNPJ(params);
}

/**
 * Parâmetros para criar terceiro sem documento
 * NOTA: tipo_pessoa, tipo_parte e polo são opcionais - terão valores padrão se não fornecidos
 * Isso permite criar terceiros com dados incompletos do PJE (ex: TESTEMUNHA)
 */
export interface CriarTerceiroSemDocumentoParams {
  nome: string;
  tipo_pessoa?: 'pf' | 'pj';
  tipo_parte?: string;
  polo?: string;
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  principal?: boolean;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  status_pje?: string;
  situacao_pje?: string;
  login_pje?: string;
  ordem?: number;
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
  ativo?: boolean;
  endereco_id?: number;
}

/**
 * Cria um terceiro SEM documento (CPF/CNPJ)
 * 
 * PROPÓSITO:
 * Permite criar entidades especiais que não possuem CPF/CNPJ cadastrado no PJE,
 * como Ministério Público, órgãos governamentais, peritos sem documento, etc.
 * 
 * ATENÇÃO:
 * Esta função NÃO faz deduplicação por documento. Múltiplas chamadas criarão
 * registros distintos. A deduplicação deve ser feita pelo chamador usando
 * cadastros_pje (id_pessoa_pje) como identificador único.
 */
export async function criarTerceiroSemDocumento(
  params: CriarTerceiroSemDocumentoParams
): Promise<OperacaoTerceiroResult> {
  const supabase = createServiceClient();

  try {
    // Validações obrigatórias (apenas nome - o resto tem defaults)
    // NOTA: Dados do PJE podem vir incompletos (ex: TESTEMUNHA sem tipo_parte/polo)
    if (!params.nome?.trim()) {
      return { sucesso: false, erro: 'Nome é obrigatório' };
    }

    // Usa valores padrão se não fornecidos (comum em terceiros do PJE)
    const tipoPessoa = params.tipo_pessoa || 'pf';
    const tipoParte = params.tipo_parte?.trim() || 'OUTRO';
    const polo = params.polo?.trim() || 'OUTROS';

    // Preparar dados para inserção (sem CPF/CNPJ)
    const dadosNovos: Record<string, unknown> = {
      tipo_parte: tipoParte,
      polo: polo,
      tipo_pessoa: tipoPessoa,
      nome: params.nome.trim(),
      nome_fantasia: params.nome_fantasia?.trim() || null,
      emails: params.emails ?? null,
      ddd_celular: params.ddd_celular?.trim() || null,
      numero_celular: params.numero_celular?.trim() || null,
      ddd_residencial: params.ddd_residencial?.trim() || null,
      numero_residencial: params.numero_residencial?.trim() || null,
      ddd_comercial: params.ddd_comercial?.trim() || null,
      numero_comercial: params.numero_comercial?.trim() || null,
      principal: params.principal ?? null,
      autoridade: params.autoridade ?? null,
      endereco_desconhecido: params.endereco_desconhecido ?? null,
      status_pje: params.status_pje?.trim() || null,
      situacao_pje: params.situacao_pje?.trim() || null,
      login_pje: params.login_pje?.trim() || null,
      ordem: params.ordem ?? null,
      observacoes: params.observacoes?.trim() || null,
      dados_anteriores: params.dados_anteriores ?? null,
      ativo: params.ativo ?? true,
      endereco_id: params.endereco_id ?? null,
      // CPF e CNPJ ficam nulos
      cpf: null,
      cnpj: null,
    };

    const { data, error } = await supabase.from('terceiros').insert(dadosNovos).select().single();

    if (error) {
      console.error('Erro ao criar terceiro sem documento:', error);
      return { sucesso: false, erro: `Erro ao criar terceiro: ${error.message}` };
    }

    return {
      sucesso: true,
      terceiro: converterParaTerceiro(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar terceiro sem documento:', error);
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

// ============================================================================
// Funções com JOIN para endereços
// ============================================================================

/**
 * Busca um terceiro por ID com endereço populado via LEFT JOIN
 */
export async function buscarTerceiroComEndereco(id: number): Promise<TerceiroComEndereco | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('terceiros')
    .select(`
      *,
      endereco:enderecos(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar terceiro com endereço: ${error.message}`);
  }

  if (!data) return null;

  const terceiro = converterParaTerceiro(data);
  const endereco = data.endereco ? converterParaEndereco(data.endereco) : null;

  return {
    ...terceiro,
    endereco,
  } as TerceiroComEndereco;
}

/**
 * Lista terceiros com endereços populados via LEFT JOIN
 */
export async function listarTerceirosComEndereco(
  params: ListarTerceirosParams = {}
): Promise<ListarTerceirosResult & { terceiros: TerceiroComEndereco[] }> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from('terceiros').select(
    `
      *,
      endereco:enderecos(*)
    `,
    { count: 'exact' }
  );

  // Aplicar filtros
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `nome.ilike.%${busca}%,nome_fantasia.ilike.%${busca}%,cpf.ilike.%${busca}%,cnpj.ilike.%${busca}%`
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

  // id_pessoa_pje foi movido para cadastros_pje

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'created_at';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Aplicar paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar terceiros com endereço: ${error.message}`);
  }

  const terceiros = (data || []).map((row) => {
    const terceiro = converterParaTerceiro(row);
    const endereco = row.endereco ? converterParaEndereco(row.endereco) : null;
    return {
      ...terceiro,
      endereco,
    } as TerceiroComEndereco;
  });

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
 * Lista terceiros com endereços e processos relacionados
 */
export async function listarTerceirosComEnderecoEProcessos(
  params: ListarTerceirosParams = {}
): Promise<ListarTerceirosResult & { terceiros: TerceiroComEnderecoEProcessos[] }> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  // Primeiro buscar terceiros com endereço
  let query = supabase.from('terceiros').select(
    `
      *,
      endereco:enderecos(*)
    `,
    { count: 'exact' }
  );

  // Aplicar filtros
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `nome.ilike.%${busca}%,nome_fantasia.ilike.%${busca}%,cpf.ilike.%${busca}%,cnpj.ilike.%${busca}%`
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

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'created_at';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Aplicar paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar terceiros com endereço e processos: ${error.message}`);
  }

  // Extrair IDs dos terceiros para buscar processos
  const terceiroIds = (data || []).map((row) => row.id as number);

  // Buscar processos relacionados para todos os terceiros de uma vez
  const processosMap: Map<number, ProcessoRelacionado[]> = new Map();
  
  if (terceiroIds.length > 0) {
    const { data: processosData, error: processosError } = await supabase
      .from('processo_partes')
      .select('entidade_id, processo_id, numero_processo, tipo_parte, polo')
      .eq('tipo_entidade', 'terceiro')
      .in('entidade_id', terceiroIds);

    if (!processosError && processosData) {
      // Agrupar processos por entidade_id
      for (const processo of processosData) {
        const entidadeId = processo.entidade_id as number;
        if (!processosMap.has(entidadeId)) {
          processosMap.set(entidadeId, []);
        }
        processosMap.get(entidadeId)!.push({
          processo_id: processo.processo_id as number,
          numero_processo: processo.numero_processo as string,
          tipo_parte: processo.tipo_parte as string,
          polo: processo.polo as string,
        });
      }
    }
  }

  const terceiros = (data || []).map((row) => {
    const terceiro = converterParaTerceiro(row);
    const endereco = row.endereco ? converterParaEndereco(row.endereco) : null;
    const processos_relacionados = processosMap.get(row.id as number) || [];
    return {
      ...terceiro,
      endereco,
      processos_relacionados,
    } as TerceiroComEnderecoEProcessos;
  });

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
