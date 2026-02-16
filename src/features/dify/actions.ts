'use server';

import { difyRepository } from './repository';
import { DifyService } from './service';
import { revalidatePath } from 'next/cache';

export async function listDifyAppsAction() {
    const result = await difyRepository.listDifyApps();
    if (result.isErr()) {
        throw new Error(result.error.message);
    }
    return result.value;
}

export async function createDifyAppAction(data: { name: string; api_url: string; api_key: string; app_type: string }) {
    const result = await difyRepository.createDifyApp(data);
    if (result.isErr()) {
        throw new Error(result.error.message);
    }
    revalidatePath('/app/configuracoes');
    return { success: true, data: result.value };
}

export async function updateDifyAppAction(id: string, data: Partial<{ name: string; api_url: string; api_key: string; app_type: string; is_active: boolean }>) {
    const result = await difyRepository.updateDifyApp(id, data);
    if (result.isErr()) {
        throw new Error(result.error.message);
    }
    revalidatePath('/app/configuracoes');
    return { success: true };
}

export async function deleteDifyAppAction(id: string) {
    const result = await difyRepository.deleteDifyApp(id);
    if (result.isErr()) {
        throw new Error(result.error.message);
    }
    revalidatePath('/app/configuracoes');
    return { success: true };
}

export async function checkDifyAppConnectionAction(apiUrl: string, apiKey: string) {
    try {
        // Cria serviço temporário com as credenciais passadas
        const serviceResult = DifyService.create(apiKey, apiUrl);
        if (serviceResult.isErr()) throw serviceResult.error;

        const service = serviceResult.value;

        // Tenta obter info da aplicação
        const infoResult = await service.obterInfoApp();

        if (infoResult.isErr()) {
            return { success: false, message: infoResult.error.message };
        }

        return { success: true, data: infoResult.value };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
