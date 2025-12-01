/**
 * Serviço de persistência para versões de documentos
 *
 * Responsável por gerenciar o histórico de versões dos documentos.
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  DocumentoVersao,
  CriarVersaoParams,
  DocumentoVersaoComUsuario,
  ListarVersoesParams,
} from '@/backend/types/documentos/types';

/**
 * Cria uma nova versão de documento
 */
export async function criarVersao(
  params: CriarVersaoParams,
  usuario_id: number
): Promise<DocumentoVersao> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos_versoes')
    .insert({
      documento_id: params.documento_id,
      versao: params.versao,
      conteudo: params.conteudo,
      titulo: params.titulo,
      criado_por: usuario_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar versão: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma versão específica por ID
 */
export async function buscarVersaoPorId(id: number): Promise<DocumentoVersao | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos_versoes')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar versão: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma versão específica por documento e número da versão
 */
export async function buscarVersaoPorNumero(
  documento_id: number,
  versao: number
): Promise<DocumentoVersao | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos_versoes')
    .select()
    .eq('documento_id', documento_id)
    .eq('versao', versao)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar versão por número: ${error.message}`);
  }

  return data;
}

/**
 * Lista versões de um documento
 */
export async function listarVersoes(
  params: ListarVersoesParams
): Promise<{ versoes: DocumentoVersaoComUsuario[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase
    .from('documentos_versoes')
    .select(`
      *,
      criador:usuarios!documentos_versoes_criado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao
      )
    `, { count: 'exact' })
    .eq('documento_id', params.documento_id);

  // Ordenação (mais recente primeiro)
  query = query.order('versao', { ascending: false });

  // Paginação
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar versões: ${error.message}`);
  }

  return {
    versoes: (data as unknown as DocumentoVersaoComUsuario[]) ?? [],
    total: count ?? 0,
  };
}

/**
 * Busca a versão mais recente de um documento
 */
export async function buscarVersaoMaisRecente(
  documento_id: number
): Promise<DocumentoVersao | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos_versoes')
    .select()
    .eq('documento_id', documento_id)
    .order('versao', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar versão mais recente: ${error.message}`);
  }

  return data;
}

/**
 * Conta total de versões de um documento
 */
export async function contarVersoes(documento_id: number): Promise<number> {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from('documentos_versoes')
    .select('id', { count: 'exact', head: true })
    .eq('documento_id', documento_id);

  if (error) {
    throw new Error(`Erro ao contar versões: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Deleta uma versão específica
 */
export async function deletarVersao(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('documentos_versoes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao deletar versão: ${error.message}`);
  }
}

/**
 * Deleta todas as versões de um documento
 */
export async function deletarTodasVersoes(documento_id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('documentos_versoes')
    .delete()
    .eq('documento_id', documento_id);

  if (error) {
    throw new Error(`Erro ao deletar todas as versões: ${error.message}`);
  }
}

/**
 * Restaura uma versão anterior (cria nova versão com conteúdo antigo)
 */
export async function restaurarVersao(
  documento_id: number,
  versao_numero: number,
  usuario_id: number
): Promise<{ nova_versao: DocumentoVersao; documento_atualizado: boolean }> {
  const supabase = createServiceClient();

  // Buscar versão a ser restaurada
  const versaoAntiga = await buscarVersaoPorNumero(documento_id, versao_numero);
  if (!versaoAntiga) {
    throw new Error(`Versão ${versao_numero} não encontrada`);
  }

  // Buscar versão atual do documento
  const { data: documentoAtual } = await supabase
    .from('documentos')
    .select('versao, titulo')
    .eq('id', documento_id)
    .single();

  if (!documentoAtual) {
    throw new Error('Documento não encontrado');
  }

  const novaVersaoNumero = documentoAtual.versao + 1;

  // Criar nova versão com conteúdo da versão antiga
  const novaVersao = await criarVersao(
    {
      documento_id,
      versao: novaVersaoNumero,
      conteudo: versaoAntiga.conteudo,
      titulo: versaoAntiga.titulo,
    },
    usuario_id
  );

  // Atualizar documento principal
  const { error: updateError } = await supabase
    .from('documentos')
    .update({
      conteudo: versaoAntiga.conteudo,
      titulo: versaoAntiga.titulo,
      versao: novaVersaoNumero,
      editado_por: usuario_id,
      editado_em: new Date().toISOString(),
    })
    .eq('id', documento_id);

  if (updateError) {
    throw new Error(`Erro ao atualizar documento: ${updateError.message}`);
  }

  return {
    nova_versao: novaVersao,
    documento_atualizado: true,
  };
}

/**
 * Compara duas versões de um documento
 */
export async function compararVersoes(
  documento_id: number,
  versao_a: number,
  versao_b: number
): Promise<{
  versao_a: DocumentoVersao;
  versao_b: DocumentoVersao;
}> {
  const [versaoA, versaoB] = await Promise.all([
    buscarVersaoPorNumero(documento_id, versao_a),
    buscarVersaoPorNumero(documento_id, versao_b),
  ]);

  if (!versaoA) {
    throw new Error(`Versão ${versao_a} não encontrada`);
  }

  if (!versaoB) {
    throw new Error(`Versão ${versao_b} não encontrada`);
  }

  return {
    versao_a: versaoA,
    versao_b: versaoB,
  };
}

/**
 * Lista versões criadas por um usuário específico
 */
export async function listarVersoesPorUsuario(
  documento_id: number,
  usuario_id: number
): Promise<DocumentoVersaoComUsuario[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos_versoes')
    .select(`
      *,
      criador:usuarios!documentos_versoes_criado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao
      )
    `)
    .eq('documento_id', documento_id)
    .eq('criado_por', usuario_id)
    .order('versao', { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar versões por usuário: ${error.message}`);
  }

  return (data as unknown as DocumentoVersaoComUsuario[]) ?? [];
}

/**
 * Busca versões em um intervalo de datas
 */
export async function listarVersoesIntervalo(
  documento_id: number,
  data_inicio: string,
  data_fim: string
): Promise<DocumentoVersaoComUsuario[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos_versoes')
    .select(`
      *,
      criador:usuarios!documentos_versoes_criado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao
      )
    `)
    .eq('documento_id', documento_id)
    .gte('created_at', data_inicio)
    .lte('created_at', data_fim)
    .order('versao', { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar versões por intervalo: ${error.message}`);
  }

  return (data as unknown as DocumentoVersaoComUsuario[]) ?? [];
}

/**
 * Limpa versões antigas mantendo apenas as N mais recentes
 */
export async function limparVersoesAntigas(
  documento_id: number,
  manter_ultimas_n = 10
): Promise<number> {
  const supabase = createServiceClient();

  // Buscar IDs das versões a manter
  const { data: versoesRecentes } = await supabase
    .from('documentos_versoes')
    .select('id')
    .eq('documento_id', documento_id)
    .order('versao', { ascending: false })
    .limit(manter_ultimas_n);

  if (!versoesRecentes || versoesRecentes.length === 0) {
    return 0;
  }

  const idsParaManter = versoesRecentes.map((v) => v.id);

  // Deletar versões não mantidas
  const { count, error } = await supabase
    .from('documentos_versoes')
    .delete({ count: 'exact' })
    .eq('documento_id', documento_id)
    .not('id', 'in', `(${idsParaManter.join(',')})`);

  if (error) {
    throw new Error(`Erro ao limpar versões antigas: ${error.message}`);
  }

  return count ?? 0;
}
