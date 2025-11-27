// Utilitários para formatação de dados de clientes

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 */
export const formatarCpf = (cpf: string | null | undefined): string => {
  if (!cpf) return '-';
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ para exibição (XX.XXX.XXX/XXXX-XX)
 */
export const formatarCnpj = (cnpj: string | null | undefined): string => {
  if (!cnpj) return '-';
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) return cnpj;
  return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata telefone para exibição
 * Aceita telefone completo ou DDD + número separados
 */
export function formatarTelefone(telefone: string | null | undefined): string;
export function formatarTelefone(ddd: string | null | undefined, numero: string | null | undefined): string;
export function formatarTelefone(dddOrTelefone: string | null | undefined, numero?: string | null | undefined): string {
  // Se passado DDD e número separados
  if (numero !== undefined) {
    if (!dddOrTelefone || !numero) return '-';
    const dddLimpo = dddOrTelefone.replace(/\D/g, '');
    const numeroLimpo = numero.replace(/\D/g, '');
    
    if (numeroLimpo.length === 9) {
      // Celular: (XX) XXXXX-XXXX
      return `(${dddLimpo}) ${numeroLimpo.replace(/(\d{5})(\d{4})/, '$1-$2')}`;
    } else if (numeroLimpo.length === 8) {
      // Fixo: (XX) XXXX-XXXX
      return `(${dddLimpo}) ${numeroLimpo.replace(/(\d{4})(\d{4})/, '$1-$2')}`;
    }
    
    return `(${dddLimpo}) ${numeroLimpo}`;
  }
  
  // Se passado telefone completo
  if (!dddOrTelefone) return '-';
  const telefoneLimpo = dddOrTelefone.replace(/\D/g, '');
  
  if (telefoneLimpo.length === 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (telefoneLimpo.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return dddOrTelefone;
}

/**
 * Formata CEP para exibição (XXXXX-XXX)
 */
export const formatarCep = (cep: string | null | undefined): string => {
  if (!cep) return '-';
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return cep;
  return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
};

/**
 * Formata endereço completo para exibição
 */
export const formatarEnderecoCompleto = (endereco: {
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
  cep?: string | null;
} | null | undefined): string => {
  if (!endereco) return '-';

  const partes: string[] = [];

  if (endereco.logradouro) {
    let logradouroCompleto = endereco.logradouro;
    if (endereco.numero) {
      logradouroCompleto += `, ${endereco.numero}`;
    }
    if (endereco.complemento) {
      logradouroCompleto += ` - ${endereco.complemento}`;
    }
    partes.push(logradouroCompleto);
  }

  if (endereco.bairro) {
    partes.push(endereco.bairro);
  }

  if (endereco.municipio && endereco.estado_sigla) {
    partes.push(`${endereco.municipio} - ${endereco.estado_sigla}`);
  } else if (endereco.municipio) {
    partes.push(endereco.municipio);
  }

  if (endereco.cep) {
    partes.push(`CEP: ${formatarCep(endereco.cep)}`);
  }

  return partes.length > 0 ? partes.join(', ') : '-';
};

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 */
export const formatarData = (dataISO: string | null | undefined): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Formata nome completo ou razão social
 */
export const formatarNome = (nome: string | null | undefined): string => {
  return nome || '-';
};

/**
 * Formata tipo de pessoa para exibição
 */
export const formatarTipoPessoa = (tipoPessoa: 'pf' | 'pj'): string => {
  return tipoPessoa === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica';
};

