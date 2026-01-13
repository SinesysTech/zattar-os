/**
 * CHATWOOT SERVICE - Lógica de Sincronização
 *
 * Serviço para sincronização entre partes locais e contatos do Chatwoot.
 */

import { Result, ok, err, appError, AppError } from '@/types';
import {
  createContact,
  updateContact,
  getContact,
  deleteContact,
  findContactByIdentifier,
  getChatwootClient,
  isChatwootConfigured,
  applyParteLabels,
  ChatwootContact,
  CreateContactRequest,
  UpdateContactRequest,
  ChatwootError,
} from '@/lib/chatwoot';
import {
  findMapeamentoPorEntidade,
  findMapeamentoPorChatwootId,
  criarMapeamento,
  atualizarMapeamentoPorEntidade,
  removerMapeamentoPorEntidade,
  upsertMapeamentoPorEntidade,
} from './repository';
import {
  TipoEntidadeChatwoot,
  PartesChatwoot,
  SincronizacaoResult,
  formatarTelefoneInternacional,
  normalizarDocumentoParaIdentifier,
  obterPrimeiroEmail,
} from './domain';

// =============================================================================
// Tipos para Partes
// =============================================================================

interface ParteBase {
  id: number;
  nome: string;
  nome_social_fantasia?: string | null;
  tipo_pessoa: 'pf' | 'pj';
  emails?: string[] | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
}

interface PartePF extends ParteBase {
  tipo_pessoa: 'pf';
  cpf: string;
}

interface PartePJ extends ParteBase {
  tipo_pessoa: 'pj';
  cnpj: string;
}

type Parte = PartePF | PartePJ;

