import { createServiceClient } from "@/lib/supabase/service-client";
import type {
  Pasta,
  CriarPastaParams,
  AtualizarPastaParams,
  PastaComContadores,
  PastaHierarquia,
} from "../domain";
import { buildPastaWithCreatorSelect } from "./shared/query-builders";

// ============================================================================
// PASTAS
// ============================================================================

/**
 * Cria uma nova pasta no banco de dados
 */
export async function criarPasta(
  params: CriarPastaParams,
  usuario_id: number
): Promise<Pasta> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pastas")
    .insert({
      nome: params.nome,
      pasta_pai_id: params.pasta_pai_id ?? null,
      tipo: params.tipo,
      criado_por: usuario_id,
      descricao: params.descricao ?? null,
      cor: params.cor ?? null,
      icone: params.icone ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar pasta: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma pasta por ID
 */
export async function buscarPastaPorId(id: number): Promise<Pasta | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pastas")
    .select()
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar pasta: ${error.message}`);
  }

  return data;
}

/**
 * Lista pastas com contadores de documentos e subpastas
 */
export async function listarPastasComContadores(
  pasta_pai_id?: number | null,
  usuario_id?: number
): Promise<PastaComContadores[]> {
  const supabase = createServiceClient();

  let query = supabase
    .from("pastas")
    .select(buildPastaWithCreatorSelect())
    .is("deleted_at", null);

  // Filtro: pasta_pai_id
  if (pasta_pai_id !== undefined) {
    if (pasta_pai_id === null) {
      query = query.is("pasta_pai_id", null);
    } else {
      query = query.eq("pasta_pai_id", pasta_pai_id);
    }
  }

  // Filtro: criado_por (para pastas privadas)
  if (usuario_id) {
    query = query.or(`tipo.eq.comum,criado_por.eq.${usuario_id}`);
  }

  query = query.order("nome", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar pastas: ${error.message}`);
  }

  interface PastaWithRelations extends Pasta {
    criador?: { id?: number; nome_completo?: string };
  }
  const pastas = (data ?? []) as PastaWithRelations[];

  // Buscar contadores para cada pasta
  const pastasComContadores: PastaComContadores[] = await Promise.all(
    pastas.map(async (pasta) => {
      // Contar documentos
      const { count: totalDocumentos } = await supabase
        .from("documentos")
        .select("id", { count: "exact", head: true })
        .eq("pasta_id", pasta.id)
        .is("deleted_at", null);

      // Contar subpastas
      const { count: totalSubpastas } = await supabase
        .from("pastas")
        .select("id", { count: "exact", head: true })
        .eq("pasta_pai_id", pasta.id)
        .is("deleted_at", null);

      return {
        ...pasta,
        total_documentos: totalDocumentos ?? 0,
        total_subpastas: totalSubpastas ?? 0,
        criador: {
          id: pasta.criado_por,
          nomeCompleto: pasta.criador?.nome_completo ?? '',
        },
      };
    })
  );

  return pastasComContadores;
}

/**
 * Busca a árvore hierárquica de pastas
 */
