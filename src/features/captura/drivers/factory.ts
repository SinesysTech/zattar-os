/**
 * DRIVER FACTORY - Factory para Instanciar Drivers
 *
 * Consulta tribunais_config.sistema para determinar qual driver instanciar.
 * Esta factory permite adicionar novos tribunais sem modificar o orquestrador.
 * 
 * IMPORTANTE: A função de acesso a dados buscarConfigTribunal foi movida para
 * o repositório (src/core/captura/repository.ts) para manter clareza de responsabilidades.
 */

import { PjeTrtDriver } from './pje/trt-driver';
import { buscarConfigTribunal } from '../repository';
import type { JudicialDriver } from './judicial-driver.interface';
import type { SistemaJudicialSuportado } from '../domain';

/**
 * Verifica se um código de tribunal é um TRT (Tribunal Regional do Trabalho)
 * 
 * TRTs são identificados por códigos que começam com "TRT" seguido de número (TRT1-TRT24)
 * 
 * @param codigo - Código do tribunal (ex: 'TRT1', 'TJSP', 'TST')
 * @returns true se for um TRT
 */
function isTRT(codigo: string): boolean {
  const codigoUpper = codigo.toUpperCase();
  // Verificar se começa com "TRT" seguido de 1-2 dígitos
  return /^TRT\d{1,2}$/.test(codigoUpper);
}

/**
 * Obtém o driver apropriado para um tribunal
 *
 * Consulta tribunais_config.sistema e retorna a instância do driver correto.
 * Para sistemas PJE, verifica se o tribunal é um TRT antes de retornar PjeTrtDriver.
 *
 * IMPORTANTE: PjeTrtDriver é específico para TRTs. Outros tribunais PJE (TJ, TRF, etc)
 * ainda não são suportados e retornarão erro explícito.
 *
 * @param tribunalId - ID do tribunal na tabela tribunais
 * @returns Instância do driver correspondente ao sistema do tribunal
 * @throws Error se o tribunal não for encontrado, sistema não for suportado, ou
 *         se for um tribunal PJE não-TRT (ainda não implementado)
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
      // Verificar se é um TRT antes de retornar PjeTrtDriver
      // PjeTrtDriver é específico para TRTs (TRT1-TRT24)
      const tribunalCodigo = config.tribunalCodigo || tribunalId;
      
      if (isTRT(tribunalCodigo)) {
        return new PjeTrtDriver();
      } else {
        // Para outros tribunais PJE (TJ, TRF, etc), lançar erro explícito
        throw new Error(
          `Driver PJE para tribunal ${tribunalCodigo} ainda não implementado. ` +
          `PjeTrtDriver é específico para TRTs. Para adicionar suporte a outros tribunais PJE, ` +
          `é necessário implementar um driver específico.`
        );
      }

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
