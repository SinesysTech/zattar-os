/**
 * Tipos frontend para Terceiros (Peritos, MP, etc.)
 * Re-exporta tipos do backend e adiciona utilitários para uso em componentes React
 */

// Re-exporta todos os tipos de terceiros do backend
export type {
  TipoPessoa,
  Terceiro,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  CriarTerceiroParams,
  AtualizarTerceiroParams,
  ListarTerceirosParams,
  ListarTerceirosResult,
  UpsertTerceiroPorCPFParams,
  UpsertTerceiroPorCNPJParams,
  UpsertTerceiroPorDocumentoParams,
  UpsertTerceiroPorIdPessoaParams,
  OrdenarPorTerceiro,
  OrdemTerceiro,
} from '@/backend/types/partes/terceiros-types';

// Tipos auxiliares para formulários
export interface TerceiroFormData {
  // Campos obrigatórios
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  processo_id: number;
  trt: string;
  grau: '1' | '2';
  numero_processo: string;
  tipo_parte: string;

  // PF: CPF obrigatório
  cpf?: string;

  // PJ: CNPJ obrigatório
  cnpj?: string;

  // Campos opcionais comuns
  id_pje?: number;
  id_pessoa_pje?: number;
  id_tipo_parte?: number;
  polo?: 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO';
  nome_social?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_telefone?: string;
  numero_telefone?: string;
  fax?: string;
  situacao?: 'A' | 'I' | 'E' | 'H';
  observacoes?: string;
  dados_pje_completo?: Record<string, unknown>;

  // Campos PF
  tipo_documento?: string;
  numero_rg?: string;
  orgao_emissor_rg?: string;
  uf_rg?: string;
  data_nascimento?: string;
  sexo?: string;
  nacionalidade?: string;
  estado_civil?: string;
  profissao?: string;
  nome_mae?: string;
  nome_pai?: string;
  pis_pasep?: string;

  // Campos PJ
  tipo_empresa?: string;
  razao_social?: string;
  nome_fantasia?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  cnae_principal?: string;
  data_constituicao?: string;
  capital_social?: number;
}

/**
 * Valida se um terceiro é Pessoa Física
 */
export function isTerceiroPessoaFisica(terceiro: { tipo_pessoa: string }): boolean {
  return terceiro.tipo_pessoa === 'pf';
}

/**
 * Valida se um terceiro é Pessoa Jurídica
 */
export function isTerceiroPessoaJuridica(terceiro: { tipo_pessoa: string }): boolean {
  return terceiro.tipo_pessoa === 'pj';
}

/**
 * Formata CPF para exibição
 */