export async function buscarHierarquiaPastas(
  pasta_raiz_id?: number | null,
  incluir_documentos = false,
  usuario_id?: number
): Promise<PastaHierarquia[]> {
  const supabase = createServiceClient();

  // Buscar pasta raiz (ou raízes se pasta_raiz_id for null)
  let query = supabase.from("pastas").select().is("deleted_at", null);

  if (pasta_raiz_id !== undefined) {
    if (pasta_raiz_id === null) {
      query = query.is("pasta_pai_id", null);
    } else {
      query = query.eq("id", pasta_raiz_id);
    }
  } else {
    query = query.is("pasta_pai_id", null);
  }

  // Filtro de privacidade
  if (usuario_id) {
    query = query.or(`tipo.eq.comum,criado_por.eq.${usuario_id}`);
  }

  query = query.order("nome", { ascending: true });

  const { data: pastasRaiz, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar hierarquia de pastas: ${error.message}`);
  }

  if (!pastasRaiz || pastasRaiz.length === 0) {
    return [];
  }

  // Função recursiva para construir árvore
  const construirArvore = async (pasta: Pasta): Promise<PastaHierarquia> => {
    // Buscar subpastas
    const { data: subpastas } = await supabase
      .from("pastas")
      .select()
      .eq("pasta_pai_id", pasta.id)
      .is("deleted_at", null)
      .order("nome", { ascending: true });

    // Buscar documentos se solicitado
    let documentos = undefined;
    if (incluir_documentos) {
      const { data: docs } = await supabase
        .from("documentos")
        .select()
        .eq("pasta_id", pasta.id)
        .is("deleted_at", null)
        .order("titulo", { ascending: true });
      documentos = docs ?? undefined;
    }

    // Recursão para subpastas
    const subpastasComFilhos = await Promise.all(
      (subpastas ?? []).map((subpasta) => construirArvore(subpasta))
    );

    return {
      ...pasta,
      subpastas: subpastasComFilhos,
      documentos,
    };
  };

  return await Promise.all(pastasRaiz.map(construirArvore));
}

/**
 * Atualiza uma pasta existente
 */
export async function atualizarPasta(
  id: number,
  params: AtualizarPastaParams
): Promise<Pasta> {
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {};

  if (params.nome !== undefined) updateData.nome = params.nome;
  if (params.pasta_pai_id !== undefined)
    updateData.pasta_pai_id = params.pasta_pai_id;
  if (params.descricao !== undefined) updateData.descricao = params.descricao;
  if (params.cor !== undefined) updateData.cor = params.cor;
  if (params.icone !== undefined) updateData.icone = params.icone;

  const { data, error } = await supabase
    .from("pastas")
    .update(updateData)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar pasta: ${error.message}`);
  }

  return data;
}

/**
 * Soft delete de uma pasta
 */
export async function deletarPasta(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("pastas")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Erro ao deletar pasta: ${error.message}`);
  }
}

/**
 * Restaura uma pasta deletada
 */
export async function restaurarPasta(id: number): Promise<Pasta> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pastas")
    .update({ deleted_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao restaurar pasta: ${error.message}`);
  }

  return data;
}

/**
 * Hard delete de uma pasta (permanente)
 */
export async function deletarPastaPermanentemente(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.from("pastas").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao deletar pasta permanentemente: ${error.message}`);
  }
}

/**
 * Move uma pasta para outra pasta pai
 */
export async function moverPasta(
  id: number,
  nova_pasta_pai_id: number | null
): Promise<Pasta> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pastas")
    .update({ pasta_pai_id: nova_pasta_pai_id })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao mover pasta: ${error.message}`);
  }

  return data;
}

/**
 * Verifica se um usuário tem acesso a uma pasta
 */
export async function verificarAcessoPasta(
  pasta_id: number,
  usuario_id: number
): Promise<boolean> {
  const supabase = createServiceClient();

  const { data: pasta } = await supabase
    .from("pastas")
    .select("tipo, criado_por")
    .eq("id", pasta_id)
    .is("deleted_at", null)
    .single();

  if (!pasta) {
    return false;
  }

  // Pastas comuns são acessíveis a todos
  if (pasta.tipo === "comum") {
    return true;
  }

  // Pastas privadas apenas para o criador
  return pasta.criado_por === usuario_id;
}

/**
 * Busca o caminho completo de uma pasta (breadcrumbs)
 */
export async function buscarCaminhoPasta(pasta_id: number): Promise<Pasta[]> {
  const supabase = createServiceClient();

  const caminho: Pasta[] = [];
  let atual_id: number | null = pasta_id;

  while (atual_id !== null) {
    const result = await supabase
      .from("pastas")
      .select("*")
      .eq("id", atual_id)
      .is("deleted_at", null)
      .single();

    const pastaAtual = result.data as Pasta | null;
    if (!pastaAtual) break;

    caminho.unshift(pastaAtual);
    atual_id = pastaAtual.pasta_pai_id;
  }

  return caminho;
}
