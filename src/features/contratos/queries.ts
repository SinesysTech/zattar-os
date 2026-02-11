/**
 * CONTRATOS FEATURE - Data Fetching Queries
 *
 * Funções de busca de dados para uso em Server Components.
 * Estas funções NÃO são server actions ('use server') e podem
 * ser chamadas diretamente de Server Components sem cruzar
 * a fronteira de serialização de server actions.
 *
 * Para mutations (criar, atualizar, deletar), use as server actions em ./actions.
 */

import { createDbClient } from "@/lib/supabase";
import { buscarContrato } from "./service";
import type { Contrato } from "./domain";

// =============================================================================
// TIPOS
// =============================================================================

export interface ClienteDetalhado {
  id: number;
  nome: string;
  tipoPessoa: "pf" | "pj";
  cpfCnpj: string | null;
  emails: string[] | null;
  dddCelular: string | null;
  numeroCelular: string | null;
  endereco: {
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    municipio: string | null;
    estadoSigla: string | null;
  } | null;
}

export interface ResponsavelDetalhado {
  id: number;
  nome: string;
}

export interface SegmentoDetalhado {
  id: number;
  nome: string;
  slug: string;
}

export interface ContratoCompletoStats {
  totalPartes: number;
  totalProcessos: number;
  totalDocumentos: number;
  totalLancamentos: number;
}

export interface ContratoCompleto {
  contrato: Contrato;
  cliente: ClienteDetalhado | null;
  responsavel: ResponsavelDetalhado | null;
  segmento: SegmentoDetalhado | null;
  stats: ContratoCompletoStats;
}

type QueryResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Busca contrato completo com todos os dados relacionados.
 *
 * Para uso em Server Components (page.tsx).
 * NÃO é uma server action — evita problemas de serialização
 * durante revalidatePath.
 */
export async function fetchContratoCompleto(
  id: number,
): Promise<QueryResult<ContratoCompleto>> {
  try {
    if (!id || id <= 0) {
      return { success: false, error: "ID do contrato inválido" };
    }

    const db = createDbClient();

    // Buscar contrato com relações
    const contratoResult = await buscarContrato(id);
    if (!contratoResult.success) {
      return { success: false, error: contratoResult.error.message };
    }

    if (!contratoResult.data) {
      return { success: false, error: "Contrato não encontrado" };
    }

    const contrato = contratoResult.data;

    // Fetch paralelo de dados relacionados
    const [
      clienteRes,
      responsavelRes,
      segmentoRes,
      documentosCountRes,
      lancamentosCountRes,
    ] = await Promise.all([
      // Cliente
      db
        .from("clientes")
        .select(
          "id, nome, tipo_pessoa, cpf, cnpj, emails, ddd_celular, numero_celular, endereco_id",
        )
        .eq("id", contrato.clienteId)
        .single(),

      // Responsável (se existir)
      contrato.responsavelId
        ? db
            .from("usuarios")
            .select("id, nome_completo, nome_exibicao")
            .eq("id", contrato.responsavelId)
            .single()
        : Promise.resolve({ data: null, error: null }),

      // Segmento (se existir)
      contrato.segmentoId
        ? db
            .from("segmentos")
            .select("id, nome, slug")
            .eq("id", contrato.segmentoId)
            .single()
        : Promise.resolve({ data: null, error: null }),

      // Contagem de documentos
      db
        .from("contrato_documentos")
        .select("id", { count: "exact", head: true })
        .eq("contrato_id", id),

      // Contagem de lançamentos financeiros
      db
        .from("lancamentos_financeiros")
        .select("id", { count: "exact", head: true })
        .eq("contrato_id", id),
    ]);

    // Processar cliente
    let cliente: ClienteDetalhado | null = null;
    if (clienteRes.data) {
      const c = clienteRes.data as Record<string, unknown>;

      // Buscar endereço se existir
      let endereco: ClienteDetalhado["endereco"] = null;
      if (c.endereco_id) {
        const { data: enderecoData } = await db
          .from("enderecos")
          .select("logradouro, numero, bairro, municipio, estado_sigla")
          .eq("id", c.endereco_id)
          .single();

        if (enderecoData) {
          const e = enderecoData as Record<string, unknown>;
          endereco = {
            logradouro: e.logradouro as string | null,
            numero: e.numero as string | null,
            bairro: e.bairro as string | null,
            municipio: e.municipio as string | null,
            estadoSigla: e.estado_sigla as string | null,
          };
        }
      }

      cliente = {
        id: c.id as number,
        nome: c.nome as string,
        tipoPessoa: c.tipo_pessoa as "pf" | "pj",
        cpfCnpj: (c.cpf as string | null) || (c.cnpj as string | null),
        emails: c.emails as string[] | null,
        dddCelular: c.ddd_celular as string | null,
        numeroCelular: c.numero_celular as string | null,
        endereco,
      };
    }

    // Processar responsável
    let responsavel: ResponsavelDetalhado | null = null;
    if (responsavelRes.data) {
      const r = responsavelRes.data as Record<string, unknown>;
      responsavel = {
        id: r.id as number,
        nome:
          (r.nome_exibicao as string | null) ||
          (r.nome_completo as string) ||
          `Usuário #${r.id}`,
      };
    }

    // Processar segmento
    let segmento: SegmentoDetalhado | null = null;
    if (segmentoRes.data) {
      const s = segmentoRes.data as Record<string, unknown>;
      segmento = {
        id: s.id as number,
        nome: s.nome as string,
        slug: s.slug as string,
      };
    }

    // Montar estatísticas
    const stats: ContratoCompletoStats = {
      totalPartes: contrato.partes.length,
      totalProcessos: contrato.processos.length,
      totalDocumentos: documentosCountRes.count ?? 0,
      totalLancamentos: lancamentosCountRes.count ?? 0,
    };

    return {
      success: true,
      data: {
        contrato,
        cliente,
        responsavel,
        segmento,
        stats,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar contrato completo:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}