export function formatarCpf(cpf: string | null | undefined): string {
  if (!cpf) return '';
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return cpf;
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ para exibição
 */
export function formatarCnpj(cnpj: string | null | undefined): string {
  if (!cnpj) return '';
  const numeros = cnpj.replace(/\D/g, '');
  if (numeros.length !== 14) return cnpj;
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata documento (CPF ou CNPJ) automaticamente
 */
export function formatarDocumento(documento: string | null | undefined): string {
  if (!documento) return '';
  const numeros = documento.replace(/\D/g, '');
  if (numeros.length === 11) return formatarCpf(documento);
  if (numeros.length === 14) return formatarCnpj(documento);
  return documento;
}

/**
 * Formata telefone para exibição
 */
export function formatarTelefone(ddd: string | null | undefined, numero: string | null | undefined): string {
  if (!ddd || !numero) return '';
  return `(${ddd}) ${numero}`;
}

/**
 * Retorna label de situação
 */
export function getSituacaoLabel(situacao: 'A' | 'I' | 'E' | 'H' | null | undefined): string {
  if (!situacao) return 'Desconhecido';
  const labels = {
    A: 'Ativo',
    I: 'Inativo',
    E: 'Excluído',
    H: 'Histórico',
  };
  return labels[situacao] || 'Desconhecido';
}

/**
 * Retorna cor da badge de situação
 */
export function getSituacaoColor(situacao: 'A' | 'I' | 'E' | 'H' | null | undefined): string {
  if (!situacao) return 'default';
  const colors = {
    A: 'green',
    I: 'yellow',
    E: 'red',
    H: 'gray',
  };
  return colors[situacao] || 'default';
}

/**
 * Retorna label do tipo de parte (perito, MP, etc.)
 */
export function getTipoParteLabel(tipoParte: string): string {
  const labels: Record<string, string> = {
    PERITO: 'Perito',
    PERITO_CONTADOR: 'Perito Contador',
    PERITO_MEDICO: 'Perito Médico',
    MINISTERIO_PUBLICO: 'Ministério Público',
    MINISTERIO_PUBLICO_TRABALHO: 'Ministério Público do Trabalho',
    ASSISTENTE: 'Assistente',
    ASSISTENTE_TECNICO: 'Assistente Técnico',
    TESTEMUNHA: 'Testemunha',
    CUSTOS_LEGIS: 'Custos Legis',
    AMICUS_CURIAE: 'Amicus Curiae',
    PREPOSTO: 'Preposto',
    CURADOR: 'Curador',
    CURADOR_ESPECIAL: 'Curador Especial',
    INVENTARIANTE: 'Inventariante',
    ADMINISTRADOR: 'Administrador',
    SINDICO: 'Síndico',
    DEPOSITARIO: 'Depositário',
    LEILOEIRO: 'Leiloeiro',
    LEILOEIRO_OFICIAL: 'Leiloeiro Oficial',
    OUTRO: 'Outro',
  };
  return labels[tipoParte] || tipoParte;
}

/**
 * Retorna cor da badge do tipo de parte
 */
export function getTipoParteColor(tipoParte: string): string {
  const colors: Record<string, string> = {
    PERITO: 'blue',
    PERITO_CONTADOR: 'blue',
    PERITO_MEDICO: 'blue',
    MINISTERIO_PUBLICO: 'purple',
    MINISTERIO_PUBLICO_TRABALHO: 'purple',
    ASSISTENTE: 'cyan',
    ASSISTENTE_TECNICO: 'cyan',
    TESTEMUNHA: 'green',
    CUSTOS_LEGIS: 'purple',
    AMICUS_CURIAE: 'indigo',
    PREPOSTO: 'orange',
    CURADOR: 'yellow',
    CURADOR_ESPECIAL: 'yellow',
    INVENTARIANTE: 'pink',
    ADMINISTRADOR: 'violet',
    SINDICO: 'fuchsia',
    DEPOSITARIO: 'lime',
    LEILOEIRO: 'amber',
    LEILOEIRO_OFICIAL: 'amber',
    OUTRO: 'gray',
  };
  return colors[tipoParte] || 'default';
}

/**
 * Retorna label do polo processual
 */
export function getPoloLabel(polo: 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO' | null | undefined): string {
  if (!polo) return 'Não definido';
  const labels = {
    ATIVO: 'Polo Ativo',
    PASSIVO: 'Polo Passivo',
    NEUTRO: 'Polo Neutro',
    TERCEIRO: 'Terceiro',
  };
  return labels[polo] || polo;
}

/**
 * Retorna cor da badge do polo
 */
export function getPoloColor(polo: 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO' | null | undefined): string {
  if (!polo) return 'default';
  const colors = {
    ATIVO: 'blue',
    PASSIVO: 'red',
    NEUTRO: 'gray',
    TERCEIRO: 'purple',
  };
  return colors[polo] || 'default';
}

/**
 * Retorna label do grau
 */
export function getGrauLabel(grau: '1' | '2' | string): string {
  return grau === '1' ? 'Primeiro Grau' : 'Segundo Grau';
}

/**
 * Retorna label do TRT
 */
export function getTrtLabel(trt: string): string {
  return `TRT${trt}`;
}

/**
 * Retorna nome de exibição (nome social se existir, senão nome)
 */
export function getNomeExibicao(terceiro: {
  nome: string;
  nome_social?: string | null;
}): string {
  return terceiro.nome_social || terceiro.nome;
}

/**
 * Valida CPF (com dígito verificador)
 */
export function validarCpf(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito = resto >= 10 ? 0 : resto;
  if (digito !== parseInt(numeros.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  digito = resto >= 10 ? 0 : resto;
  if (digito !== parseInt(numeros.charAt(10))) return false;

  return true;
}

/**
 * Valida CNPJ (com dígito verificador)
 */
export function validarCnpj(cnpj: string): boolean {
  const numeros = cnpj.replace(/\D/g, '');
  if (numeros.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numeros)) return false;

  const tamanho = numeros.length - 2;
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(numeros.charAt(tamanho))) return false;

  soma = 0;
  pos = tamanho - 6;
  for (let i = tamanho + 1; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho + 1 - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(numeros.charAt(tamanho + 1))) return false;

  return true;
}
