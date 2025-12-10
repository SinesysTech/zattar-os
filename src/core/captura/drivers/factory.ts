/**
 * DRIVER FACTORY - Factory para Instanciar Drivers
 *
 * Consulta tribunais_config.sistema para determinar qual driver instanciar.
 * Esta factory permite adicionar novos tribunais sem modificar o orquestrador.
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { PjeTrtDriver } from './pje/trt-driver';
import type { JudicialDriver } from './judicial-driver.interface';
import type { ConfigTribunal, SistemaJudicialSuportado } from '../domain';

/**
 * Busca configuração do tribunal no banco de dados
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
 * Obtém o driver apropriado para um tribunal
 *
 * Consulta tribunais_config.sistema e retorna a instância do driver correto.
 *
 * @param tribunalId - ID do tribunal na tabela tribunais
 * @returns Instância do driver correspondente ao sistema do tribunal
 * @throws Error se o tribunal não for encontrado ou sistema não for suportado
 */
export async function getDriver(tribunalId: string): Promise<JudicialDriver> {
  // 1. Buscar configuração do tribunal no banco
  const config = await buscarConfigTribunal(tribunalId);

  if (!config) {
    throw new Error(`Tribunal ${tribunalId} não encontrado ou sem configuração`);
  }

  // 2. Validar sistema suportado
  const sistema = config.sistema.toUpperCase() as SistemaJudicialSuportado;

  if (!isSistemaSuportado(sistema)) {
    throw new Error(
      `Sistema ${sistema} não suportado. Sistemas suportados: PJE, ESAJ, EPROC, PROJUDI`
    );
  }

  // 3. Instanciar driver baseado no sistema
  switch (sistema) {
    case 'PJE':
      return new PjeTrtDriver();

    case 'ESAJ':
      throw new Error('Driver ESAJ ainda não implementado');

    case 'EPROC':
      throw new Error('Driver EPROC ainda não implementado');

    case 'PROJUDI':
      throw new Error('Driver PROJUDI ainda não implementado');

    default:
      // Este caso não deve ser atingido devido à validação anterior
      throw new Error(`Sistema ${sistema} não suportado`);
  }
}

/**
 * Valida se um sistema é suportado
 */
function isSistemaSuportado(sistema: string): sistema is SistemaJudicialSuportado {
  return ['PJE', 'ESAJ', 'EPROC', 'PROJUDI'].includes(sistema.toUpperCase());
}
