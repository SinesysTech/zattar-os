/**
 * Utilitários de formatação para templates de assinatura digital
 * 
 * Este arquivo contém funções utilitárias para formatar dados relacionados
 * aos templates, como tamanhos de arquivo, status e nomes de exibição.
 */

import { StatusTemplate, Template } from '@/types/assinatura-digital/template.types';

/**
 * Tipo das variantes disponíveis para o componente Badge
 */
type BadgeVariant = 'default' | 'destructive' | 'outline' | 'secondary';

/**
 * Formata o tamanho de um arquivo em bytes para uma representação legível
 * 
 * @param bytes - Tamanho do arquivo em bytes
 * @returns String formatada (ex: "1.50 MB", "350.00 KB")
 * 
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1572864) // "1.50 MB"
 * formatFileSize(0) // "0 B"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Converte o status do template para uma label em português
 * 
 * @param status - Status do template
 * @returns Label em português
 * 
 * @example
 * formatTemplateStatus('ativo') // "Ativo"
 * formatTemplateStatus('rascunho') // "Rascunho"
 */
export function formatTemplateStatus(status: StatusTemplate): string {
  switch (status) {
    case 'ativo':
      return 'Ativo';
    case 'inativo':
      return 'Inativo';
    case 'rascunho':
      return 'Rascunho';
    default:
      return status;
  }
}

/**
 * Retorna a variante apropriada do Badge baseada no status do template
 * 
 * @param status - Status do template
 * @returns Variante do Badge
 * 
 * @example
 * getStatusBadgeVariant('ativo') // "default"
 * getStatusBadgeVariant('inativo') // "destructive"
 */
export function getStatusBadgeVariant(status: StatusTemplate): BadgeVariant {
  switch (status) {
    case 'ativo':
      return 'default';
    case 'inativo':
      return 'destructive';
    case 'rascunho':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Trunca um texto se ele exceder o comprimento máximo, adicionando "..."
 * 
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo permitido
 * @returns Texto truncado ou original se menor que maxLength
 * 
 * @example
 * truncateText('Nome muito longo do template', 20) // "Nome muito longo..."
 * truncateText('Curto', 20) // "Curto"
 * truncateText('', 20) // ""
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Retorna o nome de exibição do template com fallbacks apropriados
 * 
 * @param template - Objeto do template
 * @returns Nome de exibição do template
 * 
 * @example
 * getTemplateDisplayName({ nome: 'Contrato de Prestação' }) // "Contrato de Prestação"
 * getTemplateDisplayName({ nome: '' }) // "Template sem nome"
 * getTemplateDisplayName({}) // "Template sem nome"
 */
export function getTemplateDisplayName(template: Template): string {
  return template.nome?.trim() || 'Template sem nome';
}