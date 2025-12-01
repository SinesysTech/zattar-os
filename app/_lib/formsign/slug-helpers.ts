/**
 * Constantes e Helpers para Slugs (Segmentos e Formulários)
 *
 * IMPORTANTE: Este arquivo contém apenas helpers utilitários genéricos, NÃO dados hardcoded.
 * Diferença de constants/escritorios.ts:
 * - escritorios.ts tinha dados hardcoded (ESCRITORIOS object com IDs 1 e 15)
 * - segmentos.ts tem apenas helpers genéricos (sem dados hardcoded)
 *
 * Segmentos e Formulários agora são dinâmicos e gerenciados via n8n Data Tables.
 * Para obter lista de segmentos/formulários, use: N8nService.listarSegmentos() / N8nService.listarFormularios()
 *
 * Helpers são reutilizados em:
 * - Validações Zod (segmento.types.ts, formulario-entity.types.ts)
 * - Geração automática de slugs
 * - Validação de formato de slug
 */

// ============================================================================
// Constantes
// ============================================================================

/**
 * Regex pattern para validar formato de slug (kebab-case)
 *
 * Formato: kebab-case
 * - Apenas lowercase (a-z)
 * - Números (0-9)
 * - Hífens (-) como separadores
 * - Não pode começar ou terminar com hífen
 *
 * Uso: Segmentos, Formulários e qualquer entidade que precise de slug
 *
 * @example
 * 'juridico' ✓
 * 'juridico-sp' ✓
 * 'rh-e-pessoas' ✓
 * 'contrato-apps' ✓
 * 'Juridico' ✗ (uppercase)
 * 'juridico_sp' ✗ (underscore)
 * '-juridico' ✗ (começa com hífen)
 * 'juridico-' ✗ (termina com hífen)
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normaliza string removendo acentos e diacríticos
 *
 * Usa Unicode Normalization Form Decomposition (NFD) para separar
 * caracteres base de seus diacríticos, e então remove os diacríticos.
 *
 * @param str - String a ser normalizada
 * @returns String normalizada sem acentos
 *
 * @example
 * normalizeString('Jurídico') // 'Juridico'
 * normalizeString('São Paulo') // 'Sao Paulo'
 * normalizeString('Ação') // 'Acao'
 */
export function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Gera slug a partir de um nome (genérico)
 *
 * Processo:
 * 1. Normaliza string (remove acentos)
 * 2. Converte para lowercase
 * 3. Remove espaços em branco nas extremidades (trim)
 * 4. Substitui espaços por hífen
 * 5. Remove caracteres especiais (mantém apenas a-z, 0-9, hífen)
 * 6. Remove hífens duplicados
 * 7. Remove hífens do início/fim
 *
 * @param nome - Nome a ser convertido em slug
 * @returns Slug no formato kebab-case
 *
 * @example
 * generateSlug('Jurídico SP') // 'juridico-sp'
 * generateSlug('RH & Pessoas') // 'rh-pessoas'
 * generateSlug('Vendas - Região Sul') // 'vendas-regiao-sul'
 * generateSlug('Contrato Apps') // 'contrato-apps'
 * generateSlug('  Marketing  ') // 'marketing'
 * generateSlug('TI/Tecnologia') // 'ti-tecnologia'
 */
export function generateSlug(nome: string): string {
  return normalizeString(nome)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')              // Substitui espaços por hífen
    .replace(/[^a-z0-9-]/g, '')        // Remove caracteres especiais
    .replace(/-+/g, '-')               // Remove hífens duplicados
    .replace(/^-+|-+$/g, '');          // Remove hífens do início/fim
}

/**
 * Gera slug a partir do nome do formulário
 *
 * @param nome - Nome do formulário
 * @returns Slug no formato kebab-case
 *
 * @example
 * generateFormularioSlug('Contrato Apps') // 'contrato-apps'
 * generateFormularioSlug('Ação Trabalhista') // 'acao-trabalhista'
 */
export function generateFormularioSlug(nome: string): string {
  return generateSlug(nome);
}

/**
 * Valida formato de slug (kebab-case)
 *
 * Verifica se o slug está no formato kebab-case correto usando
 * a regex SLUG_PATTERN.
 *
 * @param slug - Slug a ser validado
 * @returns true se válido, false caso contrário
 *
 * @example
 * validateSlug('juridico') // true
 * validateSlug('juridico-sp') // true
 * validateSlug('contrato-apps') // true
 * validateSlug('Juridico') // false (uppercase)
 * validateSlug('juridico_sp') // false (underscore)
 * validateSlug('-juridico') // false (começa com hífen)
 * validateSlug('juridico-') // false (termina com hífen)
 * validateSlug('') // false (vazio)
 */
export function validateSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}