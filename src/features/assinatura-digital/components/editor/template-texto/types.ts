/**
 * Template Texto Types
 *
 * Types for text-based templates using Plate editor.
 */

import type { Descendant } from 'platejs';

/**
 * Template texto metadata
 */
export interface TemplateTextoMetadata {
  nome: string;
  descricao?: string;
  segmento_id?: number | null;
  processo_id?: number | null;
}

/**
 * Template texto content
 */
export interface TemplateTextoContent {
  /** Plate editor content (JSON) */
  plateContent: Descendant[];
  /** HTML rendered content */
  htmlContent?: string;
}

/**
 * Template texto creation form data
 */
export interface TemplateTextoFormData extends TemplateTextoMetadata {
  conteudo: Descendant[];
}

/**
 * Variable categories for template insertion
 */
export type VariableCategory =
  | 'cliente'
  | 'segmento'
  | 'sistema'
  | 'formulario'
  | 'processo';

/**
 * Variable definition for insertion
 */
export interface TemplateVariable {
  key: string;
  label: string;
  category: VariableCategory;
  description?: string;
}

/**
 * Predefined template variables
 */
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Cliente
  { key: 'cliente.nome_completo', label: 'Nome Completo', category: 'cliente' },
  { key: 'cliente.cpf', label: 'CPF', category: 'cliente' },
  { key: 'cliente.cnpj', label: 'CNPJ', category: 'cliente' },
  { key: 'cliente.email', label: 'E-mail', category: 'cliente' },
  { key: 'cliente.telefone', label: 'Telefone', category: 'cliente' },
  { key: 'cliente.data_nascimento', label: 'Data de Nascimento', category: 'cliente' },
  { key: 'cliente.endereco_completo', label: 'Endereço Completo', category: 'cliente' },
  { key: 'cliente.endereco_cidade', label: 'Cidade', category: 'cliente' },
  { key: 'cliente.endereco_uf', label: 'UF', category: 'cliente' },
  { key: 'cliente.endereco_cep', label: 'CEP', category: 'cliente' },

  // Segmento
  { key: 'segmento.nome', label: 'Nome do Segmento', category: 'segmento' },
  { key: 'segmento.slug', label: 'Slug do Segmento', category: 'segmento' },
  { key: 'segmento.descricao', label: 'Descrição do Segmento', category: 'segmento' },

  // Sistema
  { key: 'sistema.protocolo', label: 'Protocolo', category: 'sistema' },
  { key: 'sistema.ip_cliente', label: 'IP do Cliente', category: 'sistema' },
  { key: 'sistema.user_agent', label: 'User Agent', category: 'sistema' },

  // Formulário
  { key: 'formulario.nome', label: 'Nome do Formulário', category: 'formulario' },
  { key: 'formulario.slug', label: 'Slug do Formulário', category: 'formulario' },

  // Processo Judicial
  { key: 'processo.numero', label: 'Número do Processo', category: 'processo' },
  { key: 'processo.vara', label: 'Vara', category: 'processo' },
  { key: 'processo.comarca', label: 'Comarca', category: 'processo' },
  { key: 'processo.data_autuacao', label: 'Data de Autuação', category: 'processo' },
  { key: 'processo.valor_causa', label: 'Valor da Causa', category: 'processo' },
  { key: 'processo.tipo', label: 'Tipo do Processo', category: 'processo' },
];

/**
 * Get variables by category
 */
export function getVariablesByCategory(category: VariableCategory): TemplateVariable[] {
  return TEMPLATE_VARIABLES.filter(v => v.category === category);
}

/**
 * Get variable by key
 */
export function getVariableByKey(key: string): TemplateVariable | undefined {
  return TEMPLATE_VARIABLES.find(v => v.key === key);
}

/**
 * Category labels for display
 */
export const CATEGORY_LABELS: Record<VariableCategory, string> = {
  cliente: 'Cliente',
  segmento: 'Segmento',
  sistema: 'Sistema',
  formulario: 'Formulário',
  processo: 'Processo Judicial',
};
