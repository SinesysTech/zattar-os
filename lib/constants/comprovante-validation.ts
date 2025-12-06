/**
 * Constantes de validação para upload de comprovantes
 * Compartilhado entre frontend e backend para garantir consistência
 */

/**
 * Tipos MIME permitidos para comprovantes
 */
export const COMPROVANTE_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

/**
 * Extensões de arquivo permitidas (para mensagens de erro)
 */
export const COMPROVANTE_ALLOWED_EXTENSIONS = ['PDF', 'JPG', 'JPEG', 'PNG', 'WEBP'] as const;

/**
 * Tamanho máximo do arquivo em bytes (10MB)
 */
export const COMPROVANTE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Tamanho máximo formatado para exibição em mensagens
 */
export const COMPROVANTE_MAX_SIZE_LABEL = '10MB';

/**
 * Mensagem de erro para tipo de arquivo inválido
 */
export const COMPROVANTE_INVALID_TYPE_MESSAGE = `Tipo de comprovante não permitido. Use ${COMPROVANTE_ALLOWED_EXTENSIONS.join(', ')}.`;

/**
 * Mensagem de erro para arquivo muito grande
 */
export const COMPROVANTE_SIZE_EXCEEDED_MESSAGE = `Comprovante excede tamanho máximo de ${COMPROVANTE_MAX_SIZE_LABEL}.`;

/**
 * Texto de ajuda para o usuário
 */
export const COMPROVANTE_HELP_TEXT = `Formatos aceitos: ${COMPROVANTE_ALLOWED_EXTENSIONS.join(', ')}. Máximo: ${COMPROVANTE_MAX_SIZE_LABEL}.`;

/**
 * Valida se um tipo MIME é permitido para comprovantes
 */
export const isValidComprovanteMimeType = (mimeType: string): boolean => {
  return COMPROVANTE_ALLOWED_MIME_TYPES.some((allowed) =>
    mimeType === allowed || mimeType.includes(allowed.split('/')[1])
  );
};

/**
 * Valida se o tamanho do arquivo está dentro do limite
 */
export const isValidComprovanteSize = (sizeInBytes: number): boolean => {
  return sizeInBytes <= COMPROVANTE_MAX_SIZE_BYTES;
};
