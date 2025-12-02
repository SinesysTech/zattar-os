/**
 * Validação centralizada para conteúdo Markdown de templates
 *
 * Este módulo centraliza as validações de conteudo_markdown para evitar
 * duplicação entre rotas POST e PATCH.
 */

/**
 * Tamanho máximo permitido para conteúdo Markdown (100KB)
 */
export const MAX_MARKDOWN_CHARS = 100000;

/**
 * Resultado da validação de conteúdo Markdown
 */
export interface MarkdownValidationResult {
  /** Se o conteúdo é válido */
  valid: boolean;
  /** Mensagem de erro, se houver */
  error?: string;
  /** Se deve apenas avisar (não bloquear), para casos não críticos */
  warning?: string;
}

/**
 * Valida conteúdo Markdown de template
 *
 * Regras de validação:
 * - null/undefined: válido (campo opcional)
 * - Deve ser string
 * - Máximo 100KB (100.000 caracteres)
 * - Não deve conter padrões perigosos de XSS (HTML com scripts/handlers)
 * - Placeholders {{variavel}} são recomendados mas não obrigatórios (apenas warning)
 *
 * @param content Conteúdo Markdown a validar
 * @returns Resultado da validação com flag valid e mensagem de erro/warning
 */
export function validateMarkdownContent(
  content: string | null | undefined
): MarkdownValidationResult {
  // null/undefined é válido (campo opcional)
  if (content === null || content === undefined) {
    return { valid: true };
  }

  // Validar tipo
  if (typeof content !== 'string') {
    return {
      valid: false,
      error: 'Conteúdo Markdown deve ser uma string'
    };
  }

  // String vazia é válida (será convertida para null no payload)
  if (content.length === 0) {
    return { valid: true };
  }

  // Validar tamanho máximo
  if (content.length > MAX_MARKDOWN_CHARS) {
    return {
      valid: false,
      error: `Conteúdo Markdown muito grande (máximo ${MAX_MARKDOWN_CHARS.toLocaleString()} caracteres)`
    };
  }

  // Validar segurança - detectar padrões de XSS baseados em HTML
  // Regex refinada para reduzir falsos positivos:
  // - <script[\s>]: tag script com espaço ou fechamento
  // - on\w+=: event handlers inline (onclick=, onerror=, etc.)
  // - <iframe[\s>]: iframes podem executar scripts
  //
  // NÃO bloqueamos "javascript:" em texto plano para evitar falsos positivos
  // (ex.: "Aprenda javascript: variáveis e funções")
  const dangerousPatterns = /<script[\s>]|on\w+\s*=|<iframe[\s>]/i;

  if (dangerousPatterns.test(content)) {
    return {
      valid: false,
      error: 'Conteúdo Markdown contém padrões HTML não permitidos (scripts ou event handlers)'
    };
  }

  // Verificar presença de placeholders (recomendado mas não obrigatório)
  // Apenas geramos warning, não bloqueamos
  const hasPlaceholders = /\{\{[^}]+\}\}/.test(content);
  if (!hasPlaceholders) {
    return {
      valid: true,
      warning: 'Conteúdo Markdown não contém placeholders {{variavel}}. Templates geralmente precisam de variáveis dinâmicas.'
    };
  }

  return { valid: true };
}

/**
 * Normaliza conteúdo Markdown antes de salvar
 *
 * - Preserva espaços e formatação (NÃO faz trim)
 * - Normaliza quebras de linha para LF (\n)
 * - Converte string vazia para null
 *
 * @param content Conteúdo bruto do FormData
 * @returns Conteúdo normalizado ou null
 */
export function normalizeMarkdownContent(content: string | null | undefined): string | null {
  if (content === null || content === undefined) {
    return null;
  }

  if (typeof content !== 'string') {
    return null;
  }

  // Normalizar quebras de linha (CRLF -> LF)
  const normalized = content.replace(/\r\n/g, '\n');

  // Converter string vazia para null
  if (normalized.length === 0) {
    return null;
  }

  // NÃO fazer trim() - preservar espaçamento original do Markdown
  return normalized;
}

/**
 * Valida conteúdo Markdown para formulários de criação/edição de templates
 *
 * Regras de validação:
 * - String vazia ou apenas whitespace: válido (campo opcional)
 * - Máximo 100KB (100.000 caracteres)
 * - Deve conter pelo menos um placeholder {{variavel}}
 *
 * @param content Conteúdo Markdown a validar
 * @returns Resultado da validação com flag valid e mensagem de erro
 */
export function validateMarkdownForForm(content: string): { valid: boolean; error?: string } {
  const trimmed = content.trim();
  
  if (!trimmed) {
    return { valid: true }; // Campo opcional
  }
  
  if (trimmed.length > MAX_MARKDOWN_CHARS) {
    return {
      valid: false,
      error: 'Conteúdo Markdown muito grande (máximo 100KB)'
    };
  }
  
  if (!/\{\{[^}]+\}\}/.test(trimmed)) {
    return {
      valid: false,
      error: 'Markdown deve conter pelo menos uma variável {{variavel}}'
    };
  }
  
  return { valid: true };
}