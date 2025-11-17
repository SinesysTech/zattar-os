/**
 * Serviço de cache para credenciais
 * 
 * Este módulo implementa um sistema de cache em memória para credenciais,
 * evitando múltiplas consultas ao banco de dados quando processando vários TRTs e graus.
 * 
 * PROPÓSITO:
 * - Reduzir consultas ao banco de dados quando processando múltiplos TRTs/graus
 * - Melhorar performance através de cache em memória
 * - Implementar TTL (Time To Live) para invalidar cache automaticamente
 * 
 * USO:
 * - getCredentialsBatch(): Busca múltiplas credenciais de uma vez e popula o cache
 * - getFromCache(): Busca credencial no cache (usado internamente)
 * - setCache(): Salva credencial no cache (usado internamente)
 * - clearCredentialCache(): Limpa todo o cache (útil para testes)
 * - cleanExpiredCache(): Remove credenciais expiradas do cache
 */

import type { CodigoTRT, GrauTRT, CredenciaisTRT } from '@/backend/types/captura/trt-types';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Interface para item do cache
 */
interface CacheItem {
  credential: CredenciaisTRT;
  timestamp: number; // Timestamp de quando foi cacheado (em milissegundos)
}

/**
 * Cache em memória para credenciais
 * 
 * Estrutura:
 * - Chave: `${advogadoId}:${tribunal}:${grau}` (ex: "123:TRT1:primeiro_grau")
 * - Valor: { credential, timestamp }
 * 
 * Exemplo:
 * {
 *   "123:TRT1:primeiro_grau": { credential: { cpf: "...", senha: "..." }, timestamp: 1234567890 },
 *   "123:TRT1:segundo_grau": { credential: { cpf: "...", senha: "..." }, timestamp: 1234567890 },
 * }
 */
const credentialCache = new Map<string, CacheItem>();

/**
 * TTL do cache em milissegundos
 * 
 * Padrão: 5 minutos (300.000 ms)
 * 
 * Após este tempo, as credenciais são consideradas expiradas e removidas do cache.
 * Isso garante que credenciais atualizadas no banco sejam refletidas após o TTL.
 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Função: getCacheKey
 * 
 * PROPÓSITO:
 * Gera a chave única do cache para uma combinação de advogado, tribunal e grau.
 * 
 * PARÂMETROS:
 * - advogadoId: number - ID do advogado
 * - tribunal: CodigoTRT - Código do tribunal (ex: "TRT1")
 * - grau: GrauTRT - Grau do processo ("primeiro_grau" ou "segundo_grau")
 * 
 * RETORNO:
 * string - Chave do cache no formato "${advogadoId}:${tribunal}:${grau}"
 * 
 * EXEMPLO:
 * getCacheKey(123, "TRT1", "primeiro_grau") => "123:TRT1:primeiro_grau"
 */
function getCacheKey(advogadoId: number, tribunal: CodigoTRT, grau: GrauTRT): string {
  return `${advogadoId}:${tribunal}:${grau}`;
}

/**
 * Função: isCacheValid
 * 
 * PROPÓSITO:
 * Verifica se um item do cache ainda é válido (não expirou).
 * 
 * PARÂMETROS:
 * - item: CacheItem - Item do cache a ser verificado
 * 
 * RETORNO:
 * boolean - true se o cache ainda é válido, false se expirou
 * 
 * COMPORTAMENTO:
 * Compara o timestamp do item com o tempo atual.
 * Se a diferença for menor que CACHE_TTL_MS, o cache é válido.
 */
function isCacheValid(item: CacheItem): boolean {
  const now = Date.now();
  return (now - item.timestamp) < CACHE_TTL_MS;
}

/**
 * Função: getFromCache
 * 
 * PROPÓSITO:
 * Busca uma credencial no cache.
 * Retorna null se não estiver no cache ou se o cache expirou.
 * 
 * PARÂMETROS:
 * - advogadoId: number - ID do advogado
 * - tribunal: CodigoTRT - Código do tribunal
 * - grau: GrauTRT - Grau do processo
 * 
 * RETORNO:
 * CredenciaisTRT | null - Credencial do cache ou null se não encontrada/expirada
 * 
 * COMPORTAMENTO:
 * 1. Gera a chave do cache
 * 2. Busca o item no Map
 * 3. Se não encontrado, retorna null
 * 4. Se encontrado mas expirado, remove do cache e retorna null
 * 5. Se válido, retorna a credencial
 * 
 * CHAMADAS EXTERNAS:
 * Esta função é chamada por:
 * - getCredentialByTribunalAndGrau() em credential.service.ts
 */
export function getFromCache(
  advogadoId: number,
  tribunal: CodigoTRT,
  grau: GrauTRT
): CredenciaisTRT | null {
  const key = getCacheKey(advogadoId, tribunal, grau);
  const cached = credentialCache.get(key);

  if (!cached) {
    return null;
  }

  if (!isCacheValid(cached)) {
    // Cache expirado, remover
    credentialCache.delete(key);
    return null;
  }

  return cached.credential;
}

