// Formatador e parser de CNPJ
export const formatCNPJ = (cnpj: string): string => {
  // Remove tudo que não é dígito
  const cleaned = cnpj.replace(/\D/g, '');
  
  // Aplica máscara: 00.000.000/0000-00
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return cleaned;
};

export const parseCNPJ = (cnpj: string): string => {
  // Remove toda formatação, mantém apenas números
  return cnpj.replace(/\D/g, '');
};