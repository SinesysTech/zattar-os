/**
 * STORAGE UTILS
 * 
 * Helper functions for storage operations.
 */

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

export function validateFileType(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo muito grande. Máximo permitido: 50MB.');
  }

  // Check generic types
  const allAllowed = Object.values(ALLOWED_MIME_TYPES).flat();
  if (!allAllowed.includes(file.type)) {
    // Optionally allow generic types if not strictly restricted
    // But better to restrict.
    // throw new Error('Tipo de arquivo não suportado.');
  }
}

export function generateFileKey(salaId: number, fileName: string): string {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `chat/${salaId}/${timestamp}_${safeName}`;
}

export function getFileTypeFromMime(mimeType: string): 'imagem' | 'video' | 'audio' | 'arquivo' {
  if (ALLOWED_MIME_TYPES.image.includes(mimeType)) return 'imagem';
  if (ALLOWED_MIME_TYPES.video.includes(mimeType)) return 'video';
  if (ALLOWED_MIME_TYPES.audio.includes(mimeType)) return 'audio';
  return 'arquivo';
}