/**
 * Função: setCache
 * 
 * PROPÓSITO:
 * Salva uma credencial no cache.
 * 
 * PARÂMETROS:
 * - advogadoId: number - ID do advogado
 * - tribunal: CodigoTRT - Código do tribunal
 * - grau: GrauTRT - Grau do processo
 * - credential: CredenciaisTRT - Credencial a ser cacheada
 * 
 * RETORNO:
 * void
 * 
 * COMPORTAMENTO:
 * 1. Gera a chave do cache
 * 2. Cria um CacheItem com a credencial e timestamp atual
 * 3. Salva no Map
 * 
 * CHAMADAS EXTERNAS:
 * Esta função é chamada por:
 * - getCredentialsBatch() após buscar credenciais do banco
 * - getCredentialByTribunalAndGrau() após buscar credencial do banco
 */
export function setCache(
  advogadoId: number,
  tribunal: CodigoTRT,
  grau: GrauTRT,
  credential: CredenciaisTRT
): void {
  const key = getCacheKey(advogadoId, tribunal, grau);
  credentialCache.set(key, {
    credential,
    timestamp: Date.now(),
  });
}

/**
 * Função: getCredentialsBatch
 * 
 * PROPÓSITO:
 * Busca múltiplas credenciais de uma vez no banco de dados e popula o cache.
 * 
 * Esta função é otimizada para quando você precisa processar múltiplos TRTs e graus.
 * Em vez de fazer uma query para cada combinação, faz uma única query buscando todas.
 * 
 * PARÂMETROS:
 * - advogadoId: number (obrigatório)
 *   Tipo: number
 *   Significado: ID do advogado no banco de dados
 *   Exemplo: 123
 * 
 * - combinations: Array<{ tribunal: CodigoTRT; grau: GrauTRT }> (obrigatório)
 *   Tipo: Array de objetos com tribunal e grau
 *   Significado: Lista de combinações de TRT e grau para buscar credenciais
 *   Exemplo: [
 *     { tribunal: 'TRT1', grau: 'primeiro_grau' },
 *     { tribunal: 'TRT1', grau: 'segundo_grau' },
 *     { tribunal: 'TRT2', grau: 'primeiro_grau' },
 *     // ... até 24 TRTs × 2 graus = 48 combinações
 *   ]
 * 
 * RETORNO:
 * Tipo: Promise<Map<string, CredenciaisTRT | null>>
 * Significado: Map onde a chave é `${tribunal}:${grau}` e o valor é a credencial ou null
 * Formato: Map com chaves como "TRT1:primeiro_grau" e valores CredenciaisTRT ou null
 * 
 * CHAMADAS INTERNAS:
 * - createServiceClient(): Cria cliente Supabase
 * - setCache(): Salva cada credencial encontrada no cache
 * 
 * CHAMADAS EXTERNAS:
 * Esta função é chamada por:
 * - Rotas de API quando precisam processar múltiplos TRTs/graus
 * - Jobs do sistema que processam capturas em lote
 * 
 * ENDPOINT HTTP:
 * Não há endpoint HTTP direto. Esta função é chamada internamente.
 * 
 * COMPORTAMENTO ESPECIAL:
 * 
 * 1. Otimização de Query:
 *    - Extrai todos os tribunais únicos da lista de combinações
 *    - Extrai todos os graus únicos da lista de combinações
 *    - Faz uma única query usando `.in('tribunal', tribunais)` e `.in('grau', graus)`
 *    - Isso reduz de N queries para 1 query única
 * 
 * 2. População do Cache:
 *    - Todas as credenciais encontradas são automaticamente salvas no cache
 *    - Isso significa que chamadas subsequentes a getCredentialByTribunalAndGrau()
 *      vão usar o cache em vez de buscar no banco novamente
 * 
 * 3. Tratamento de Erros:
 *    - Se a query falhar, retorna null para todas as combinações
 *    - Loga o erro para debug
 * 
 * 4. Processamento de Resultados:
 *    - Para cada combinação solicitada, busca a credencial correspondente nos resultados
 *    - Se encontrada, processa e salva no cache
 *    - Se não encontrada, retorna null para aquela combinação
 * 
 * EXEMPLO DE USO:
 * 
 * // Preparar lista de todas as combinações (24 TRTs × 2 graus)
 * const combinations = [];
 * for (let i = 1; i <= 24; i++) {
 *   combinations.push({ tribunal: `TRT${i}` as CodigoTRT, grau: 'primeiro_grau' });
 *   combinations.push({ tribunal: `TRT${i}` as CodigoTRT, grau: 'segundo_grau' });
 * }
 * 
 * // Buscar todas de uma vez (1 query ao invés de 48)
 * const credentialsMap = await getCredentialsBatch(123, combinations);
 * 
 * // Agora processar cada TRT/grau
 * for (const combo of combinations) {
 *   const key = `${combo.tribunal}:${combo.grau}`;
 *   const credential = credentialsMap.get(key);
 *   
 *   if (credential) {
 *     // Processar captura com esta credencial
 *     // getCredentialByTribunalAndGrau() vai usar o cache automaticamente
 *   }
 * }
 */
