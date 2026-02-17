/**
 * Configuração do Chatwoot
 * Lê configurações da tabela integracoes em vez de variáveis de ambiente
 *
 * @example
 * ```typescript
 * import { getChatwootConfigFromDatabase } from '@/lib/chatwoot/config';
 *
 * // Ler configuração ativa do banco de dados
 * const config = await getChatwootConfigFromDatabase();
 * if (config) {
 *   console.log('Chatwoot configurado:', config.apiUrl);
 * }
 * ```
 */

import { createDbClient } from '@/lib/supabase';
import type { ChatwootConfig } from './types';

/**
 * Busca a configuração ativa do Chatwoot a partir da tabela integracoes
 *
 * @returns Promise com a configuração, ou null se não configurado
 */
export async function getChatwootConfigFromDatabase(): Promise<ChatwootConfig | null> {
  try {
    const db = createDbClient();

    // Busca a primeira integração ativa do tipo 'chatwoot'
    const { data, error } = await db
      .from('integracoes')
      .select('configuracao')
      .eq('tipo', 'chatwoot')
      .eq('ativo', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[Chatwoot Config] Erro ao buscar configuração:', error.message);
      return null;
    }

    if (!data) {
      console.debug('[Chatwoot Config] Nenhuma integração ativa encontrada');
      return null;
    }

    const config = data.configuracao as Record<string, unknown>;

    // Validar campos obrigatórios
    if (!config.api_url || !config.api_key || !config.account_id) {
      console.error('[Chatwoot Config] Configuração incompleta - faltam campos obrigatórios');
      return null;
    }

    return {
      apiUrl: (config.api_url as string).replace(/\/$/, ''), // Remove trailing slash
      apiKey: config.api_key as string,
      accountId: config.account_id as number,
      defaultInboxId: config.default_inbox_id ? (config.default_inbox_id as number) : undefined,
    };
  } catch (error) {
    console.error('[Chatwoot Config] Erro inesperado:', error);
    return null;
  }
}

/**
 * Verifica se o Chatwoot está configurado (busca da tabela integracoes)
 *
 * @returns Promise<boolean>
 */
export async function isChatwootConfiguredInDatabase(): Promise<boolean> {
  const config = await getChatwootConfigFromDatabase();
  return config !== null;
}

/**
 * Obtém configuração do Chatwoot do banco de dados
 *
 * @returns Promise com configuração ou null
 */
export async function getChatwootConfigWithFallback(): Promise<ChatwootConfig | null> {
  return getChatwootConfigFromDatabase();
}
