import { Cliente, ParteContraria, Terceiro } from "../../partes/domain";
import { Usuario } from "../../usuarios/domain";
import type { Representante } from "../../partes/types/representantes";
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarData,
  calcularIdade,
  formatarCep,
  formatarEnderecoCompleto,
} from "../../partes/utils/format";

// Interface para endereço
interface EnderecoData {
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  municipio?: string | null;
  estado?: string | null;
  estado_sigla?: string | null;
  cidade_uf?: string | null;
  cep?: string | null;
  cep_formatado?: string | null;
  [key: string]: unknown;
}

// Type guard para verificar se tem endereço
function hasEndereco(data: unknown): data is { endereco: EnderecoData | null | undefined } {
  return typeof data === 'object' && data !== null && 'endereco' in data;
}

// Helper to provide cidade/uf parts even if data source has it differently
const enrichAddress = <T>(data: T): T => {
  if (!hasEndereco(data) || !data.endereco) return data;

  const endereco: EnderecoData = { ...data.endereco };

  // Normalizar cidade/municipio (bidirecional)
  if (!endereco.cidade && endereco.municipio) {
    endereco.cidade = endereco.municipio;
  }
  if (!endereco.municipio && endereco.cidade) {
    endereco.municipio = endereco.cidade;
  }

  // Normalizar estado/estado_sigla (bidirecional)
  if (!endereco.estado && endereco.estado_sigla) {
    endereco.estado = endereco.estado_sigla;
  }
  if (!endereco.estado_sigla && endereco.estado) {
    endereco.estado_sigla = endereco.estado;
  }

  if (!endereco.cidade_uf && (endereco.cidade || endereco.municipio)) {
    endereco.cidade_uf = `${endereco.cidade || endereco.municipio}${
      endereco.estado || endereco.estado_sigla ? "/" + (endereco.estado || endereco.estado_sigla) : ""
    }`;
  }

  // Formatar CEP
  if (endereco.cep && !endereco.cep_formatado) {
    endereco.cep_formatado = formatarCep(endereco.cep);
  }

  return { ...data, endereco };
};

// Helper to normalize emails (JSONB can come as string or array)
const normalizeEmails = (value: unknown): string[] => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((v) => (typeof v === 'string' ? v.trim() : ''))
            .filter((v) => Boolean(v));
        }
      } catch {
        // fall through
      }
    }
    return [trimmed];
  }
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter((v) => Boolean(v));
  }
  return [];
};

/**
 * Adapta dados de Cliente para formato ProfileData
 *
 * @param cliente - Entidade Cliente (PF ou PJ discriminada)
 * @returns ProfileData com campos formatados e condicionais
 *
 * Formatações aplicadas:
 * - CPF/CNPJ: formatarCpf/formatarCnpj
 * - Telefones: formatarTelefone (com DDD)
 * - Endereço: formatarEnderecoCompleto (title case, estrutura padronizada)
 * - Emails: normalização de JSONB para array
 * - Idade: calcularIdade (apenas PF)
 * - Datas: formatarData (formato brasileiro)
 *
 * Campos PF: sexo, nome_genitora, data_nascimento, naturalidade, escolaridade, situacao_cpf,
 *            genero, estado_civil, nacionalidade, pais_nascimento_descricao
 * Campos PJ: data_abertura, ramo_atividade, porte, situacao_cnpj, cpf_responsavel, inscricao_estadual
 * Campos PJE: status_pje, situacao_pje, login_pje, autoridade
 * Campos comuns: nome, cpf_cnpj, telefones, emails, endereco, nome_social_fantasia, rg
 */