export async function getCredentialsBatch(
  advogadoId: number,
  combinations: Array<{ tribunal: CodigoTRT; grau: GrauTRT }>
): Promise<Map<string, CredenciaisTRT | null>> {
  const supabase = createServiceClient();
  const result = new Map<string, CredenciaisTRT | null>();

  // Extrair tribunais e graus únicos para a query otimizada
  const tribunais = [...new Set(combinations.map((c) => c.tribunal))];
  const graus = [...new Set(combinations.map((c) => c.grau))];

  // Buscar todas as credenciais de uma vez usando .in() para múltiplos valores
  const { data: credenciais, error } = await supabase
    .from('credenciais')
    .select(`
      id,
      advogado_id,
      senha,
      tribunal,
      grau,
      active,
      advogados (
        id,
        cpf,
        nome_completo
      )
    `)
    .eq('advogado_id', advogadoId)
    .in('tribunal', tribunais)
    .in('grau', graus)
    .eq('active', true);

  if (error) {
    console.error('Erro ao buscar credenciais em lote:', error);
    // Retornar null para todas as combinações em caso de erro
    combinations.forEach((c) => {
      const key = `${c.tribunal}:${c.grau}`;
      result.set(key, null);
    });
    return result;
  }

  // Processar resultados e popular cache
  combinations.forEach((combination) => {
    const { tribunal, grau } = combination;
    const credencial = credenciais?.find(
      (c) => c.tribunal === tribunal && c.grau === grau
    );

    if (credencial) {
      // Processar relacionamento advogados (pode ser objeto único ou array)
      const advogadoRaw = credencial.advogados;
      const advogado = Array.isArray(advogadoRaw)
        ? (advogadoRaw[0] as { cpf: string; nome_completo: string } | undefined)
        : (advogadoRaw as { cpf: string; nome_completo: string } | null);

      if (advogado?.cpf) {
        const credential: CredenciaisTRT = {
          cpf: advogado.cpf,
          senha: credencial.senha,
        };

        // Salvar no cache para uso futuro
        setCache(advogadoId, tribunal, grau, credential);

        const key = `${tribunal}:${grau}`;
        result.set(key, credential);
      } else {
        const key = `${tribunal}:${grau}`;
        result.set(key, null);
      }
    } else {
      // Credencial não encontrada para esta combinação
      const key = `${tribunal}:${grau}`;
      result.set(key, null);
    }
  });

  return result;
}

/**
 * Função: clearCredentialCache
 * 
 * PROPÓSITO:
 * Limpa todo o cache de credenciais.
 * 
 * Útil para:
 * - Testes unitários
 * - Quando credenciais são atualizadas e você quer forçar refresh
 * - Limpeza manual do cache
 * 
 * RETORNO:
 * void
 * 
 * EXEMPLO DE USO:
 * 
 * // Limpar cache após atualizar credenciais
 * await updateCredential(...);
 * clearCredentialCache();
 */
export function clearCredentialCache(): void {
  credentialCache.clear();
}

/**
 * Função: cleanExpiredCache
 * 
 * PROPÓSITO:
 * Remove credenciais expiradas do cache.
 * 
 * Esta função pode ser chamada periodicamente (ex: a cada minuto) para limpar
 * credenciais que expiraram, liberando memória.
 * 
 * RETORNO:
 * number - Quantidade de itens removidos do cache
 * 
 * COMPORTAMENTO:
 * Itera sobre todos os itens do cache e remove aqueles que expiraram.
 * 
 * EXEMPLO DE USO:
 * 
 * // Limpar cache expirado periodicamente
 * setInterval(() => {
 *   const removed = cleanExpiredCache();
 *   if (removed > 0) {
 *     console.log(`Removidos ${removed} itens expirados do cache`);
 *   }
 * }, 60000); // A cada 1 minuto
 */
export function cleanExpiredCache(): number {
  const now = Date.now();
  let removed = 0;

  for (const [key, item] of credentialCache.entries()) {
    if (!isCacheValid(item)) {
      credentialCache.delete(key);
      removed++;
    }
  }

  return removed;
}

/**
 * Função: getCacheStats
 * 
 * PROPÓSITO:
 * Retorna estatísticas do cache para monitoramento.
 * 
 * RETORNO:
 * { total: number; valid: number; expired: number }
 * 
 * EXEMPLO DE USO:
 * 
 * const stats = getCacheStats();
 * console.log(`Cache: ${stats.valid}/${stats.total} válidos`);
 */
export function getCacheStats(): {
  total: number;
  valid: number;
  expired: number;
} {
  const total = credentialCache.size;
  let valid = 0;
  let expired = 0;

  for (const item of credentialCache.values()) {
    if (isCacheValid(item)) {
      valid++;
    } else {
      expired++;
    }
  }

  return { total, valid, expired };
}

