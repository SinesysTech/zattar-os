/**
 * CAPTURA REPOSITORY - Acesso a Dados
 *
 * Funções para buscar credenciais, configurações e salvar logs de captura.
 * Reutiliza serviços existentes quando possível.
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { getCredential } from '@/backend/captura/credentials/credential.service';
import type { Credencial, ConfigTribunal } from './domain';

/**
 * Busca credencial por ID
 */
export async function buscarCredencial(credentialId: number): Promise<Credencial | null> {
    const credencialTRT = await getCredential({ credentialId });

    if (!credencialTRT) {
        return null;
    }

    return {
        cpf: credencialTRT.cpf,
        senha: credencialTRT.senha,
    };
}

/**
 * Busca configuração do tribunal no banco de dados
 * 
 * Esta é a função única de acesso a dados para tribunais_config.
 * Centraliza a leitura de configurações de tribunais no repositório.
 */
export async function buscarConfigTribunal(tribunalId: string): Promise<ConfigTribunal | null> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('tribunais_config')
        .select(`
      id,
      sistema,
      tipo_acesso,
      url_base,
      url_login_seam,
      url_api,
      custom_timeouts,
      tribunal_id,
      tribunais (
        codigo,
        nome
      )
    `)
        .eq('tribunal_id', tribunalId)
        .single();

    if (error || !data) {
        console.error('Erro ao buscar configuração do tribunal:', error);
        return null;
    }

    // tribunais pode ser um objeto único ou array
    const tribunalRaw = data.tribunais;
    const tribunal = Array.isArray(tribunalRaw)
        ? tribunalRaw[0]
        : tribunalRaw;

    if (!tribunal) {
        console.error('Tribunal não encontrado na configuração');
        return null;
    }

    return {
        tribunalId: data.tribunal_id,
        sistema: data.sistema,
        tipoAcesso: data.tipo_acesso as any, // TipoAcessoTribunal
        loginUrl: data.url_login_seam,
        baseUrl: data.url_base,
        apiUrl: data.url_api || '',
        customTimeouts: data.custom_timeouts as any, // CustomTimeouts
        // Metadados adicionais do tribunal
        tribunalCodigo: tribunal.codigo,
        tribunalNome: tribunal.nome,
    };
}


/**
 * Salva log de captura (placeholder - implementar conforme necessário)
 */
export async function salvarLogCaptura(params: {
    tribunalId: string;
    credencialId: number;
    tipo: string;
    resultado: unknown;
    erro?: string;
    duracaoMs: number;
}): Promise<void> {
    // TODO: Implementar persistência de logs
    console.log('📝 Log de captura:', params);
}
