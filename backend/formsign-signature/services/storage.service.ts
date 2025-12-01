import { uploadToBackblaze } from '@/backend/storage/backblaze-b2.service';
import { buildFileName, decodeDataUrlToBuffer } from './base64';

export interface StoredFile {
  url: string;
  key: string;
  bucket: string;
}

export async function storeSignatureImage(dataUrl: string): Promise<StoredFile> {
  const { buffer, contentType } = decodeDataUrlToBuffer(dataUrl);
  const key = `formsign/assinaturas/${buildFileName('assinatura', 'png')}`;
  return uploadToBackblaze({
    buffer,
    key,
    contentType: contentType || 'image/png',
  });
}

export async function storePhotoImage(dataUrl: string): Promise<StoredFile> {
  const { buffer, contentType } = decodeDataUrlToBuffer(dataUrl);
  const key = `formsign/fotos/${buildFileName('foto', 'jpg')}`;
  return uploadToBackblaze({
    buffer,
    key,
    contentType: contentType || 'image/jpeg',
  });
}

export async function storePdf(buffer: Buffer): Promise<StoredFile> {
  const key = `formsign/pdfs/${buildFileName('documento', 'pdf')}`;
  return uploadToBackblaze({
    buffer,
    key,
    contentType: 'application/pdf',
  });
}
