// Utilitários de formatação para usuários

/**
 * Formata CPF (000.000.000-00)
 */
export function formatarCpf(cpf: string | null | undefined): string {
  if (!cpf) return '-';
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata telefone ((00) 00000-0000 ou (00) 0000-0000)
 */
export function formatarTelefone(telefone: string | null | undefined): string {
  if (!telefone) return '-';
  const telefoneLimpo = telefone.replace(/\D/g, '');
  if (telefoneLimpo.length === 11) {
    return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (telefoneLimpo.length === 10) {
    return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return telefone;
}

/**
 * Formata OAB com UF (OAB/UF)
 */
export function formatarOab(oab: string | null | undefined, ufOab: string | null | undefined): string {
  if (!oab) return '-';
  if (ufOab) {
    return `${oab}/${ufOab}`;
  }
  return oab;
}

/**
 * Formata nome de exibição (capitaliza primeira letra de cada palavra)
 */
export function formatarNomeExibicao(nome: string | null | undefined): string {
  if (!nome) return '-';
  return nome
    .toLowerCase()
    .split(' ')
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
}

/**
 * Formata data (DD/MM/YYYY)
 */
export function formatarData(data: string | null | undefined): string {
  if (!data) return '-';
  try {
    const date = new Date(data);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
}

/**
 * Formata endereço completo
 */
export function formatarEnderecoCompleto(endereco: {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  cep?: string;
} | null | undefined): string {
  if (!endereco) return '-';
  
  const partes: string[] = [];
  
  if (endereco.logradouro) {
    const logradouro = endereco.numero
      ? `${endereco.logradouro}, ${endereco.numero}`
      : endereco.logradouro;
    partes.push(logradouro);
  }
  
  if (endereco.complemento) {
    partes.push(endereco.complemento);
  }
  
  if (endereco.bairro) {
    partes.push(endereco.bairro);
  }
  
  if (endereco.cidade || endereco.estado) {
    const cidadeEstado = [endereco.cidade, endereco.estado].filter(Boolean).join(' - ');
    if (cidadeEstado) partes.push(cidadeEstado);
  }
  
  if (endereco.cep) {
    const cepFormatado = endereco.cep.replace(/(\d{5})(\d{3})/, '$1-$2');
    partes.push(`CEP: ${cepFormatado}`);
  }
  
  return partes.length > 0 ? partes.join(', ') : '-';
}

/**
 * Formata gênero para exibição
 */
export function formatarGenero(genero: string | null | undefined): string {
  if (!genero) return '-';
  const generos: Record<string, string> = {
    masculino: 'Masculino',
    feminino: 'Feminino',
    outro: 'Outro',
    prefiro_nao_informar: 'Prefiro não informar',
  };
  return generos[genero] || genero;
}

