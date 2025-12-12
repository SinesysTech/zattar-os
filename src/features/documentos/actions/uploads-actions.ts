'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';
import * as service from '../service';
import { indexDocument } from '@/features/ai/services/indexing.service';
import { isContentTypeSupported } from '@/features/ai/services/extraction.service';

export async function actionUploadArquivo(formData: FormData) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const file = formData.get('file') as File;
    const documento_id = formData.get('documento_id') ? parseInt(formData.get('documento_id') as string) : null;

    if (!file) {
      return { success: false, error: 'Nenhum arquivo enviado.' };
    }

    const upload = await service.uploadArquivo(file, documento_id, user.id);

    // Disparar indexação assíncrona para RAG (não bloqueia a resposta)
    if (isContentTypeSupported(upload.tipo_mime)) {
      after(async () => {
        try {
          console.log(`🧠 [AI] Disparando indexação para upload ${upload.id}`);
          await indexDocument({
            entity_type: 'documento',
            entity_id: upload.id,
            parent_id: documento_id,
            storage_provider: 'backblaze',
            storage_key: upload.b2_key,
            content_type: upload.tipo_mime,
            metadata: {
              nome_arquivo: upload.nome_arquivo,
              usuario_id: user.id,
              documento_id,
            },
          });
        } catch (error) {
          console.error(`❌ [AI] Erro na indexação do upload ${upload.id}:`, error);
        }
      });
    }

    revalidatePath(`/documentos/${documento_id}`);
    return { success: true, data: upload };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionListarUploads(documento_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const { uploads, total } = await service.listarUploads(documento_id, user.id);
    return { success: true, data: uploads, total };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionGerarPresignedUrl(filename: string, contentType: string) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    // O service.gerarPresignedUrl não usa usuario_id atualmente, mas o action pode passar
    const presignedUrlData = await service.gerarPresignedUrl(filename, contentType, user.id);
    return { success: true, data: presignedUrlData };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionGerarUrlDownload(key: string) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    const url = await service.gerarUrlDownload(key, user.id);
    return { success: true, data: { url } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
