// Formatador e parser de telefone
export const formatTelefone = (telefone: string): string => {
  // Remove tudo que não é dígito
  const cleaned = telefone.replace(/\D/g, '');
  
  // Para celular (11 dígitos): (00) 90000-0000
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  // Para telefone fixo (10 dígitos): (00) 0000-0000
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return cleaned;
};

export const parseTelefone = (telefone: string): string => {
  // Remove toda formatação, mantém apenas números
  return telefone.replace(/\D/g, '');
};

export const formatCelularWithCountryCode = (celular: string): string => {
  const cleaned = parseTelefone(celular);
  
  // Se tem 11 dígitos, adiciona +55
  if (cleaned.length === 11) {
    return `+55${cleaned}`;
  }
  
  return cleaned;
};