/**
 * Serviço de upload para Backblaze B2
 *
 * Gerencia uploads de arquivos para o Backblaze B2 (S3-compatible)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Configuração do cliente S3 para Backblaze B2
const s3Client = new S3Client({
  region: process.env.B2_REGION || 'us-east-1',
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'zattar-advogados';

/**
 * Gera um nome único para o arquivo
 */
function generateUniqueFileName(originalName: string): string {
  const extension = originalName.split('.').pop();
  const randomHash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();

  return `${timestamp}-${randomHash}.${extension}`;
}

/**
 * Determina o tipo de mídia baseado no MIME type
 */
function getTipoMedia(mimeType: string): 'imagem' | 'video' | 'audio' | 'pdf' | 'outros' {
  if (mimeType.startsWith('image/')) return 'imagem';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'outros';
}

/**
 * Faz upload de um arquivo para o Backblaze B2
 */
export async function uploadFileToB2(params: {
  file: Buffer;
  fileName: string;
  contentType: string;
  folder?: string;
}): Promise<{
  key: string;
  url: string;
  size: number;
}> {
  const uniqueFileName = generateUniqueFileName(params.fileName);
  const key = params.folder ? `${params.folder}/${uniqueFileName}` : uniqueFileName;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: params.file,
    ContentType: params.contentType,
    ACL: 'public-read', // Tornar arquivo público
  });

  await s3Client.send(command);

  // URL pública do arquivo
  const url = `${process.env.B2_PUBLIC_URL || `https://${BUCKET_NAME}.s3.${process.env.B2_REGION}.backblazeb2.com`}/${key}`;

  return {
    key,
    url,
    size: params.file.length,
  };
}

/**
 * Deleta um arquivo do Backblaze B2
 */
export async function deleteFileFromB2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Gera URL assinada para upload direto do cliente
 */
export async function generatePresignedUploadUrl(params: {
  fileName: string;
  contentType: string;
  folder?: string;
  expiresIn?: number;
}): Promise<{
  uploadUrl: string;
  key: string;
  publicUrl: string;
}> {
  const uniqueFileName = generateUniqueFileName(params.fileName);
  const key = params.folder ? `${params.folder}/${uniqueFileName}` : uniqueFileName;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: params.contentType,
    ACL: 'public-read',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: params.expiresIn || 3600, // 1 hora
  });

  const publicUrl = `${process.env.B2_PUBLIC_URL || `https://${BUCKET_NAME}.s3.${process.env.B2_REGION}.backblazeb2.com`}/${key}`;

  return {
    uploadUrl,
    key,
    publicUrl,
  };
}

/**
 * Valida tipo de arquivo permitido
 */
export function validateFileType(contentType: string): boolean {
  const allowedTypes = [
    // Imagens
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Vídeos
    'video/mp4',
    'video/webm',
    'video/ogg',
    // Áudio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Outros
    'text/plain',
  ];

  return allowedTypes.includes(contentType);
}

/**
 * Valida tamanho do arquivo (max 50MB)
 */
export function validateFileSize(size: number): boolean {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  return size <= MAX_SIZE;
}

export { getTipoMedia };
