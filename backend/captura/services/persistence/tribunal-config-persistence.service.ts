import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  CodigoTRT,
  GrauTRT,
  TipoAcessoTribunal,
  TribunalConfigDb,
} from '@/backend/types/captura/trt-types';

/**
 * Serviço de persistência para configurações de tribunais
 * Busca dados da tabela tribunais_config com JOIN em tribunais
 * Usa service client para bypass de RLS
 */

/**
 * Busca configuração de um tribunal específico por código e tipo de acesso
 * @param codigo - Código do tribunal (ex: 'TRT1', 'TJSP', 'TST')
 * @param tipoAcesso - Tipo de acesso ao tribunal
 * @returns Configuração do tribunal ou null se não encontrada
 */
export const getConfigByTribunalAndTipoAcesso = async (
  codigo: string,
  tipoAcesso: TipoAcessoTribunal,
): Promise<TribunalConfigDb | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tribunais_config')
    .select(
      `
      id,
      sistema,
      tipo_acesso,
      url_base,
      url_login_seam,
      url_api,
      custom_timeouts,
      created_at,
      updated_at,
      tribunal_id,
      tribunais!inner (
        codigo,
        nome
      )
    `,
    )
    .eq('tribunais.codigo', codigo)
    .eq('tipo_acesso', tipoAcesso)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Registro não encontrado
      return null;
    }
    throw new Error(
      `Erro ao buscar configuração do tribunal ${codigo} (${tipoAcesso}): ${error.message}`,
    );
  }

  if (!data || !data.tribunais) {
    return null;
  }

  // Flatten dos dados do JOIN
  const tribunal = Array.isArray(data.tribunais)
    ? data.tribunais[0]
    : data.tribunais;

  // Verificação defensiva: garantir que tribunal existe e tem propriedades necessárias
  if (!tribunal || !tribunal.codigo || !tribunal.nome) {
    console.error(`Erro: dados do tribunal incompletos para ${codigo} (${tipoAcesso})`);
    return null;
  }

  return {
    id: data.id,
    sistema: data.sistema,
    tipo_acesso: data.tipo_acesso as TipoAcessoTribunal,
    url_base: data.url_base,
    url_login_seam: data.url_login_seam,
    url_api: data.url_api,
    custom_timeouts: data.custom_timeouts as any,
    created_at: data.created_at,
    updated_at: data.updated_at,
    tribunal_id: data.tribunal_id,
    tribunal_codigo: tribunal.codigo,
    tribunal_nome: tribunal.nome,
  };
};

/**
 * Busca configuração de um TRT específico por código e grau
 * Mapeia grau_tribunal para tipo_acesso_tribunal automaticamente
 * @param codigoTRT - Código do TRT (ex: 'TRT1')
 * @param grau - Grau do processo ('primeiro_grau', 'segundo_grau', 'tribunal_superior')
 * @returns Configuração do TRT ou null se não encontrada
 */
export const getConfigByTRTAndGrau = async (
  codigoTRT: CodigoTRT,
  grau: GrauTRT,
): Promise<TribunalConfigDb | null> => {
  // Mapear grau_tribunal para tipo_acesso_tribunal
  // Para TRTs, primeiro_grau e segundo_grau são 1:1 com tipo_acesso
  // Para tribunais superiores, usar 'unico'
  let tipoAcesso: TipoAcessoTribunal;

  if (grau === 'tribunal_superior') {
    tipoAcesso = 'unico';
  } else {
    // primeiro_grau ou segundo_grau
    tipoAcesso = grau;
  }

  return getConfigByTribunalAndTipoAcesso(codigoTRT, tipoAcesso);
};

/**
 * Lista todas as configurações de tribunais disponíveis
 * @returns Array de configurações
 */
export const listAllConfigs = async (): Promise<TribunalConfigDb[]> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase.from('tribunais_config').select(
    `
      id,
      sistema,
      tipo_acesso,
      url_base,
      url_login_seam,
      url_api,
      custom_timeouts,
      created_at,
      updated_at,
      tribunal_id,
      tribunais!inner (
        codigo,
        nome
      )
    `,
  );

  if (error) {
    throw new Error(
      `Erro ao listar configurações de tribunais: ${error.message}`,
    );
  }

  if (!data) {
    return [];
  }

  return data
    .map((row: any) => {
      const tribunal = Array.isArray(row.tribunais)
        ? row.tribunais[0]
        : row.tribunais;

      // Verificação defensiva: pular registros com dados incompletos
      if (!tribunal || !tribunal.codigo || !tribunal.nome) {
        console.warn(`Aviso: dados do tribunal incompletos para configuração ${row.id}, pulando...`);
        return null;
      }

      return {
        id: row.id,
        sistema: row.sistema,
        tipo_acesso: row.tipo_acesso as TipoAcessoTribunal,
        url_base: row.url_base,
        url_login_seam: row.url_login_seam,
        url_api: row.url_api,
        custom_timeouts: row.custom_timeouts as any,
        created_at: row.created_at,
        updated_at: row.updated_at,
        tribunal_id: row.tribunal_id,
        tribunal_codigo: tribunal.codigo,
        tribunal_nome: tribunal.nome,
      };
    })
    .filter((config): config is TribunalConfigDb => config !== null);
};

/**
 * Valida se um código de tribunal possui configuração ativa
 * @param codigo - Código do tribunal
 * @returns true se existe configuração
 */
export const isValidTribunalCode = async (
  codigo: string,
): Promise<boolean> => {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from('tribunais_config')
    .select('id', { count: 'exact', head: true })
    .eq('tribunais.codigo', codigo);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
};
