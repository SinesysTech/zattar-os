/**
 * CONTRATOS FEATURE - Repositório de Tipos Configuráveis
 *
 * Repositório genérico para contrato_tipos e contrato_tipos_cobranca.
 * Ambas as tabelas possuem estrutura idêntica, por isso a implementação
 * usa um factory que gera o repositório para cada tabela.
 *
 * CONVENÇÕES:
 * - Funções assíncronas que retornam Result<T>
 * - snake_case no banco → camelCase no domínio
 * - NUNCA fazer validação de negócio aqui (apenas persistência)
 */

import { createDbClient } from '@/lib/supabase';
import { Result, ok, err, appError } from '@/types';
import type {
  ContratoTipo,
  ContratoTipoCobranca,
  CreateContratoTipoInput,
  UpdateContratoTipoInput,
  ListarTiposParams,
} from './types';

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_CONTRATOS = 'contratos';

// =============================================================================
// CONVERSORES
// =============================================================================

/**
 * Converte uma linha do banco (snake_case) para ContratoTipo (camelCase)
 */
function converterParaTipo(data: Record<string, unknown>): ContratoTipo {
  return {
    id: data.id as number,
    nome: data.nome as string,
    slug: data.slug as string,
    descricao: (data.descricao as string | null) ?? null,
    ativo: data.ativo as boolean,
    ordem: (data.ordem as number) ?? 0,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// =============================================================================
// FACTORY DE REPOSITÓRIO
// =============================================================================

/**
 * Cria um repositório CRUD para uma tabela de tipo configurável.
 *
 * @param tableName - Nome da tabela no banco (contrato_tipos ou contrato_tipos_cobranca)
 * @param contratosColumn - Nome da FK na tabela contratos que aponta para esta tabela
 *
 * @example
 * ```typescript
 * export const contratoTiposRepo = createTipoRepository('contrato_tipos', 'tipo_contrato_id');
 * export const contratoTiposCobrancaRepo = createTipoRepository('contrato_tipos_cobranca', 'tipo_cobranca_id');
 * ```
 */
function createTipoRepository(
  tableName: 'contrato_tipos' | 'contrato_tipos_cobranca',
  contratosColumn: 'tipo_contrato_id' | 'tipo_cobranca_id',
) {
  const entityLabel = tableName === 'contrato_tipos' ? 'tipo de contrato' : 'tipo de cobrança';

  /**
   * Lista tipos com filtros opcionais, ordenados por ordem e nome
   */
  async function findAll(
    params: ListarTiposParams = {},
  ): Promise<Result<ContratoTipo[]>> {
    try {
      const db = createDbClient();

      let query = db.from(tableName).select('*');

      if (params.ativo !== undefined) {
        query = query.eq('ativo', params.ativo);
      }

      if (params.search) {
        query = query.ilike('nome', `%${params.search.trim()}%`);
      }

      query = query.order('ordem', { ascending: true }).order('nome', { ascending: true });

      const { data, error } = await query;

      if (error) {
        return err(appError('DATABASE_ERROR', error.message, { code: error.code, tableName }));
      }

      return ok((data || []).map((row) => converterParaTipo(row as Record<string, unknown>)));
    } catch (error) {
      return err(
        appError(
          'DATABASE_ERROR',
          `Erro ao listar ${entityLabel}`,
          { tableName },
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Busca um tipo pelo ID
   */
  async function findById(id: number): Promise<Result<ContratoTipo | null>> {
    try {
      const db = createDbClient();

      const { data, error } = await db
        .from(tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return err(appError('DATABASE_ERROR', error.message, { code: error.code, tableName }));
      }

      if (!data) {
        return ok(null);
      }

      return ok(converterParaTipo(data as Record<string, unknown>));
    } catch (error) {
      return err(
        appError(
          'DATABASE_ERROR',
          `Erro ao buscar ${entityLabel}`,
          { tableName, id },
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Cria um novo tipo
   */
  async function save(
    input: CreateContratoTipoInput,
  ): Promise<Result<ContratoTipo>> {
    try {
      const db = createDbClient();

      const { data, error } = await db
        .from(tableName)
        .insert({
          nome: input.nome.trim(),
          slug: input.slug.trim(),
          descricao: input.descricao?.trim() ?? null,
          ordem: input.ordem ?? 0,
          ativo: true,
        })
        .select()
        .single();

      if (error) {
        // Slug duplicado (unique constraint)
        if (error.code === '23505') {
          return err(
            appError('CONFLICT', `Já existe um ${entityLabel} com este slug`, {
              code: error.code,
              slug: input.slug,
              tableName,
            }),
          );
        }
        return err(appError('DATABASE_ERROR', error.message, { code: error.code, tableName }));
      }

      return ok(converterParaTipo(data as Record<string, unknown>));
    } catch (error) {
      return err(
        appError(
          'DATABASE_ERROR',
          `Erro ao criar ${entityLabel}`,
          { tableName },
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Atualiza um tipo existente
   */
  async function update(
    id: number,
    input: UpdateContratoTipoInput,
  ): Promise<Result<ContratoTipo>> {
    try {
      const db = createDbClient();

      const dadosAtualizacao: Record<string, unknown> = {};

      if (input.nome !== undefined) {
        dadosAtualizacao.nome = input.nome.trim();
      }
      if (input.slug !== undefined) {
        dadosAtualizacao.slug = input.slug.trim();
      }
      if (input.descricao !== undefined) {
        dadosAtualizacao.descricao = input.descricao?.trim() ?? null;
      }
      if (input.ativo !== undefined) {
        dadosAtualizacao.ativo = input.ativo;
      }
      if (input.ordem !== undefined) {
        dadosAtualizacao.ordem = input.ordem;
      }

      const { data, error } = await db
        .from(tableName)
        .update(dadosAtualizacao)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return err(
            appError('NOT_FOUND', `${entityLabel} com ID ${id} não encontrado`, {
              tableName,
              id,
            }),
          );
        }
        // Slug duplicado (unique constraint)
        if (error.code === '23505') {
          return err(
            appError('CONFLICT', `Já existe um ${entityLabel} com este slug`, {
              code: error.code,
              slug: input.slug,
              tableName,
            }),
          );
        }
        return err(appError('DATABASE_ERROR', error.message, { code: error.code, tableName }));
      }

      return ok(converterParaTipo(data as Record<string, unknown>));
    } catch (error) {
      return err(
        appError(
          'DATABASE_ERROR',
          `Erro ao atualizar ${entityLabel}`,
          { tableName, id },
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Remove um tipo pelo ID
   */
  async function remove(id: number): Promise<Result<void>> {
    try {
      const db = createDbClient();

      const { error } = await db.from(tableName).delete().eq('id', id);

      if (error) {
        return err(appError('DATABASE_ERROR', error.message, { code: error.code, tableName }));
      }

      return ok(undefined);
    } catch (error) {
      return err(
        appError(
          'DATABASE_ERROR',
          `Erro ao excluir ${entityLabel}`,
          { tableName, id },
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Conta quantos contratos referenciam este tipo.
   * Usado antes de excluir para garantir integridade referencial.
   */
  async function countContratosUsing(id: number): Promise<Result<number>> {
    try {
      const db = createDbClient();

      const { count, error } = await db
        .from(TABLE_CONTRATOS)
        .select('*', { count: 'exact', head: true })
        .eq(contratosColumn, id);

      if (error) {
        return err(appError('DATABASE_ERROR', error.message, { code: error.code, tableName }));
      }

      return ok(count ?? 0);
    } catch (error) {
      return err(
        appError(
          'DATABASE_ERROR',
          `Erro ao contar contratos usando ${entityLabel}`,
          { tableName, id, contratosColumn },
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  return {
    findAll,
    findById,
    save,
    update,
    remove,
    countContratosUsing,
  };
}

// =============================================================================
// INSTÂNCIAS DOS REPOSITÓRIOS
// =============================================================================

/**
 * Repositório para tipos de contrato (tabela contrato_tipos)
 *
 * @example
 * ```typescript
 * const result = await contratoTiposRepo.findAll({ ativo: true });
 * if (result.success) {
 *   console.log(result.data); // ContratoTipo[]
 * }
 * ```
 */
export const contratoTiposRepo = createTipoRepository(
  'contrato_tipos',
  'tipo_contrato_id',
);

/**
 * Repositório para tipos de cobrança (tabela contrato_tipos_cobranca)
 *
 * @example
 * ```typescript
 * const result = await contratoTiposCobrancaRepo.save({ nome: 'Honorários', slug: 'honorarios', ordem: 0 });
 * if (result.success) {
 *   console.log(result.data); // ContratoTipoCobranca
 * }
 * ```
 */
export const contratoTiposCobrancaRepo = createTipoRepository(
  'contrato_tipos_cobranca',
  'tipo_cobranca_id',
);

// Re-export types needed by consumers of this repository
export type { ContratoTipo, ContratoTipoCobranca };
