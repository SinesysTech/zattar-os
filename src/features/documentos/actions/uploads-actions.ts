'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';
import * as service from '../service';

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
