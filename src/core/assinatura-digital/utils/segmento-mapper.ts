import type { Segmento } from '@/core/assinatura-digital/domain';

/**
 * Interface para formulário de criação/edição de Segmento
 * Usa camelCase seguindo padrão do frontend
 */
export interface SegmentoForm {
  /** Nome do segmento */
  nome: string;

  /** Slug único para URL */
  slug: string;

  /** Descrição opcional */
  descricao?: string;
}

/**
 * Mapeia dados do formulário (camelCase) para formato do backend (snake_case)
 *
 * @param form - Dados do formulário
 * @returns Objeto parcial de Segmento pronto para envio ao backend
 */
export function mapSegmentoFormToSegmento(form: SegmentoForm): Partial<Segmento> {
  return {
    nome: form.nome,
    slug: form.slug,
    descricao: form.descricao,
  };
}