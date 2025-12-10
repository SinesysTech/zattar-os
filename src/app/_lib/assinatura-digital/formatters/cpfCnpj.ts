// Formatador e parser dinâmico de CPF ou CNPJ
import { formatCPF } from './cpf';
import { formatCNPJ } from './cnpj';

export const formatCPFCNPJ = (document: string): string => {
  // Remove tudo que não é dígito
  const cleaned = document.replace(/\D/g, '');
  
  // Detecta automaticamente se é CPF (11 dígitos) ou CNPJ (14 dígitos)
  if (cleaned.length <= 11) {
    return formatCPF(cleaned);
  } else {
    return formatCNPJ(cleaned);
  }
};

export const parseCPFCNPJ = (document: string): string => {
  // Remove toda formatação, mantém apenas números
  return document.replace(/\D/g, '');
};

export const detectDocumentType = (document: string): 'CPF' | 'CNPJ' | 'UNKNOWN' => {
  const cleaned = document.replace(/\D/g, '');
  
  if (cleaned.length === 11) return 'CPF';
  if (cleaned.length === 14) return 'CNPJ';
  return 'UNKNOWN';
};