/**
 * CHATWOOT SERVICE - Lógica de Sincronização
 *
 * Serviço para sincronização entre partes locais e contatos do Chatwoot.
 */

import { Result, ok, err, appError, AppError } from '@/types';
import { createDbClient } from '@/lib/supabase';
import {
  createContact,
  updateContact,
  getContact,
  deleteContact,
  findContactByIdentifier,
  listAllContacts,
  getChatwootClient,
  isChatwootConfigured,
  applyParteLabels,
  getContactConversations,
  getConversationCounts,
  getConversationHistory,
  formatConversationForAI,
  ChatwootContact,
  ChatwootConversation,
  ChatwootMessage,
  ChatwootConversationCounts,
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

interface EnderecoInfo {
  municipio?: string | null;
  estado_sigla?: string | null;
}

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
  /** Endereço opcional (para sincronização com Chatwoot) */
  endereco?: EnderecoInfo | null;
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
// Helpers de Normalização
// =============================================================================

/**
 * Remove acentos de uma string
 */
function removerAcentos(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza nome para o Chatwoot: caixa alta sem acentos
 */
function normalizarNomeParaChatwoot(nome: string): string {
  return removerAcentos(nome).toUpperCase().trim();
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
 *
 * O nome é normalizado para caixa alta sem acentos.
 * Cidade e país são incluídos nos additional_attributes.
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

  // Nome normalizado: caixa alta sem acentos (fonte da verdade: banco local)
  const nomeNormalizado = normalizarNomeParaChatwoot(parte.nome);

  // Cidade do endereço (fonte da verdade: banco local)
  const cidade = parte.endereco?.municipio
    ? removerAcentos(parte.endereco.municipio).toUpperCase()
    : undefined;

  return {
    inbox_id: inboxId ?? 0, // Será substituído pelo default se 0
    name: nomeNormalizado,
    email: obterPrimeiroEmail(parte.emails) ?? undefined,
    phone_number: telefone ?? undefined,
    identifier: identifier ?? undefined,
    additional_attributes: {
      city: cidade,
      country: 'Brazil',
      country_code: 'BR',
    },
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
 *
 * O nome é normalizado para caixa alta sem acentos.
 * Cidade e país são incluídos nos additional_attributes.
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

  // Nome normalizado: caixa alta sem acentos (fonte da verdade: banco local)
  const nomeNormalizado = normalizarNomeParaChatwoot(parte.nome);

  // Cidade do endereço (fonte da verdade: banco local)
  const cidade = parte.endereco?.municipio
    ? removerAcentos(parte.endereco.municipio).toUpperCase()
    : undefined;

  return {
    name: nomeNormalizado,
    email: obterPrimeiroEmail(parte.emails) ?? undefined,
    phone_number: telefone ?? undefined,
    identifier: identifier ?? undefined,
    additional_attributes: {
      city: cidade,
      country: 'Brazil',
      country_code: 'BR',
    },
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

  // Nome normalizado: caixa alta sem acentos
  const nomeNormalizado = normalizarNomeParaChatwoot(parte.nome);

  // Cidade do endereço
  const cidade = parte.endereco?.municipio
    ? removerAcentos(parte.endereco.municipio).toUpperCase()
    : null;

  return {
    nome: nomeNormalizado,
    nome_original: parte.nome,
    email: obterPrimeiroEmail(parte.emails),
    telefone,
    identifier,
    cidade,
    pais: 'Brazil',
    tipo_pessoa: parte.tipo_pessoa,
    tipo_entidade: tipoEntidade,
    labels,
    custom_attributes: {
      tipo_pessoa: parte.tipo_pessoa,
      tipo_entidade: tipoEntidade,
      sistema_origem: 'zattar',
      entidade_id: parte.id,
    },
    additional_attributes: {
      city: cidade,
      country: 'Brazil',
      country_code: 'BR',
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

// =============================================================================
// Sincronização por Telefone (Chatwoot -> App)
// =============================================================================

/**
 * Extrai DDD e número de telefone do formato Chatwoot
 * Formato esperado: +5511999887766 ou variações
 *
 * @returns { ddd: string, numero9: string, numero8: string } | null
 */
export function extrairTelefone(
  telefone: string | null | undefined
): { ddd: string; numero9: string; numero8: string } | null {
  if (!telefone) return null;

  // Remove tudo que não é número
  const numeros = telefone.replace(/\D/g, '');

  // Precisa ter pelo menos 10 dígitos (DDD + 8 dígitos)
  if (numeros.length < 10) return null;

  let telefoneLocal = numeros;

  // Remove código do país se presente (55 para Brasil)
  if (telefoneLocal.startsWith('55') && telefoneLocal.length >= 12) {
    telefoneLocal = telefoneLocal.slice(2);
  }

  // Agora deve ter 10 ou 11 dígitos (DDD + 8 ou 9 dígitos)
  if (telefoneLocal.length < 10 || telefoneLocal.length > 11) return null;

  const ddd = telefoneLocal.slice(0, 2);
  const numero = telefoneLocal.slice(2);

  // Se tem 9 dígitos, é celular com nono dígito
  // Se tem 8 dígitos, pode ser fixo ou celular antigo
  const numero9 = numero.length === 9 ? numero : `9${numero}`;
  const numero8 = numero.length === 9 ? numero.slice(1) : numero;

  return { ddd, numero9, numero8 };
}

/**
 * Resultado da busca por telefone
 */
export interface ParteEncontrada {
  tipo_entidade: TipoEntidadeChatwoot;
  entidade_id: number;
  nome: string;
  telefone_match: string;
}

/**
 * Resultado da sincronização Chatwoot -> App
 */
export interface SincronizarChatwootParaAppResult {
  total_contatos_chatwoot: number;
  contatos_com_telefone: number;
  contatos_vinculados: number;
  contatos_atualizados: number;
  contatos_sem_match: number;
  erros: Array<{ chatwoot_contact_id: number; phone: string; erro: string }>;
  contatos_sem_match_lista: Array<{ chatwoot_contact_id: number; name: string; phone: string }>;
}

/**
 * Busca uma parte por telefone no banco local
 * Pesquisa em clientes, partes_contrarias e terceiros
 *
 * @param ddd - DDD do telefone (2 dígitos)
 * @param numero9 - Número com 9 dígitos
 * @param numero8 - Número com 8 dígitos (últimos 8)
 */
export async function buscarPartePorTelefone(
  ddd: string,
  numero9: string,
  numero8: string
): Promise<Result<ParteEncontrada | null>> {
  const supabase = await createDbClient();

  // Ordem de prioridade: clientes > partes_contrarias > terceiros
  const tabelas: Array<{ tabela: string; tipo: TipoEntidadeChatwoot }> = [
    { tabela: 'clientes', tipo: 'cliente' },
    { tabela: 'partes_contrarias', tipo: 'parte_contraria' },
    { tabela: 'terceiros', tipo: 'terceiro' },
  ];

  for (const { tabela, tipo } of tabelas) {
    // Busca por celular com 9 dígitos
    const { data: match9Cel, error: err9Cel } = await supabase
      .from(tabela)
      .select('id, nome')
      .eq('ddd_celular', ddd)
      .eq('numero_celular', numero9)
      .limit(1)
      .maybeSingle();

    if (err9Cel) {
      console.error(`Erro ao buscar em ${tabela} (celular 9):`, err9Cel);
      continue;
    }

    if (match9Cel) {
      return ok({
        tipo_entidade: tipo,
        entidade_id: match9Cel.id,
        nome: match9Cel.nome,
        telefone_match: `${ddd}${numero9}`,
      });
    }

    // Busca por celular com 8 dígitos
    const { data: match8Cel, error: err8Cel } = await supabase
      .from(tabela)
      .select('id, nome')
      .eq('ddd_celular', ddd)
      .eq('numero_celular', numero8)
      .limit(1)
      .maybeSingle();

    if (err8Cel) {
      console.error(`Erro ao buscar em ${tabela} (celular 8):`, err8Cel);
      continue;
    }

    if (match8Cel) {
      return ok({
        tipo_entidade: tipo,
        entidade_id: match8Cel.id,
        nome: match8Cel.nome,
        telefone_match: `${ddd}${numero8}`,
      });
    }

    // Busca por comercial com 9 dígitos
    const { data: match9Com, error: err9Com } = await supabase
      .from(tabela)
      .select('id, nome')
      .eq('ddd_comercial', ddd)
      .eq('numero_comercial', numero9)
      .limit(1)
      .maybeSingle();

    if (err9Com) {
      console.error(`Erro ao buscar em ${tabela} (comercial 9):`, err9Com);
      continue;
    }

    if (match9Com) {
      return ok({
        tipo_entidade: tipo,
        entidade_id: match9Com.id,
        nome: match9Com.nome,
        telefone_match: `${ddd}${numero9}`,
      });
    }

    // Busca por comercial com 8 dígitos
    const { data: match8Com, error: err8Com } = await supabase
      .from(tabela)
      .select('id, nome')
      .eq('ddd_comercial', ddd)
      .eq('numero_comercial', numero8)
      .limit(1)
      .maybeSingle();

    if (err8Com) {
      console.error(`Erro ao buscar em ${tabela} (comercial 8):`, err8Com);
      continue;
    }

    if (match8Com) {
      return ok({
        tipo_entidade: tipo,
        entidade_id: match8Com.id,
        nome: match8Com.nome,
        telefone_match: `${ddd}${numero8}`,
      });
    }
  }

  // Nenhuma parte encontrada
  return ok(null);
}

/**
 * Sincroniza contatos do Chatwoot para o App
 *
 * Fluxo:
 * 1. Lista todos os contatos do Chatwoot
 * 2. Para cada contato com telefone, busca no banco local
 * 3. Se encontrar, cria/atualiza mapeamento
 *
 * @returns Resultado com estatísticas da sincronização
 */
export async function sincronizarChatwootParaApp(): Promise<
  Result<SincronizarChatwootParaAppResult>
> {
  // Verifica se Chatwoot está configurado
  if (!isChatwootConfigured()) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Chatwoot não está configurado. Defina as variáveis de ambiente.'
      )
    );
  }

  const client = getChatwootClient();
  const accountId = client.getAccountId();

  const result: SincronizarChatwootParaAppResult = {
    total_contatos_chatwoot: 0,
    contatos_com_telefone: 0,
    contatos_vinculados: 0,
    contatos_atualizados: 0,
    contatos_sem_match: 0,
    erros: [],
    contatos_sem_match_lista: [],
  };

  try {
    // Lista todos os contatos do Chatwoot (max 50 pages = ~750 contacts)
    const contatosResult = await listAllContacts(50, client);

    if (!contatosResult.success) {
      return err(chatwootErrorToAppError(contatosResult.error));
    }

    const contatos = contatosResult.data;
    result.total_contatos_chatwoot = contatos.length;

    // Processa cada contato
    for (const contato of contatos) {
      const telefoneInfo = extrairTelefone(contato.phone_number);

      if (!telefoneInfo) {
        // Contato sem telefone válido, pula
        continue;
      }

      result.contatos_com_telefone++;

      // Verifica se já existe mapeamento para este contato
      const mapeamentoExistente = await findMapeamentoPorChatwootId(
        contato.id,
        accountId
      );

      if (mapeamentoExistente.success && mapeamentoExistente.data) {
        // Já está vinculado, atualiza timestamp se necessário
        result.contatos_atualizados++;
        continue;
      }

      // Busca parte por telefone
      const parteResult = await buscarPartePorTelefone(
        telefoneInfo.ddd,
        telefoneInfo.numero9,
        telefoneInfo.numero8
      );

      if (!parteResult.success) {
        result.erros.push({
          chatwoot_contact_id: contato.id,
          phone: contato.phone_number ?? '',
          erro: parteResult.error.message,
        });
        continue;
      }

      if (!parteResult.data) {
        // Não encontrou parte correspondente
        result.contatos_sem_match++;
        result.contatos_sem_match_lista.push({
          chatwoot_contact_id: contato.id,
          name: contato.name ?? '',
          phone: contato.phone_number ?? '',
        });
        continue;
      }

      // Encontrou parte! Cria mapeamento
      const parte = parteResult.data;

      const mapeamentoResult = await upsertMapeamentoPorEntidade({
        tipo_entidade: parte.tipo_entidade,
        entidade_id: parte.entidade_id,
        chatwoot_contact_id: contato.id,
        chatwoot_account_id: accountId,
        dados_sincronizados: {
          vinculado_por_telefone: true,
          telefone_match: parte.telefone_match,
          nome_chatwoot: contato.name,
          nome_local: parte.nome,
          vinculado_em: new Date().toISOString(),
        },
      });

      if (mapeamentoResult.success) {
        result.contatos_vinculados++;
      } else {
        result.erros.push({
          chatwoot_contact_id: contato.id,
          phone: contato.phone_number ?? '',
          erro: mapeamentoResult.error.message,
        });
      }
    }

    return ok(result);
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao sincronizar Chatwoot para App',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Conversas
// =============================================================================

/**
 * Busca conversas de uma parte local (cliente, parte_contraria, terceiro)
 * Primeiro busca o mapeamento, depois busca conversas do contato no Chatwoot
 */
export async function buscarConversasDaParte(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number,
  status?: 'open' | 'resolved' | 'pending' | 'all'
): Promise<Result<ChatwootConversation[]>> {
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

    // Busca mapeamento da parte
    const mapeamento = await findMapeamentoPorEntidade(tipoEntidade, entidadeId);

    if (!mapeamento.success) {
      return err(mapeamento.error);
    }

    if (!mapeamento.data) {
      return ok([]); // Parte não está vinculada ao Chatwoot
    }

    // Busca conversas do contato
    const conversasResult = await getContactConversations(
      mapeamento.data.chatwoot_contact_id,
      status,
      client
    );

    if (!conversasResult.success) {
      return err(chatwootErrorToAppError(conversasResult.error));
    }

    return ok(conversasResult.data);
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao buscar conversas da parte',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca histórico de mensagens de uma conversa específica
 */
export async function buscarHistoricoConversa(
  conversationId: number,
  limite?: number
): Promise<Result<ChatwootMessage[]>> {
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

    const result = await getConversationHistory(conversationId, limite, client);

    if (!result.success) {
      return err(chatwootErrorToAppError(result.error));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao buscar histórico da conversa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca histórico formatado para AI de uma conversa
 */
export async function buscarHistoricoConversaFormatado(
  conversationId: number,
  limite = 50
): Promise<Result<string>> {
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

    const result = await formatConversationForAI(conversationId, limite, client);

    if (!result.success) {
      return err(chatwootErrorToAppError(result.error));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao formatar histórico da conversa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca métricas de conversas (contagens por status)
 */
export async function buscarMetricasConversas(
  inboxId?: number,
  teamId?: number
): Promise<Result<ChatwootConversationCounts>> {
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

    const result = await getConversationCounts(
      { inbox_id: inboxId, team_id: teamId },
      client
    );

    if (!result.success) {
      return err(chatwootErrorToAppError(result.error));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        'Erro ao buscar métricas de conversas',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