export const adaptClienteToProfile = (cliente: Cliente) => {
  const enriched = enrichAddress(cliente);
  const endereco = hasEndereco(enriched) ? enriched.endereco : null;
  const enrichedAny = enriched as unknown as Record<string, unknown>;

  const isPF = cliente.tipo_pessoa === 'pf';

  // Format document (CPF or CNPJ)
  const cpf_cnpj = isPF
    ? formatarCpf(enrichedAny.cpf as string | null)
    : formatarCnpj(enrichedAny.cnpj as string | null);

  // Format phones
  const celular_formatado = formatarTelefone(
    cliente.ddd_celular,
    cliente.numero_celular
  );
  const residencial_formatado = formatarTelefone(
    cliente.ddd_residencial,
    cliente.numero_residencial
  );
  const comercial_formatado = formatarTelefone(
    cliente.ddd_comercial,
    cliente.numero_comercial
  );

  // Normalize and format emails
  const emailsArray = normalizeEmails(cliente.emails);
  const emails_formatados = emailsArray.length > 0 ? emailsArray.join(', ') : null;

  // Calculate age (PF only)
  const idade = isPF && 'data_nascimento' in cliente && cliente.data_nascimento
    ? calcularIdade(cliente.data_nascimento)
    : null;
  const idade_formatada = idade !== null ? `${idade} anos` : null;

  // Type label
  const tipo_pessoa_label = isPF ? 'Pessoa Física' : 'Pessoa Jurídica';

  // Boolean labels
  const autoridade_label = cliente.autoridade === true ? 'Sim' : cliente.autoridade === false ? 'Não' : null;

  // PF specific fields
  let pfFields = {};
  if (isPF && 'data_nascimento' in cliente) {
    const clientePF = cliente as Extract<Cliente, { tipo_pessoa: 'pf' }>;
    pfFields = {
      // Formatted fields
      data_nascimento_formatada: formatarData(clientePF.data_nascimento),
      naturalidade_completa: clientePF.naturalidade_municipio && clientePF.naturalidade_estado_sigla
        ? `${clientePF.naturalidade_municipio}/${clientePF.naturalidade_estado_sigla}`
        : clientePF.naturalidade_municipio || null,
      pode_usar_celular_mensagem_label: clientePF.pode_usar_celular_mensagem === true
        ? 'Sim'
        : clientePF.pode_usar_celular_mensagem === false
          ? 'Não'
          : null,
      // Direct fields from ClientePessoaFisica
      sexo: clientePF.sexo,
      nome_genitora: clientePF.nome_genitora,
      escolaridade_codigo: clientePF.escolaridade_codigo,
      situacao_cpf_receita_descricao: clientePF.situacao_cpf_receita_descricao,
      pais_nascimento_descricao: clientePF.pais_nascimento_descricao,
      rg: clientePF.rg,
      genero: clientePF.genero,
      estado_civil: clientePF.estado_civil,
      nacionalidade: clientePF.nacionalidade,
    };
  }

  // PJ specific fields
  let pjFields = {};
  if (!isPF && 'data_abertura' in cliente) {
    const clientePJ = cliente as Extract<Cliente, { tipo_pessoa: 'pj' }>;
    pjFields = {
      // Formatted fields
      data_abertura_formatada: formatarData(clientePJ.data_abertura),
      data_fim_atividade_formatada: formatarData(clientePJ.data_fim_atividade),
      orgao_publico_label: clientePJ.orgao_publico === true
        ? 'Sim'
        : clientePJ.orgao_publico === false
          ? 'Não'
          : null,
      cpf_responsavel_formatado: formatarCpf(clientePJ.cpf_responsavel),
      // Direct fields from ClientePessoaJuridica
      ramo_atividade: clientePJ.ramo_atividade,
      porte_descricao: clientePJ.porte_descricao,
      situacao_cnpj_receita_descricao: clientePJ.situacao_cnpj_receita_descricao,
      inscricao_estadual: clientePJ.inscricao_estadual,
    };
  }

  return {
    ...enriched,
    // Formatted fields
    cpf_cnpj,
    celular_formatado,
    residencial_formatado,
    comercial_formatado,
    emails: emailsArray,
    emails_formatados,
    endereco_formatado: formatarEnderecoCompleto(endereco),
    idade,
    idade_formatada,
    tipo_pessoa_label,
    autoridade_label,

    // Common fields (from ClienteBase)
    nome_social_fantasia: cliente.nome_social_fantasia,

    // PJE fields (from ClienteBase - common for PF and PJ)
    status_pje: cliente.status_pje,
    situacao_pje: cliente.situacao_pje,
    login_pje: cliente.login_pje,

    // PF/PJ specific fields
    ...pfFields,
    ...pjFields,

    // Stats (preserve or initialize)
    stats: enrichedAny.stats || {
      total_processos: 0,
      processos_ativos: 0,
    },

    // Lists (preserve or initialize)
    processos: enrichedAny.processos || [],
    activities: enrichedAny.activities || [],
  };
};

