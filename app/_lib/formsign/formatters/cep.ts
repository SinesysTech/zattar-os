// Formatador e parser de CEP
export const formatCEP = (cep: string): string => {
  // Remove tudo que não é dígito
  const cleaned = cep.replace(/\D/g, '');
  
  // Aplica máscara: 00000-000
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return cleaned;
};

export const parseCEP = (cep: string): string => {
  // Remove toda formatação, mantém apenas números
  return cep.replace(/\D/g, '');
};