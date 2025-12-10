// Utilitários de formatação para assistentes

import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata data de criação para exibição
 * Formato: "DD/MM/YYYY às HH:mm"
 */
export function formatarDataCriacao(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return '-';
  }
}

/**
 * Formata data de forma relativa ("há 2 dias", "há 1 hora")
 */
export function formatarDataRelativa(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch {
    return '-';
  }
}

/**
 * Trunca descrição para exibição em cards
 * Adiciona "..." se truncado, retorna "-" se null
 */
export function truncarDescricao(descricao: string | null, maxLength: number = 100): string {
  if (!descricao) return '-';
  if (descricao.length <= maxLength) return descricao;
  return descricao.substring(0, maxLength).trim() + '...';
}

/**
 * Sanitiza código do iframe
 * Remove scripts maliciosos e valida que é um iframe
 */
export function sanitizarIframeCode(iframeCode: string): string {
  if (!iframeCode) return '';
  
  // Remover tags script
  const sanitized = iframeCode.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Verificar se contém iframe
  if (!/<iframe[^>]*>[\s\S]*?<\/iframe>/i.test(sanitized)) {
    throw new Error('Código fornecido não é um iframe válido');
  }
  
  return sanitized;
}