export const adaptParteContrariaToProfile = (parte: ParteContraria) => {
  const enriched = enrichAddress(parte);
  const endereco = hasEndereco(enriched) ? enriched.endereco : null;
  const enrichedAny = enriched as unknown as Record<string, unknown>;

  const isPF = parte.tipo_pessoa === 'pf';

  const cpf_cnpj = isPF
    ? formatarCpf(enrichedAny.cpf as string | null)
    : formatarCnpj(enrichedAny.cnpj as string | null);

  const celular_formatado = formatarTelefone(parte.ddd_celular, parte.numero_celular);
  const residencial_formatado = formatarTelefone(parte.ddd_residencial, parte.numero_residencial);
  const comercial_formatado = formatarTelefone(parte.ddd_comercial, parte.numero_comercial);

  const emailsArray = normalizeEmails(parte.emails);
  const emails_formatados = emailsArray.length > 0 ? emailsArray.join(', ') : null;

  const tipo_pessoa_label = isPF ? 'Pessoa Física' : 'Pessoa Jurídica';
  const autoridade_label = parte.autoridade === true ? 'Sim' : parte.autoridade === false ? 'Não' : null;

  const idade = isPF && 'data_nascimento' in parte && parte.data_nascimento
    ? calcularIdade(parte.data_nascimento)
    : null;
  const idade_formatada = idade !== null ? `${idade} anos` : null;

  let pfFields = {};
  if (isPF && 'data_nascimento' in parte) {
    const partePF = parte as Extract<ParteContraria, { tipo_pessoa: 'pf' }>;
    pfFields = {
      data_nascimento_formatada: formatarData(partePF.data_nascimento),
      naturalidade_completa: partePF.naturalidade_municipio && partePF.naturalidade_estado_sigla
        ? `${partePF.naturalidade_municipio}/${partePF.naturalidade_estado_sigla}`
        : partePF.naturalidade_municipio || null,
    };
  }

  let pjFields = {};
  if (!isPF && 'data_abertura' in parte) {
    const partePJ = parte as Extract<ParteContraria, { tipo_pessoa: 'pj' }>;
    pjFields = {
      data_abertura_formatada: formatarData(partePJ.data_abertura),
      data_fim_atividade_formatada: formatarData(partePJ.data_fim_atividade),
      orgao_publico_label: partePJ.orgao_publico === true ? 'Sim' : partePJ.orgao_publico === false ? 'Não' : null,
    };
  }

  return {
    ...enriched,
    cpf_cnpj,
    celular_formatado,
    residencial_formatado,
    comercial_formatado,
    emails: emailsArray,
    emails_formatados,
    endereco_formatado: formatarEnderecoCompleto(endereco),
    idade,
    idade_formatada,
    tipo_pessoa_label,
    autoridade_label,
    ...pfFields,
    ...pjFields,
    stats: enrichedAny.stats || {
      total_processos: 0,
      processos_ativos: 0,
    },
    processos: enrichedAny.processos || [],
    activities: enrichedAny.activities || [],
  };
};

export const adaptTerceiroToProfile = (terceiro: Terceiro) => {
  const enriched = enrichAddress(terceiro);
  const enrichedAny = enriched as unknown as Record<string, unknown>;

  const isPF = terceiro.tipo_pessoa === 'pf';

  const cpf_cnpj = isPF
    ? formatarCpf(enrichedAny.cpf as string | null)
    : formatarCnpj(enrichedAny.cnpj as string | null);

  const celular_formatado = formatarTelefone(terceiro.ddd_celular, terceiro.numero_celular);
  const residencial_formatado = formatarTelefone(terceiro.ddd_residencial, terceiro.numero_residencial);
  const comercial_formatado = formatarTelefone(terceiro.ddd_comercial, terceiro.numero_comercial);

  const emailsArray = normalizeEmails(terceiro.emails);
  const emails_formatados = emailsArray.length > 0 ? emailsArray.join(', ') : null;

  const tipo_pessoa_label = isPF ? 'Pessoa Física' : 'Pessoa Jurídica';
  const autoridade_label = terceiro.autoridade === true ? 'Sim' : terceiro.autoridade === false ? 'Não' : null;

  return {
    ...enriched,
    tipo: enrichedAny.tipo_parte || "Terceiro",
    cpf_cnpj,
    celular_formatado,
    residencial_formatado,
    comercial_formatado,
    emails: emailsArray,
    emails_formatados,
    tipo_pessoa_label,
    autoridade_label,
    stats: enrichedAny.stats || {
      total_participacoes: 0,
    },
    processos: enrichedAny.processos || [],
    activities: enrichedAny.activities || [],
  };
};

export const adaptRepresentanteToProfile = (rep: Representante) => {
  const enriched = enrichAddress(rep);
  // Try to find OAB principal or fallback to first
  const oabs = (enriched as { oabs?: Array<{ numero: string; uf: string; situacao?: string }> }).oabs;
  const oabPrincipal = oabs?.[0];
  const oabStr = oabPrincipal
    ? `${oabPrincipal.numero}/${oabPrincipal.uf}`
    : "";

  const oabsFormatadas = oabs
    ?.map((i) => `${i.numero}/${i.uf}${i.situacao ? ` (${i.situacao})` : ''}`)
    .join(", ");

  return {
    ...enriched,
    oab_principal: oabStr,
    oabs_formatadas: oabsFormatadas,
    stats: (enriched as { stats?: unknown }).stats || {
      total_processos: 0,
      total_clientes: 0,
    },
    processos: (enriched as { processos?: unknown[] }).processos || [],
    clientes: (enriched as { clientes?: unknown[] }).clientes || [],
    activities: (enriched as { activities?: unknown[] }).activities || [],
  };
};

export const adaptUsuarioToProfile = (usuario: Usuario) => {
  return {
    ...usuario,
    // Add computed fields
    stats: {
      total_processos: 0,
      total_audiencias: 0,
    },
    processos: [],
    activities: [],
    is_super_admin: String(usuario.isSuperAdmin),
  };
};
