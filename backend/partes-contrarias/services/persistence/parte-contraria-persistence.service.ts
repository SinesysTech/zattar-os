// Serviço de persistência de partes contrárias
// Gerencia operações de CRUD na tabela partes_contrarias (60 campos com discriminated union PF/PJ)

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  ParteContraria,
  ParteContrariaComEndereco,
  CriarParteContrariaParams,
  AtualizarParteContrariaParams,
  ListarPartesContrariasParams,
  ListarPartesContrariasResult,
  UpsertParteContrariaPorIdPessoaParams,
} from '@/backend/types/partes/partes-contrarias-types';
import { converterParaEndereco } from '@/backend/enderecos/services/enderecos-persistence.service';

/**
 * Resultado de operação
 */
export interface OperacaoParteContrariaResult {
  sucesso: boolean;
  parteContraria?: ParteContraria;
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
function converterParaParteContraria(data: Record<string, unknown>): ParteContraria {
  const tipo_pessoa = data.tipo_pessoa as 'pf' | 'pj';

  const base = {
    id: data.id as number,
    // id_pje removido
    id_pessoa_pje: (data.id_pessoa_pje as number | null) ?? null,
    tipo_pessoa,
    nome: data.nome as string,
    nome_social_fantasia: (data.nome_social_fantasia as string | null) ?? null,
    emails: (data.emails as string[] | null) ?? null,
    ddd_celular: (data.ddd_celular as string | null) ?? null,
    numero_celular: (data.numero_celular as string | null) ?? null,
    ddd_residencial: (data.ddd_residencial as string | null) ?? null,
    numero_residencial: (data.numero_residencial as string | null) ?? null,
    ddd_comercial: (data.ddd_comercial as string | null) ?? null,
    numero_comercial: (data.numero_comercial as string | null) ?? null,
    tipo_documento: (data.tipo_documento as string | null) ?? null,
    status_pje: (data.status_pje as string | null) ?? null,
    situacao_pje: (data.situacao_pje as string | null) ?? null,
    login_pje: (data.login_pje as string | null) ?? null,
    autoridade: (data.autoridade as boolean | null) ?? null,
    observacoes: (data.observacoes as string | null) ?? null,
    dados_anteriores: (data.dados_anteriores as Record<string, unknown> | null) ?? null,
    endereco_id: (data.endereco_id as number | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };

  if (tipo_pessoa === 'pf') {
    return {
      ...base,
      tipo_pessoa: 'pf',
      cpf: data.cpf as string,
      cnpj: null,
      rg: (data.rg as string | null) ?? null,
      data_nascimento: (data.data_nascimento as string | null) ?? null,
      genero: (data.genero as string | null) ?? null,
      estado_civil: (data.estado_civil as string | null) ?? null,
      nacionalidade: (data.nacionalidade as string | null) ?? null,
      sexo: (data.sexo as string | null) ?? null,
      nome_genitora: (data.nome_genitora as string | null) ?? null,
      // Naturalidade (estrutura completa do PJE)
      naturalidade_id_pje: (data.naturalidade_id_pje as number | null) ?? null,
      naturalidade_municipio: (data.naturalidade_municipio as string | null) ?? null,
      naturalidade_estado_id_pje: (data.naturalidade_estado_id_pje as number | null) ?? null,
      naturalidade_estado_sigla: (data.naturalidade_estado_sigla as string | null) ?? null,
      // UF Nascimento (estrutura completa do PJE)
      uf_nascimento_id_pje: (data.uf_nascimento_id_pje as number | null) ?? null,
      uf_nascimento_sigla: (data.uf_nascimento_sigla as string | null) ?? null,
      uf_nascimento_descricao: (data.uf_nascimento_descricao as string | null) ?? null,
      // País Nascimento (estrutura completa do PJE)
      pais_nascimento_id_pje: (data.pais_nascimento_id_pje as number | null) ?? null,
      pais_nascimento_codigo: (data.pais_nascimento_codigo as string | null) ?? null,
      pais_nascimento_descricao: (data.pais_nascimento_descricao as string | null) ?? null,
      // Escolaridade
      escolaridade_codigo: (data.escolaridade_codigo as number | null) ?? null,
      // Situação CPF Receita
      situacao_cpf_receita_id: (data.situacao_cpf_receita_id as number | null) ?? null,
      situacao_cpf_receita_descricao: (data.situacao_cpf_receita_descricao as string | null) ?? null,
      pode_usar_celular_mensagem: (data.pode_usar_celular_mensagem as boolean | null) ?? null,
      // Campos que são null em PF (específicos de PJ)
      inscricao_estadual: null,
      data_abertura: null,
      data_fim_atividade: null,
      orgao_publico: null,
      tipo_pessoa_codigo_pje: null,
      tipo_pessoa_label_pje: null,
      tipo_pessoa_validacao_receita: null,
      ds_tipo_pessoa: null,
      situacao_cnpj_receita_id: null,
      situacao_cnpj_receita_descricao: null,
      ramo_atividade: null,
      cpf_responsavel: null,
      oficial: null,
      ds_prazo_expediente_automatico: null,
      porte_codigo: null,
      porte_descricao: null,
      ultima_atualizacao_pje: null,
    };
  } else {
    return {
      ...base,
      tipo_pessoa: 'pj',
      cnpj: data.cnpj as string,
      cpf: null,
      inscricao_estadual: (data.inscricao_estadual as string | null) ?? null,
      data_abertura: (data.data_abertura as string | null) ?? null,
      data_fim_atividade: (data.data_fim_atividade as string | null) ?? null,
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
      ultima_atualizacao_pje: (data.ultima_atualizacao_pje as string | null) ?? null,
      // Campos que são null em PJ (específicos de PF)
      rg: null,
      data_nascimento: null,
      genero: null,
      estado_civil: null,
      nacionalidade: null,
      sexo: null,
      nome_genitora: null,
      naturalidade_id_pje: null,
      naturalidade_municipio: null,
      naturalidade_estado_id_pje: null,
      naturalidade_estado_sigla: null,
      uf_nascimento_id_pje: null,
      uf_nascimento_sigla: null,
      uf_nascimento_descricao: null,
      pais_nascimento_id_pje: null,
      pais_nascimento_codigo: null,
      pais_nascimento_descricao: null,
      escolaridade_codigo: null,
      situacao_cpf_receita_id: null,
      situacao_cpf_receita_descricao: null,
      pode_usar_celular_mensagem: null,
    };
  }
}

/**
 * Cria uma nova parte contrária no sistema
 */
export async function criarParteContraria(
  params: CriarParteContrariaParams
): Promise<OperacaoParteContrariaResult> {
  const supabase = createServiceClient();

  try {
    // Validações obrigatórias
    if (!params.tipo_pessoa) {
      return { sucesso: false, erro: 'Tipo de pessoa é obrigatório' };
    }

    if (!params.nome?.trim()) {
      return { sucesso: false, erro: 'Nome é obrigatório' };
    }

    // Validações específicas por tipo de pessoa
    if (params.tipo_pessoa === 'pf') {
      if (!params.cpf?.trim()) {
        return { sucesso: false, erro: 'CPF é obrigatório para pessoa física' };
      }

      if (!validarCpf(params.cpf)) {
        return { sucesso: false, erro: 'CPF inválido (deve conter 11 dígitos)' };
      }

      const cpfNormalizado = normalizarCpf(params.cpf);
      const { data: existente } = await supabase
        .from('partes_contrarias')
        .select('id, cpf')
        .eq('cpf', cpfNormalizado)
        .maybeSingle();

      if (existente) {
        return {
          sucesso: false,
          erro: 'Parte contrária com este CPF já existe',
        };
      }
    } else if (params.tipo_pessoa === 'pj') {
      if (!params.cnpj?.trim()) {
        return { sucesso: false, erro: 'CNPJ é obrigatório para pessoa jurídica' };
      }

      if (!validarCnpj(params.cnpj)) {
        return { sucesso: false, erro: 'CNPJ inválido (deve conter 14 dígitos)' };
      }

      const cnpjNormalizado = normalizarCnpj(params.cnpj);
      const { data: existente } = await supabase
        .from('partes_contrarias')
        .select('id, cnpj')
        .eq('cnpj', cnpjNormalizado)
        .maybeSingle();

      if (existente) {
        return {
          sucesso: false,
          erro: 'Parte contrária com este CNPJ já existe',
        };
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
      // id_pje removido
      id_pessoa_pje: params.id_pessoa_pje ?? null,
      tipo_pessoa: params.tipo_pessoa,
      nome: params.nome.trim(),
      nome_social_fantasia: params.nome_social_fantasia?.trim() || null,
      emails: params.emails ?? null,
      ddd_celular: params.ddd_celular?.trim() || null,
      numero_celular: params.numero_celular?.trim() || null,
      ddd_residencial: params.ddd_residencial?.trim() || null,
      numero_residencial: params.numero_residencial?.trim() || null,
      ddd_comercial: params.ddd_comercial?.trim() || null,
      numero_comercial: params.numero_comercial?.trim() || null,
      tipo_documento: params.tipo_documento?.trim() || null,
      status_pje: params.status_pje?.trim() || null,
      situacao_pje: params.situacao_pje?.trim() || null,
      login_pje: params.login_pje?.trim() || null,
      autoridade: params.autoridade ?? null,
      observacoes: params.observacoes?.trim() || null,
      dados_anteriores: params.dados_anteriores ?? null,
      endereco_id: params.endereco_id ?? null,
    };

    if (params.tipo_pessoa === 'pf') {
      dadosNovos.cpf = normalizarCpf(params.cpf);
      dadosNovos.rg = params.rg?.trim() || null;
      dadosNovos.data_nascimento = params.data_nascimento || null;
      dadosNovos.genero = params.genero?.trim() || null;
      dadosNovos.estado_civil = params.estado_civil?.trim() || null;
      dadosNovos.nacionalidade = params.nacionalidade?.trim() || null;
      dadosNovos.sexo = params.sexo?.trim() || null;
      dadosNovos.nome_genitora = params.nome_genitora?.trim() || null;
      // Naturalidade (estrutura completa do PJE)
      dadosNovos.naturalidade_id_pje = params.naturalidade_id_pje ?? null;
      dadosNovos.naturalidade_municipio = params.naturalidade_municipio?.trim() || null;
      dadosNovos.naturalidade_estado_id_pje = params.naturalidade_estado_id_pje ?? null;
      dadosNovos.naturalidade_estado_sigla = params.naturalidade_estado_sigla?.trim() || null;
      // UF Nascimento (estrutura completa do PJE)
      dadosNovos.uf_nascimento_id_pje = params.uf_nascimento_id_pje ?? null;
      dadosNovos.uf_nascimento_sigla = params.uf_nascimento_sigla?.trim() || null;
      dadosNovos.uf_nascimento_descricao = params.uf_nascimento_descricao?.trim() || null;
      // País Nascimento (estrutura completa do PJE)
      dadosNovos.pais_nascimento_id_pje = params.pais_nascimento_id_pje ?? null;
      dadosNovos.pais_nascimento_codigo = params.pais_nascimento_codigo?.trim() || null;
      dadosNovos.pais_nascimento_descricao = params.pais_nascimento_descricao?.trim() || null;
      // Escolaridade
      dadosNovos.escolaridade_codigo = params.escolaridade_codigo ?? null;
      // Situação CPF Receita
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
      dadosNovos.porte_codigo = params.porte_codigo ?? null; // É number, não string
      dadosNovos.porte_descricao = params.porte_descricao?.trim() || null;
      dadosNovos.ultima_atualizacao_pje = params.ultima_atualizacao_pje?.trim() || null;
    }

    // Inserir parte contrária
    const { data, error } = await supabase
      .from('partes_contrarias')
      .insert(dadosNovos)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar parte contrária:', error);
      return { sucesso: false, erro: `Erro ao criar parte contrária: ${error.message}` };
    }

    return {
      sucesso: true,
      parteContraria: converterParaParteContraria(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar parte contrária:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Atualiza uma parte contrária existente
 */
export async function atualizarParteContraria(
  params: AtualizarParteContrariaParams
): Promise<OperacaoParteContrariaResult> {
  const supabase = createServiceClient();

  try {
    const { data: existente, error: erroBusca } = await supabase
      .from('partes_contrarias')
      .select('id, tipo_pessoa')
      .eq('id', params.id)
      .single();

    if (erroBusca || !existente) {
      return { sucesso: false, erro: 'Parte contrária não encontrada' };
    }

    const tipoPessoaAtual = existente.tipo_pessoa as 'pf' | 'pj';

    if (params.tipo_pessoa && params.tipo_pessoa !== tipoPessoaAtual) {
      return { sucesso: false, erro: 'Não é permitido alterar o tipo de pessoa' };
    }

    // Preparar dados para atualização (apenas campos fornecidos)
    const dadosAtualizacao: Record<string, unknown> = {};

    // if (params.id_pje !== undefined) dadosAtualizacao.id_pje = params.id_pje; // Removido
    if (params.id_pessoa_pje !== undefined) dadosAtualizacao.id_pessoa_pje = params.id_pessoa_pje;
    if (params.nome !== undefined) dadosAtualizacao.nome = params.nome.trim();
    if (params.nome_social_fantasia !== undefined)
      dadosAtualizacao.nome_social_fantasia = params.nome_social_fantasia?.trim() || null;
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
    if (params.tipo_documento !== undefined)
      dadosAtualizacao.tipo_documento = params.tipo_documento?.trim() || null;
    if (params.status_pje !== undefined)
      dadosAtualizacao.status_pje = params.status_pje?.trim() || null;
    if (params.situacao_pje !== undefined)
      dadosAtualizacao.situacao_pje = params.situacao_pje?.trim() || null;
    if (params.login_pje !== undefined)
      dadosAtualizacao.login_pje = params.login_pje?.trim() || null;
    if (params.autoridade !== undefined) dadosAtualizacao.autoridade = params.autoridade;
    if (params.observacoes !== undefined)
      dadosAtualizacao.observacoes = params.observacoes?.trim() || null;
    if (params.dados_anteriores !== undefined)
      dadosAtualizacao.dados_anteriores = params.dados_anteriores;
    if (params.endereco_id !== undefined) dadosAtualizacao.endereco_id = params.endereco_id;

    // Campos específicos por tipo de pessoa
    if (tipoPessoaAtual === 'pf' && params.tipo_pessoa === 'pf') {
      if (params.cpf !== undefined) dadosAtualizacao.cpf = normalizarCpf(params.cpf);
      if (params.rg !== undefined) dadosAtualizacao.rg = params.rg?.trim() || null;
      if (params.data_nascimento !== undefined)
        dadosAtualizacao.data_nascimento = params.data_nascimento;
      if (params.genero !== undefined) dadosAtualizacao.genero = params.genero?.trim() || null;
      if (params.estado_civil !== undefined)
        dadosAtualizacao.estado_civil = params.estado_civil?.trim() || null;
      if (params.nacionalidade !== undefined)
        dadosAtualizacao.nacionalidade = params.nacionalidade?.trim() || null;
      if (params.sexo !== undefined) dadosAtualizacao.sexo = params.sexo?.trim() || null;
      if (params.nome_genitora !== undefined)
        dadosAtualizacao.nome_genitora = params.nome_genitora?.trim() || null;
      // Naturalidade (estrutura completa do PJE)
      if (params.naturalidade_id_pje !== undefined)
        dadosAtualizacao.naturalidade_id_pje = params.naturalidade_id_pje;
      if (params.naturalidade_municipio !== undefined)
        dadosAtualizacao.naturalidade_municipio = params.naturalidade_municipio?.trim() || null;
      if (params.naturalidade_estado_id_pje !== undefined)
        dadosAtualizacao.naturalidade_estado_id_pje = params.naturalidade_estado_id_pje;
      if (params.naturalidade_estado_sigla !== undefined)
        dadosAtualizacao.naturalidade_estado_sigla = params.naturalidade_estado_sigla?.trim() || null;
      // UF Nascimento (estrutura completa do PJE)
      if (params.uf_nascimento_id_pje !== undefined)
        dadosAtualizacao.uf_nascimento_id_pje = params.uf_nascimento_id_pje;
      if (params.uf_nascimento_sigla !== undefined)
        dadosAtualizacao.uf_nascimento_sigla = params.uf_nascimento_sigla?.trim() || null;
      if (params.uf_nascimento_descricao !== undefined)
        dadosAtualizacao.uf_nascimento_descricao = params.uf_nascimento_descricao?.trim() || null;
      // País Nascimento (estrutura completa do PJE)
      if (params.pais_nascimento_id_pje !== undefined)
        dadosAtualizacao.pais_nascimento_id_pje = params.pais_nascimento_id_pje;
      if (params.pais_nascimento_codigo !== undefined)
        dadosAtualizacao.pais_nascimento_codigo = params.pais_nascimento_codigo?.trim() || null;
      if (params.pais_nascimento_descricao !== undefined)
        dadosAtualizacao.pais_nascimento_descricao = params.pais_nascimento_descricao?.trim() || null;
      // Escolaridade
      if (params.escolaridade_codigo !== undefined)
        dadosAtualizacao.escolaridade_codigo = params.escolaridade_codigo;
      // Situação CPF Receita
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
      if (params.porte_codigo !== undefined)
        dadosAtualizacao.porte_codigo = params.porte_codigo; // É number, não string
      if (params.porte_descricao !== undefined)
        dadosAtualizacao.porte_descricao = params.porte_descricao?.trim() || null;
      if (params.ultima_atualizacao_pje !== undefined)
        dadosAtualizacao.ultima_atualizacao_pje = params.ultima_atualizacao_pje?.trim() || null;
    }

    const { data, error } = await supabase
      .from('partes_contrarias')
      .update(dadosAtualizacao)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar parte contrária:', error);
      return { sucesso: false, erro: `Erro ao atualizar: ${error.message}` };
    }

    return {
      sucesso: true,
      parteContraria: converterParaParteContraria(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao atualizar parte contrária:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Busca uma parte contrária por ID
 */
export async function buscarParteContrariaPorId(id: number): Promise<ParteContraria | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('partes_contrarias')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar parte contrária: ${error.message}`);
  }

  return data ? converterParaParteContraria(data) : null;
}

/**
 * Busca uma parte contrária por id_pessoa_pje
 */
export async function buscarParteContrariaPorIdPessoaPje(
  id_pessoa_pje: number
): Promise<ParteContraria | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('partes_contrarias')
    .select('*')
    .eq('id_pessoa_pje', id_pessoa_pje)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar por id_pessoa_pje: ${error.message}`);
  }

  return data ? converterParaParteContraria(data) : null;
}

/**
 * Busca uma parte contrária por CPF
 */
export async function buscarParteContrariaPorCpf(cpf: string): Promise<ParteContraria | null> {
  const cpfNormalizado = normalizarCpf(cpf);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('partes_contrarias')
    .select('*')
    .eq('cpf', cpfNormalizado)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar parte contrária por CPF: ${error.message}`);
  }

  return data ? converterParaParteContraria(data) : null;
}

/**
 * Busca uma parte contrária por CNPJ
 */
export async function buscarParteContrariaPorCnpj(cnpj: string): Promise<ParteContraria | null> {
  const cnpjNormalizado = normalizarCnpj(cnpj);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('partes_contrarias')
    .select('*')
    .eq('cnpj', cnpjNormalizado)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar parte contrária por CNPJ: ${error.message}`);
  }

  return data ? converterParaParteContraria(data) : null;
}

/**
 * Lista partes contrárias com filtros e paginação
 */
export async function listarPartesContrarias(
  params: ListarPartesContrariasParams = {}
): Promise<ListarPartesContrariasResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from('partes_contrarias').select('*', { count: 'exact' });

  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `nome.ilike.%${busca}%,nome_social_fantasia.ilike.%${busca}%,cpf.ilike.%${busca}%,cnpj.ilike.%${busca}%`
    );
  }

  if (params.tipo_pessoa) {
    query = query.eq('tipo_pessoa', params.tipo_pessoa);
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
    throw new Error(`Erro ao listar partes contrárias: ${error.message}`);
  }

  const partesContrarias = (data || []).map(converterParaParteContraria);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    partesContrarias,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

/**
 * Upsert por id_pessoa_pje (cria se não existir, atualiza se existir)
 */
export async function upsertParteContrariaPorIdPessoa(
  params: UpsertParteContrariaPorIdPessoaParams
): Promise<OperacaoParteContrariaResult> {
  try {
    const existente = await buscarParteContrariaPorIdPessoaPje(params.id_pessoa_pje);

    if (existente) {
      return await atualizarParteContraria({
        ...params,
        id: existente.id,
      } as unknown as AtualizarParteContrariaParams);
    } else {
      return await criarParteContraria(params);
    }
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao fazer upsert:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Deleta uma parte contrária por ID
 */
export async function deletarParteContraria(
  id: number
): Promise<OperacaoParteContrariaResult> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase.from('partes_contrarias').delete().eq('id', id);

    if (error) {
      console.error('Erro ao deletar parte contrária:', error);
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
 * Busca uma parte contrária por ID com endereço populado via LEFT JOIN
 */
export async function buscarParteContrariaComEndereco(
  id: number
): Promise<ParteContrariaComEndereco | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('partes_contrarias')
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
    throw new Error(`Erro ao buscar parte contrária com endereço: ${error.message}`);
  }

  if (!data) return null;

  const parteContraria = converterParaParteContraria(data);
  const endereco = data.endereco ? converterParaEndereco(data.endereco) : null;

  return {
    ...parteContraria,
    endereco,
  } as ParteContrariaComEndereco;
}

/**
 * Lista partes contrárias com endereços populados via LEFT JOIN
 */
export async function listarPartesContrariasComEndereco(
  params: ListarPartesContrariasParams = {}
): Promise<ListarPartesContrariasResult & { partesContrarias: ParteContrariaComEndereco[] }> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from('partes_contrarias').select(
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
      `nome.ilike.%${busca}%,nome_social_fantasia.ilike.%${busca}%,cpf.ilike.%${busca}%,cnpj.ilike.%${busca}%`
    );
  }

  if (params.tipo_pessoa) {
    query = query.eq('tipo_pessoa', params.tipo_pessoa);
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

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'created_at';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Aplicar paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar partes contrárias com endereço: ${error.message}`);
  }

  const partesContrarias = (data || []).map((row) => {
    const parteContraria = converterParaParteContraria(row);
    const endereco = row.endereco ? converterParaEndereco(row.endereco) : null;
    return {
      ...parteContraria,
      endereco,
    } as ParteContrariaComEndereco;
  });

  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    partesContrarias,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}
