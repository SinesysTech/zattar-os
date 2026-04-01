export type AttachmentType = 'image' | 'audio' | 'document'

export interface PedrinhoAttachment {
  id: string
  file: File
  type: AttachmentType
  mediaType: string
  name: string
  size: number
  preview?: string
  duration?: number
}

export interface AudioRecorderState {
  status: 'idle' | 'recording' | 'paused'
  duration: number
  waveformData: number[]
}

export interface MultimodalRequest {
  text: string
  attachments: Array<{
    data: string
    mediaType: string
    name: string
  }>
  threadId?: string
}

export interface MultimodalResponse {
  content: string
  error?: string
}

export const ACCEPTED_TYPES: Record<AttachmentType, string> = {
  image: '.png,.jpg,.jpeg,.gif,.webp,.bmp',
  audio: '.mp3,.wav,.ogg,.m4a,.webm,.flac,.aac',
  document: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.rtf',
}

export const MAX_FILE_SIZE = 15 * 1024 * 1024
export const MAX_ATTACHMENTS = 5

export function getAttachmentType(mimeType: string): AttachmentType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
