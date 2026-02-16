import { DifyService } from './service';

export async function createDifyService(userId: string): Promise<DifyService> {
    // A factory do Service requer validação de configuração
    // Se falhar, lança erro para ser capturado pelo bloco try/catch do handler da ferramenta
    // O userId pode ser usado para contexto se necessário futuramente, mas a autenticação da API usa a key global
    const result = DifyService.create();
    if (result.isErr()) {
        throw result.error;
    }
    return result.value;
}
