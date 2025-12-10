/**
 * Utilitários para formatação e manipulação de mensagens do chat
 */

interface ChatMessageUser {
  name: string;
  [key: string]: unknown;
}

interface ChatMessageLike {
  user: ChatMessageUser;
  createdAt: string;
  [key: string]: unknown;
}

interface ChatAttachment {
  name: string;
  url: string;
  type: string;
  [key: string]: unknown;
}

/**
 * Formata timestamp para exibição conforme especificação
 * - Conversas privadas: "HH:mm - DD/MM/AAAA"
 * - Grupos/salas: "Nome - HH:mm - DD/MM/AAAA"
 */
export function formatChatTimestamp(
  timestamp: string | Date,
  tipoChat: 'privado' | 'grupo' | 'geral' | 'documento',
  userName?: string
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  const time = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  if (tipoChat === 'privado') {
    return `${time} - ${dateStr}`;
  } else if (userName) {
    return `${userName} - ${time} - ${dateStr}`;
  } else {
    return `${time} - ${dateStr}`;
  }
}

/**
 * Formata timestamp para exibição compacta
 * - Apenas hora e data: "HH:mm - DD/MM"
 */
export function formatCompactTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  const time = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });

  return `${time} - ${dateStr}`;
}

/**
 * Determina se deve mostrar o header (nome do usuário) na mensagem
 * - Conversas privadas: false (já se sabe quem está falando)
 * - Grupos/salas: true (precisa identificar o remetente)
 */
export function shouldShowMessageHeader(tipoChat: 'privado' | 'grupo' | 'geral' | 'documento'): boolean {
  return tipoChat !== 'privado';
}

/**
 * Verifica se a mensagem deve ser agrupada com a anterior
 * (mesmo usuário e tempo muito próximo)
 */
export function shouldGroupWithPrevious(
  currentMessage: ChatMessageLike,
  previousMessage: ChatMessageLike | null,
  tipoChat: 'privado' | 'grupo' | 'geral' | 'documento'
): boolean {
  if (!previousMessage) return false;
  
  // Em conversas privadas, sempre agrupar mensagens do mesmo usuário
  if (tipoChat === 'privado') {
    return currentMessage.user.name === previousMessage.user.name;
  }
  
  // Em grupos/salas, agrupar se mesmo usuário e mensagens muito próximas no tempo (2 minutos)
  const currentTime = new Date(currentMessage.createdAt).getTime();
  const previousTime = new Date(previousMessage.createdAt).getTime();
  const timeDiff = currentTime - previousTime;
  const twoMinutes = 2 * 60 * 1000;
  
  return (
    currentMessage.user.name === previousMessage.user.name &&
    timeDiff <= twoMinutes
  );
}

/**
 * Processa conteúdo da mensagem para extrair texto e anexos
 */
export function parseMessageContent(content: string): {
  textContent: string;
  hasAttachments: boolean;
  attachments?: ChatAttachment[];
} {
  // Extract text content first, regardless of JSON validity
  const textContent = content.replace(/\[FILES_START\].*?\[FILES_END\]/g, '').trim();

  try {
    // Procurar por anexos no formato [FILES_START]...[/FILES_END]
    const filePattern = /\[FILES_START\](.*?)\[FILES_END\]/;
    const match = content.match(filePattern);
    
    if (match && match[1]) {
      const attachments = JSON.parse(match[1]);
      
      return {
        textContent,
        hasAttachments: true,
        attachments
      };
    }
    
    return {
      textContent,
      hasAttachments: false
    };
  } catch {
    return {
      textContent,
      hasAttachments: false
    };
  }
}

/**
 * Valida tipos de arquivo suportados no chat
 */
export const SUPPORTED_FILE_TYPES = {
  // Documentos
  'application/pdf': { label: 'PDF', category: 'document' as const },
  'application/msword': { label: 'DOC', category: 'document' as const },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'DOCX', category: 'document' as const },
  'application/vnd.ms-excel': { label: 'XLS', category: 'document' as const },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { label: 'XLSX', category: 'document' as const },
  'application/vnd.ms-powerpoint': { label: 'PPT', category: 'document' as const },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { label: 'PPTX', category: 'document' as const },
  
  // Imagens
  'image/jpeg': { label: 'JPG', category: 'image' as const },
  'image/png': { label: 'PNG', category: 'image' as const },
  'image/gif': { label: 'GIF', category: 'image' as const },
  'image/webp': { label: 'WEBP', category: 'image' as const },
  'image/svg+xml': { label: 'SVG', category: 'image' as const },
  
  // Áudio
  'audio/mpeg': { label: 'MP3', category: 'audio' as const },
  'audio/wav': { label: 'WAV', category: 'audio' as const },
  'audio/ogg': { label: 'OGG', category: 'audio' as const },
  'audio/webm': { label: 'WEBM', category: 'audio' as const },
  
  // Vídeo
  'video/mp4': { label: 'MP4', category: 'video' as const },
  'video/webm': { label: 'WEBM', category: 'video' as const },
  'video/ogg': { label: 'OGG', category: 'video' as const },
};

/**
 * Valida se um tipo de arquivo é suportado
 */
export function isFileTypeSupported(mimeType: string): boolean {
  return mimeType in SUPPORTED_FILE_TYPES;
}

/**
 * Obtem informações sobre um tipo de arquivo
 */
export function getFileTypeInfo(mimeType: string) {
  return SUPPORTED_FILE_TYPES[mimeType as keyof typeof SUPPORTED_FILE_TYPES];
}