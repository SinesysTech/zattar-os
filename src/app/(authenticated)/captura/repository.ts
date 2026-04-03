/**
 * CAPTURA REPOSITORY - Acesso a Dados
 *
 * Funções para buscar credenciais, configurações e salvar logs de captura.
 * Reutiliza serviços existentes quando possível.
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import { getCredential } from './credentials/credential.service';
import type { Credencial, ConfigTribunal, CustomTimeouts } from './domain';
import type { TipoAcessoTribunal } from './types/trt-types';

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
 * 
 * @param tribunalCodigo - Código do tribunal (ex: "TRT1", "TRT2", "TST")
 * @param tipoAcesso - Tipo de acesso opcional para filtrar (primeiro_grau, segundo_grau, etc)
 */
export async function buscarConfigTribunal(
    tribunalCodigo: string,
    tipoAcesso?: TipoAcessoTribunal
): Promise<ConfigTribunal | null> {
    const supabase = createServiceClient();

    // Primeiro, buscar o ID do tribunal pelo código
    const { data: tribunal, error: tribunalError } = await supabase
        .from('tribunais')
        .select('id, codigo, nome')
        .eq('codigo', tribunalCodigo)
        .maybeSingle();

    if (tribunalError || !tribunal) {
        console.error('Erro ao buscar tribunal pelo código:', tribunalError);
        return null;
    }

    // Agora buscar a configuração usando o tribunal_id
    let query = supabase
        .from('tribunais_config')
        .select(`
      id,
      sistema,
      tipo_acesso,
      url_base,
      url_login_seam,
      url_api,
      custom_timeouts,
      tribunal_id
    `)
        .eq('tribunal_id', tribunal.id);

    // Se tipo_acesso foi especificado, filtrar por ele
    if (tipoAcesso) {
        query = query.eq('tipo_acesso', tipoAcesso);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
        console.error('Erro ao buscar configuração do tribunal:', error);
        return null;
    }

    return {
        tribunalId: data.tribunal_id,
        sistema: data.sistema,
        tipoAcesso: data.tipo_acesso as TipoAcessoTribunal,
        loginUrl: data.url_login_seam,
        baseUrl: data.url_base,
        apiUrl: data.url_api || '',
        customTimeouts: data.custom_timeouts as CustomTimeouts,
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
