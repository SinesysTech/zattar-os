/**
 * Configurações de tribunais - agora buscadas do banco de dados
 * Implementa cache em memória com TTL de 5 minutos
 */

import type {
  CodigoTRT,
  GrauTRT,
  ConfigTRT,
  TipoAcessoTribunal,
  TribunalConfigDb,
} from '@/backend/types/captura/trt-types';
import {
  getConfigByTRTAndGrau,
  listAllConfigs,
} from '../persistence/tribunal-config-persistence.service';

/**
 * Cache em memória para configurações de tribunais
 * Estrutura: Map<chave, { config, timestamp }>
 * Chave: `${codigo}:${tipoAcesso}`
 */
interface CachedConfig {
  config: ConfigTRT;
  timestamp: number;
}

const configCache = new Map<string, CachedConfig>();

/**
 * TTL do cache em milissegundos (5 minutos)
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Gera chave para o cache
 */
function getCacheKey(codigo: string, grau: GrauTRT): string {
  return `${codigo}:${grau}`;
}

/**
 * Verifica se um item do cache ainda é válido
 */
function isCacheValid(cached: CachedConfig): boolean {
  return Date.now() - cached.timestamp < CACHE_TTL_MS;
}

/**
 * Mapeia tipo_acesso_tribunal para grau_tribunal
 * - primeiro_grau → primeiro_grau
 * - segundo_grau → segundo_grau
 * - unificado → primeiro_grau (padrão, sistema indica dentro)
 * - unico → tribunal_superior
 */
function mapTipoAcessoToGrau(tipoAcesso: TipoAcessoTribunal): GrauTRT {
  switch (tipoAcesso) {
    case 'primeiro_grau':
      return 'primeiro_grau';
    case 'segundo_grau':
      return 'segundo_grau';
    case 'unificado':
      return 'primeiro_grau'; // Padrão, sistema indica dentro qual é
    case 'unico':
      return 'tribunal_superior';
    default:
      return 'primeiro_grau';
  }
}

/**
 * Converte TribunalConfigDb do banco para ConfigTRT usado no código
 */
function mapDbToConfig(dbConfig: TribunalConfigDb): ConfigTRT {
  return {
    codigo: dbConfig.tribunal_codigo as CodigoTRT,
    nome: dbConfig.tribunal_nome,
    grau: mapTipoAcessoToGrau(dbConfig.tipo_acesso),
    tipoAcesso: dbConfig.tipo_acesso,
    loginUrl: dbConfig.url_login_seam,
    baseUrl: dbConfig.url_base,
    apiUrl: dbConfig.url_api,
    customTimeouts: dbConfig.custom_timeouts ?? undefined,
  };
}

/**
 * Busca a configuração de um tribunal específico e grau do banco de dados
 * Implementa cache em memória com TTL de 5 minutos
 *
 * @param trtCodigo - Código do TRT (ex: 'TRT1', 'TRT2')
 * @param grau - Grau do processo ('primeiro_grau', 'segundo_grau', 'tribunal_superior')
 * @returns Configuração do tribunal
 * @throws Error se configuração não encontrada
 *
 * @example
 * const config = await getTribunalConfig('TRT1', 'primeiro_grau');
 * // Retorna: { codigo: 'TRT1', nome: 'TRT da 1ª Região', grau: 'primeiro_grau', ... }
 */
export async function getTribunalConfig(
  trtCodigo: CodigoTRT,
  grau: GrauTRT,
): Promise<ConfigTRT> {
  const cacheKey = getCacheKey(trtCodigo, grau);

  // Verificar cache
  const cached = configCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.config;
  }

  // Buscar do banco
  const dbConfig = await getConfigByTRTAndGrau(trtCodigo, grau);

  if (!dbConfig) {
    throw new Error(
      `Configuração não encontrada para tribunal ${trtCodigo} (${grau}). ` +
        `Verifique se existe registro na tabela tribunais_config.`,
    );
  }

  // Mapear para ConfigTRT
  const config = mapDbToConfig(dbConfig);

  // Cachear
  configCache.set(cacheKey, {
    config,
    timestamp: Date.now(),
  });

  return config;
}

/**
 * Valida se um código de TRT existe na base de dados
 * Busca todas as configs em cache ou no banco
 */
export async function isValidTribunalCode(codigo: string): Promise<boolean> {
  try {
    const allConfigs = await listAllConfigs();
    return allConfigs.some((c) => c.tribunal_codigo === codigo);
  } catch (error) {
    console.error(`Erro ao validar código de tribunal ${codigo}:`, error);
    return false;
  }
}

/**
 * Lista todos os códigos de tribunais disponíveis
 * Busca todas as configs e retorna códigos únicos
 */
export async function listTribunalCodes(): Promise<string[]> {
  try {
    const allConfigs = await listAllConfigs();
    const uniqueCodes = new Set(allConfigs.map((c) => c.tribunal_codigo));
    return Array.from(uniqueCodes).sort();
  } catch (error) {
    console.error('Erro ao listar códigos de tribunais:', error);
    return [];
  }
}

/**
 * Limpa o cache de configurações
 * @param trtCodigo - Código do TRT (opcional, limpa tudo se não fornecido)
 * @param grau - Grau (opcional, limpa todos os graus do TRT se não fornecido)
 *
 * @example
 * // Limpar todo o cache
 * clearConfigCache();
 *
 * // Limpar cache de um TRT específico (todos os graus)
 * clearConfigCache('TRT1');
 *
 * // Limpar cache de um TRT e grau específicos
 * clearConfigCache('TRT1', 'primeiro_grau');
 */
export function clearConfigCache(
  trtCodigo?: CodigoTRT,
  grau?: GrauTRT,
): void {
  if (!trtCodigo) {
    // Limpar todo o cache
    configCache.clear();
    console.log('Cache de configurações de tribunais limpo completamente');
    return;
  }

  if (!grau) {
    // Limpar todas as entradas do TRT específico
    const keys = Array.from(configCache.keys());
    const keysToDelete = keys.filter((key) => key.startsWith(`${trtCodigo}:`));
    keysToDelete.forEach((key) => configCache.delete(key));
    console.log(`Cache limpo para tribunal ${trtCodigo} (todos os graus)`);
    return;
  }

  // Limpar entrada específica
  const cacheKey = getCacheKey(trtCodigo, grau);
  configCache.delete(cacheKey);
  console.log(`Cache limpo para tribunal ${trtCodigo} (${grau})`);
}
