import { DifyService } from './service';

export async function createDifyService(userId: string): Promise<DifyService> {
    // A factory do Service requer validação de configuração
    // Agora usa createAsync para buscar do banco de dados se disponível
    try {
        const service = await DifyService.createAsync(userId);
        return service;
    } catch (error) {
        throw error;
    }
}
