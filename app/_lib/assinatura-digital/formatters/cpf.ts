// Formatador e parser de CPF
export const formatCPF = (cpf: string): string => {
  // Remove tudo que não é dígito
  const cleaned = cpf.replace(/\D/g, '');
  
  // Aplica máscara: 000.000.000-00
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  return cleaned;
};

export const parseCPF = (cpf: string): string => {
  // Remove toda formatação, mantém apenas números
  return cpf.replace(/\D/g, '');
};