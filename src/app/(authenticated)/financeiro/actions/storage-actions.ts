'use server';

/**
 * Server Actions para upload de arquivos no Storage da feature financeiro
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type { AnexoLancamento } from '../types/lancamentos';

// Tipos permitidos para comprovantes
const COMPROVANTE_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const COMPROVANTE_MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadComprovanteResult {
  success: boolean;
  data?: AnexoLancamento;
  error?: string;
}

/**
 * Faz upload de um comprovante para o Storage
 * @param formData FormData contendo o arquivo em 'file' e opcionalmente 'pasta'
 */
export async function actionUploadComprovante(
  formData: FormData
): Promise<UploadComprovanteResult> {
  try {
    const file = formData.get('file') as File | null;
    const pasta = (formData.get('pasta') as string) || 'comprovantes';

    if (!file) {
      return { success: false, error: 'Arquivo não fornecido' };
    }

    // Validar tipo
    if (!COMPROVANTE_ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WEBP.',
      };
    }

    // Validar tamanho
    if (file.size > COMPROVANTE_MAX_SIZE) {
      return {
        success: false,
        error: 'Arquivo muito grande. Tamanho máximo: 10MB.',
      };
    }

    const supabase = createServiceClient();

    // Criar nome único para o arquivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const uniqueName = `${pasta}/${timestamp}-${randomId}.${extension}`;

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload para Supabase Storage
    const { error } = await supabase.storage
      .from('financeiro')
      .upload(uniqueName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro ao fazer upload:', error);
      return { success: false, error: error.message };
    }

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from('financeiro').getPublicUrl(uniqueName);

    const anexo: AnexoLancamento = {
      nome: file.name,
      url: publicUrl,
      tipo: file.type,
      tamanho: file.size,
      uploadedAt: new Date().toISOString(),
    };

    return { success: true, data: anexo };
  } catch (error) {
    console.error('Erro ao fazer upload do comprovante:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao fazer upload',
    };
  }
}