interface TerceiroInfo {
  tipo_parte?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Converte ChatwootError para AppError
 */
function chatwootErrorToAppError(error: ChatwootError): AppError {
  return appError(
    'EXTERNAL_SERVICE_ERROR',
    error.message,
    { statusCode: error.statusCode, apiError: error.apiError }
  );
}

// =============================================================================
// Conversão Parte -> Contato Chatwoot
// =============================================================================

/**
 * Converte dados de uma parte local para formato de criação de contato Chatwoot
 */
export function parteParaChatwootContact(
  parte: Parte,
  tipoEntidade: TipoEntidadeChatwoot,
  inboxId?: number
): CreateContactRequest {
  const telefone =
    formatarTelefoneInternacional(parte.ddd_celular, parte.numero_celular) ??
    formatarTelefoneInternacional(parte.ddd_comercial, parte.numero_comercial);

  const identifier =
    parte.tipo_pessoa === 'pf'
      ? normalizarDocumentoParaIdentifier((parte as PartePF).cpf)
      : normalizarDocumentoParaIdentifier((parte as PartePJ).cnpj);

  return {
    inbox_id: inboxId ?? 0, // Será substituído pelo default se 0
    name: parte.nome,
    email: obterPrimeiroEmail(parte.emails) ?? undefined,
    phone_number: telefone ?? undefined,
    identifier: identifier ?? undefined,
    custom_attributes: {
      tipo_pessoa: parte.tipo_pessoa,
      tipo_entidade: tipoEntidade,
      sistema_origem: 'zattar',
      entidade_id: parte.id,
      ...(parte.nome_social_fantasia && {
        nome_fantasia: parte.nome_social_fantasia,
      }),
    },
  };
}

/**
 * Converte dados de uma parte local para formato de atualização de contato Chatwoot
 */
export function parteParaChatwootUpdate(
  parte: Parte,
  tipoEntidade: TipoEntidadeChatwoot
): UpdateContactRequest {
  const telefone =
    formatarTelefoneInternacional(parte.ddd_celular, parte.numero_celular) ??
    formatarTelefoneInternacional(parte.ddd_comercial, parte.numero_comercial);

  const identifier =
    parte.tipo_pessoa === 'pf'
      ? normalizarDocumentoParaIdentifier((parte as PartePF).cpf)
      : normalizarDocumentoParaIdentifier((parte as PartePJ).cnpj);

  return {
    name: parte.nome,
    email: obterPrimeiroEmail(parte.emails) ?? undefined,
    phone_number: telefone ?? undefined,
    identifier: identifier ?? undefined,
    custom_attributes: {
      tipo_pessoa: parte.tipo_pessoa,
      tipo_entidade: tipoEntidade,
      sistema_origem: 'zattar',
      entidade_id: parte.id,
      ...(parte.nome_social_fantasia && {
        nome_fantasia: parte.nome_social_fantasia,
      }),
    },
  };
}

/**
 * Cria objeto de dados sincronizados para salvar no banco
 */
function criarDadosSincronizados(
  parte: Parte,
  tipoEntidade: TipoEntidadeChatwoot,
  labels: string[]
): Record<string, unknown> {
  const telefone =
    formatarTelefoneInternacional(parte.ddd_celular, parte.numero_celular) ??
    formatarTelefoneInternacional(parte.ddd_comercial, parte.numero_comercial);

  const identifier =
    parte.tipo_pessoa === 'pf'
      ? normalizarDocumentoParaIdentifier((parte as PartePF).cpf)
      : normalizarDocumentoParaIdentifier((parte as PartePJ).cnpj);

  return {
    nome: parte.nome,
    email: obterPrimeiroEmail(parte.emails),
    telefone,
    identifier,
    tipo_pessoa: parte.tipo_pessoa,
    tipo_entidade: tipoEntidade,
    labels,
    custom_attributes: {
      tipo_pessoa: parte.tipo_pessoa,
      tipo_entidade: tipoEntidade,
      sistema_origem: 'zattar',
      entidade_id: parte.id,
    },
    sincronizado_em: new Date().toISOString(),
  };
}

// =============================================================================
// Sincronização
// =============================================================================

/**
 * Sincroniza uma parte local com o Chatwoot
 * Se já existe mapeamento, atualiza o contato
 * Se não existe, cria novo contato e mapeamento
 */
export async function sincronizarParteComChatwoot(
  parte: Parte,
  tipoEntidade: TipoEntidadeChatwoot,
  terceiroInfo?: TerceiroInfo
): Promise<Result<SincronizacaoResult>> {
  // Verifica se Chatwoot está configurado
  if (!isChatwootConfigured()) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  try {
    const client = getChatwootClient();
    const accountId = client.getAccountId();

    // Verifica se já existe mapeamento
    const mapeamentoExistente = await findMapeamentoPorEntidade(
      tipoEntidade,
      parte.id
    );

    if (!mapeamentoExistente.success) {
      return err(mapeamentoExistente.error);
    }

    let chatwootContactId: number;
    let criado = false;

    if (mapeamentoExistente.data) {
      // Atualiza contato existente
      const updateData = parteParaChatwootUpdate(parte, tipoEntidade);
      const updateResult = await updateContact(
        mapeamentoExistente.data.chatwoot_contact_id,
        updateData,
        client
      );

      if (!updateResult.success) {
        // Marca como não sincronizado
        await atualizarMapeamentoPorEntidade(tipoEntidade, parte.id, {
          sincronizado: false,
          erro_sincronizacao: updateResult.error.message,
        });

        return ok({
          sucesso: false,
          mapeamento: mapeamentoExistente.data,
          chatwoot_contact_id: mapeamentoExistente.data.chatwoot_contact_id,
          criado: false,
          erro: updateResult.error.message,
        });
      }

      chatwootContactId = updateResult.data.id;
    } else {
      // Verifica se já existe contato com mesmo identifier
      const identifier =
        parte.tipo_pessoa === 'pf'
          ? normalizarDocumentoParaIdentifier((parte as PartePF).cpf)
          : normalizarDocumentoParaIdentifier((parte as PartePJ).cnpj);

      if (identifier) {
        const contatoExistente = await findContactByIdentifier(identifier, client);

        if (contatoExistente.success && contatoExistente.data) {
          // Contato já existe no Chatwoot - cria apenas o mapeamento
          chatwootContactId = contatoExistente.data.id;

          // Atualiza dados do contato existente
          const updateData = parteParaChatwootUpdate(parte, tipoEntidade);
          await updateContact(chatwootContactId, updateData, client);
        } else {
          // Cria novo contato
          const createData = parteParaChatwootContact(parte, tipoEntidade);
          const createResult = await createContact(createData, client);

          if (!createResult.success) {
            return ok({
              sucesso: false,
              mapeamento: null,
              chatwoot_contact_id: null,
              criado: false,
              erro: createResult.error.message,
            });
          }

          chatwootContactId = createResult.data.id;
          criado = true;
        }
      } else {
        // Sem identifier, cria novo contato
        const createData = parteParaChatwootContact(parte, tipoEntidade);
        const createResult = await createContact(createData, client);

        if (!createResult.success) {
          return ok({
            sucesso: false,
            mapeamento: null,
            chatwoot_contact_id: null,
            criado: false,
            erro: createResult.error.message,
          });
        }

        chatwootContactId = createResult.data.id;
        criado = true;
      }
    }

    // Aplica labels
    const labelsResult = await applyParteLabels(
      chatwootContactId,
      tipoEntidade,
      parte.tipo_pessoa,
      terceiroInfo?.tipo_parte,
      client
    );

    const labels = labelsResult.success ? labelsResult.data : [];

    // Cria/atualiza mapeamento
    const dadosSincronizados = criarDadosSincronizados(parte, tipoEntidade, labels);

    const mapeamentoResult = await upsertMapeamentoPorEntidade({
      tipo_entidade: tipoEntidade,
      entidade_id: parte.id,
      chatwoot_contact_id: chatwootContactId,
      chatwoot_account_id: accountId,
      dados_sincronizados: dadosSincronizados,
    });

    if (!mapeamentoResult.success) {
      return err(mapeamentoResult.error);
    }

    return ok({
      sucesso: true,
      mapeamento: mapeamentoResult.data.mapeamento,
      chatwoot_contact_id: chatwootContactId,
      criado,
    });
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao sincronizar parte com Chatwoot',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Vinculação Manual
// =============================================================================

/**
 * Vincula uma parte local a um contato existente no Chatwoot
 */
export async function vincularParteAContato(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number,
  chatwootContactId: number
): Promise<Result<PartesChatwoot>> {
  // Verifica se Chatwoot está configurado
  if (!isChatwootConfigured()) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  try {
    const client = getChatwootClient();
    const accountId = client.getAccountId();

    // Verifica se contato existe no Chatwoot
    const contatoResult = await getContact(chatwootContactId, client);

    if (!contatoResult.success) {
      return err(
        appError('NOT_FOUND', `Contato ${chatwootContactId} não encontrado no Chatwoot`)
      );
    }

    // Verifica se já existe mapeamento para esta entidade
    const mapeamentoExistente = await findMapeamentoPorEntidade(
      tipoEntidade,
      entidadeId
    );

    if (mapeamentoExistente.success && mapeamentoExistente.data) {
      return err(
        appError(
          'CONFLICT',
          `Entidade ${tipoEntidade}:${entidadeId} já está vinculada ao contato ${mapeamentoExistente.data.chatwoot_contact_id}`
        )
      );
    }

    // Verifica se contato já está vinculado a outra parte
    const contatoMapeado = await findMapeamentoPorChatwootId(
      chatwootContactId,
      accountId
    );

    if (contatoMapeado.success && contatoMapeado.data) {
      return err(
        appError(
          'CONFLICT',
          `Contato ${chatwootContactId} já está vinculado a ${contatoMapeado.data.tipo_entidade}:${contatoMapeado.data.entidade_id}`
        )
      );
    }

    // Cria mapeamento
    const mapeamentoResult = await criarMapeamento({
      tipo_entidade: tipoEntidade,
      entidade_id: entidadeId,
      chatwoot_contact_id: chatwootContactId,
      chatwoot_account_id: accountId,
      dados_sincronizados: {
        vinculado_manualmente: true,
        vinculado_em: new Date().toISOString(),
      },
    });

    return mapeamentoResult;
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao vincular parte a contato',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Desvinculação
// =============================================================================

/**
 * Remove vínculo entre parte e contato (não exclui o contato do Chatwoot)
 */
export async function desvincularParte(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number
): Promise<Result<void>> {
  return removerMapeamentoPorEntidade(tipoEntidade, entidadeId);
}

/**
 * Remove contato do Chatwoot e mapeamento local
 */
export async function excluirContatoEMapeamento(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number
): Promise<Result<void>> {
  // Verifica se Chatwoot está configurado
  if (!isChatwootConfigured()) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  try {
    const client = getChatwootClient();

    // Busca mapeamento
    const mapeamento = await findMapeamentoPorEntidade(tipoEntidade, entidadeId);

    if (!mapeamento.success) {
      return err(mapeamento.error);
    }

    if (!mapeamento.data) {
      return err(appError('NOT_FOUND', 'Mapeamento não encontrado'));
    }

    // Exclui contato do Chatwoot
    const deleteResult = await deleteContact(
      mapeamento.data.chatwoot_contact_id,
      client
    );

    if (!deleteResult.success) {
      // Se contato não existe mais, apenas remove mapeamento
      if (deleteResult.error.statusCode !== 404) {
        return err(chatwootErrorToAppError(deleteResult.error));
      }
    }

    // Remove mapeamento local
    return removerMapeamentoPorEntidade(tipoEntidade, entidadeId);
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao excluir contato',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Consultas
// =============================================================================

/**
 * Busca contato Chatwoot vinculado a uma parte
 */
export async function buscarContatoVinculado(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number
): Promise<Result<ChatwootContact | null>> {
  // Verifica se Chatwoot está configurado
  if (!isChatwootConfigured()) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  try {
    const client = getChatwootClient();

    // Busca mapeamento
    const mapeamento = await findMapeamentoPorEntidade(tipoEntidade, entidadeId);

    if (!mapeamento.success) {
      return err(mapeamento.error);
    }

    if (!mapeamento.data) {
      return ok(null);
    }

    // Busca contato no Chatwoot
    const contatoResult = await getContact(
      mapeamento.data.chatwoot_contact_id,
      client
    );

    if (!contatoResult.success) {
      // Se contato não existe mais, retorna null
      if (contatoResult.error.statusCode === 404) {
        return ok(null);
      }
      return err(chatwootErrorToAppError(contatoResult.error));
    }

    return ok(contatoResult.data);
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao buscar contato vinculado',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Verifica se uma parte está vinculada ao Chatwoot
 */
export async function parteEstaVinculada(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number
): Promise<Result<boolean>> {
  const mapeamento = await findMapeamentoPorEntidade(tipoEntidade, entidadeId);

  if (!mapeamento.success) {
    return err(mapeamento.error);
  }

  return ok(mapeamento.data !== null);
}
