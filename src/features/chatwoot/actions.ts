'use server';

/**
 * CHATWOOT ACTIONS - Server Actions para sincronização
 *
 * Actions para sincronização em lote de partes com Chatwoot.
 */

import { Result, ok, err, appError } from '@/types';
import { isChatwootConfigured } from '@/lib/chatwoot';
import { sincronizarParteComChatwoot } from './service';
import { findAllClientes, findClienteById } from '@/features/partes/repositories/clientes-repository';

// =============================================================================
// Tipos
// =============================================================================

export interface SincronizarClientesParams {
  /** Limite de clientes por página (padrão: 100) */
  limite?: number;
  /** Página inicial (padrão: 1) */
  paginaInicial?: number;
  /** Página final (padrão: todas) */
  paginaFinal?: number;
  /** Se true, sincroniza apenas clientes ativos */
  apenasAtivos?: boolean;
  /** Delay em ms entre cada sincronização (padrão: 100ms) */
  delayEntreSync?: number;
  /** Se true, para no primeiro erro. Se false, continua e reporta erros no final */
  pararNoErro?: boolean;
}

export interface SincronizarClientesResult {
  total_processados: number;
  total_sucesso: number;
  total_erros: number;
  clientes_criados: number;
  clientes_atualizados: number;
  erros: Array<{ cliente_id: number; nome: string; erro: string }>;
}

// =============================================================================
// Helpers
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Sincroniza todos os clientes com Chatwoot em lote
 *
 * @example
 * // Sincronizar todos os clientes ativos
 * const result = await sincronizarTodosClientes({ apenasAtivos: true });
 *
 * // Sincronizar primeiros 50 clientes
 * const result = await sincronizarTodosClientes({ limite: 50, paginaFinal: 1 });
 */
export async function sincronizarTodosClientes(
  params: SincronizarClientesParams = {}
): Promise<Result<SincronizarClientesResult>> {
  // Verifica configuração
  if (!isChatwootConfigured()) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  const {
    limite = 100,
    paginaInicial = 1,
    paginaFinal,
    apenasAtivos = false,
    delayEntreSync = 100,
    pararNoErro = false,
  } = params;

  const resultado: SincronizarClientesResult = {
    total_processados: 0,
    total_sucesso: 0,
    total_erros: 0,
    clientes_criados: 0,
    clientes_atualizados: 0,
    erros: [],
  };

  let paginaAtual = paginaInicial;
  let continuar = true;

  console.log('[Chatwoot Batch Sync] Iniciando sincronização em lote...');

  while (continuar) {
    // Busca página de clientes
    const clientesResult = await findAllClientes({
      pagina: paginaAtual,
      limite,
      ativo: apenasAtivos ? true : undefined,
      ordenar_por: 'created_at',
      ordem: 'asc',
    });

    if (!clientesResult.success) {
      console.error('[Chatwoot Batch Sync] Erro ao buscar clientes:', clientesResult.error);
      return err(clientesResult.error);
    }

    const { data: clientes, pagination } = clientesResult.data;

    if (clientes.length === 0) {
      console.log('[Chatwoot Batch Sync] Nenhum cliente encontrado na página', paginaAtual);
      break;
    }

    console.log(
      `[Chatwoot Batch Sync] Processando página ${paginaAtual}/${pagination.totalPages} (${clientes.length} clientes)`
    );

    // Processa cada cliente
    for (const cliente of clientes) {
      resultado.total_processados++;

      try {
        const syncResult = await sincronizarParteComChatwoot(
          cliente as Parameters<typeof sincronizarParteComChatwoot>[0],
          'cliente'
        );

        if (syncResult.success && syncResult.data.sucesso) {
          resultado.total_sucesso++;
          if (syncResult.data.criado) {
            resultado.clientes_criados++;
          } else {
            resultado.clientes_atualizados++;
          }
        } else {
          resultado.total_erros++;
          const erro = syncResult.success ? syncResult.data.erro : syncResult.error.message;
          resultado.erros.push({
            cliente_id: cliente.id,
            nome: cliente.nome,
            erro: erro ?? 'Erro desconhecido',
          });

          if (pararNoErro) {
            console.error(
              `[Chatwoot Batch Sync] Erro no cliente ${cliente.id}, parando...`,
              erro
            );
            continuar = false;
            break;
          }
        }
      } catch (error) {
        resultado.total_erros++;
        resultado.erros.push({
          cliente_id: cliente.id,
          nome: cliente.nome,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });

        if (pararNoErro) {
          console.error(
            `[Chatwoot Batch Sync] Exceção no cliente ${cliente.id}, parando...`,
            error
          );
          continuar = false;
          break;
        }
      }

      // Delay entre syncs para não sobrecarregar a API
      if (delayEntreSync > 0) {
        await sleep(delayEntreSync);
      }
    }

    // Verifica se deve continuar para próxima página
    if (!continuar) break;

    if (paginaFinal && paginaAtual >= paginaFinal) {
      console.log('[Chatwoot Batch Sync] Página final atingida:', paginaFinal);
      break;
    }

    if (!pagination.hasMore) {
      console.log('[Chatwoot Batch Sync] Última página processada');
      break;
    }

    paginaAtual++;
  }

  console.log('[Chatwoot Batch Sync] Sincronização concluída:', resultado);

  return ok(resultado);
}

/**
 * Sincroniza um cliente específico com Chatwoot
 */
export async function sincronizarCliente(
  clienteId: number
): Promise<Result<{ chatwoot_contact_id: number | null; criado: boolean }>> {
  // Verifica configuração
  if (!isChatwootConfigured()) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  // Busca cliente
  const clienteResult = await findClienteById(clienteId);

  if (!clienteResult.success) {
    return err(clienteResult.error);
  }

  if (!clienteResult.data) {
    return err(appError('NOT_FOUND', `Cliente ${clienteId} não encontrado`));
  }

  // Sincroniza
  const syncResult = await sincronizarParteComChatwoot(
    clienteResult.data as Parameters<typeof sincronizarParteComChatwoot>[0],
    'cliente'
  );

  if (!syncResult.success) {
    return err(syncResult.error);
  }

  if (!syncResult.data.sucesso) {
    return err(
      appError('EXTERNAL_SERVICE_ERROR', syncResult.data.erro ?? 'Falha na sincronização')
    );
  }

  return ok({
    chatwoot_contact_id: syncResult.data.chatwoot_contact_id,
    criado: syncResult.data.criado,
  });
}

/**
 * Sincroniza múltiplos clientes por IDs
 */
export async function sincronizarClientesPorIds(
  clienteIds: number[],
  delayEntreSync = 100
): Promise<Result<SincronizarClientesResult>> {
  // Verifica configuração
  if (!isChatwootConfigured()) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  const resultado: SincronizarClientesResult = {
    total_processados: 0,
    total_sucesso: 0,
    total_erros: 0,
    clientes_criados: 0,
    clientes_atualizados: 0,
    erros: [],
  };

  for (const clienteId of clienteIds) {
    resultado.total_processados++;

    const syncResult = await sincronizarCliente(clienteId);

    if (syncResult.success) {
      resultado.total_sucesso++;
      if (syncResult.data.criado) {
        resultado.clientes_criados++;
      } else {
        resultado.clientes_atualizados++;
      }
    } else {
      resultado.total_erros++;
      resultado.erros.push({
        cliente_id: clienteId,
        nome: `ID ${clienteId}`,
        erro: syncResult.error.message,
      });
    }

    if (delayEntreSync > 0 && clienteIds.indexOf(clienteId) < clienteIds.length - 1) {
      await sleep(delayEntreSync);
    }
  }

  return ok(resultado);
}
