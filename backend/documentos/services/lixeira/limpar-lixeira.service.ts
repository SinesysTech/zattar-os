/**
 * Serviço de limpeza automática da lixeira
 *
 * Remove permanentemente documentos e pastas que estão na lixeira
 * há mais de 30 dias.
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Resultado da limpeza da lixeira
 */
export interface ResultadoLimpezaLixeira {
  documentosDeletados: number;
  pastasDeletadas: number;
  erros: string[];
  dataExecucao: string;
}

/**
 * Configuração padrão de dias para retenção na lixeira
 */
const DIAS_RETENCAO_PADRAO = 30;

/**
 * Remove permanentemente documentos que estão na lixeira há mais de X dias
 */
async function limparDocumentosAntigos(
  diasRetencao: number = DIAS_RETENCAO_PADRAO
): Promise<{ deletados: number; erros: string[] }> {
  const supabase = createServiceClient();
  const erros: string[] = [];

  // Calcular data limite (documentos deletados antes dessa data serão removidos)
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasRetencao);

  try {
    // Primeiro, buscar IDs dos documentos a serem deletados para limpar relacionamentos
    const { data: documentosParaDeletar, error: selectError } = await supabase
      .from('documentos')
      .select('id')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', dataLimite.toISOString());

    if (selectError) {
      erros.push(`Erro ao buscar documentos para limpar: ${selectError.message}`);
      return { deletados: 0, erros };
    }

    if (!documentosParaDeletar || documentosParaDeletar.length === 0) {
      return { deletados: 0, erros };
    }

    const ids = documentosParaDeletar.map(d => d.id);

    // Deletar registros relacionados primeiro (cascading manual para evitar problemas)
    // 1. Uploads
    await supabase
      .from('documentos_uploads')
      .delete()
      .in('documento_id', ids);

    // 2. Versões
    await supabase
      .from('documentos_versoes')
      .delete()
      .in('documento_id', ids);

    // 3. Compartilhamentos
    await supabase
      .from('documentos_compartilhados')
      .delete()
      .in('documento_id', ids);

    // 4. Salas de chat do documento
    const { data: salas } = await supabase
      .from('salas_chat')
      .select('id')
      .in('documento_id', ids);

    if (salas && salas.length > 0) {
      const salaIds = salas.map(s => s.id);

      // Deletar mensagens das salas
      await supabase
        .from('mensagens_chat')
        .delete()
        .in('sala_id', salaIds);

      // Deletar salas
      await supabase
        .from('salas_chat')
        .delete()
        .in('id', salaIds);
    }

    // 5. Finalmente, deletar os documentos
    const { error: deleteError } = await supabase
      .from('documentos')
      .delete()
      .in('id', ids);

    if (deleteError) {
      erros.push(`Erro ao deletar documentos: ${deleteError.message}`);
      return { deletados: 0, erros };
    }

    console.log(`[Lixeira] ${ids.length} documentos removidos permanentemente`);
    return { deletados: ids.length, erros };

  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
    erros.push(`Exceção ao limpar documentos: ${mensagem}`);
    return { deletados: 0, erros };
  }
}

/**
 * Remove permanentemente pastas que estão na lixeira há mais de X dias
 */
async function limparPastasAntigas(
  diasRetencao: number = DIAS_RETENCAO_PADRAO
): Promise<{ deletadas: number; erros: string[] }> {
  const supabase = createServiceClient();
  const erros: string[] = [];

  // Calcular data limite
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasRetencao);

  try {
    // Buscar pastas a serem deletadas
    // Ordenar por profundidade (filhas primeiro) para evitar problemas de FK
    const { data: pastasParaDeletar, error: selectError } = await supabase
      .from('pastas')
      .select('id, pasta_pai_id')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', dataLimite.toISOString())
      .order('id', { ascending: false }); // Aproximação para deletar filhas primeiro

    if (selectError) {
      erros.push(`Erro ao buscar pastas para limpar: ${selectError.message}`);
      return { deletadas: 0, erros };
    }

    if (!pastasParaDeletar || pastasParaDeletar.length === 0) {
      return { deletadas: 0, erros };
    }

    // Ordenar para deletar pastas mais profundas primeiro (sem pai primeiro, depois com pai)
    const pastasOrdenadas = [...pastasParaDeletar].sort((a, b) => {
      // Pastas com pasta_pai_id vêm primeiro (são mais profundas)
      if (a.pasta_pai_id && !b.pasta_pai_id) return -1;
      if (!a.pasta_pai_id && b.pasta_pai_id) return 1;
      return b.id - a.id; // IDs maiores primeiro
    });

    let deletadas = 0;
    for (const pasta of pastasOrdenadas) {
      const { error: deleteError } = await supabase
        .from('pastas')
        .delete()
        .eq('id', pasta.id);

      if (deleteError) {
        erros.push(`Erro ao deletar pasta ${pasta.id}: ${deleteError.message}`);
      } else {
        deletadas++;
      }
    }

    console.log(`[Lixeira] ${deletadas} pastas removidas permanentemente`);
    return { deletadas, erros };

  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
    erros.push(`Exceção ao limpar pastas: ${mensagem}`);
    return { deletadas: 0, erros };
  }
}

/**
 * Executa a limpeza completa da lixeira
 *
 * Remove documentos e pastas que estão na lixeira há mais de X dias.
 *
 * @param diasRetencao - Número de dias de retenção (padrão: 30)
 * @returns Resultado da limpeza com contadores e erros
 */
export async function limparLixeira(
  diasRetencao: number = DIAS_RETENCAO_PADRAO
): Promise<ResultadoLimpezaLixeira> {
  console.log(`[Lixeira] Iniciando limpeza (retenção: ${diasRetencao} dias)...`);

  const resultado: ResultadoLimpezaLixeira = {
    documentosDeletados: 0,
    pastasDeletadas: 0,
    erros: [],
    dataExecucao: new Date().toISOString(),
  };

  // Limpar documentos primeiro (podem estar em pastas)
  const { deletados: docs, erros: errosDoc } = await limparDocumentosAntigos(diasRetencao);
  resultado.documentosDeletados = docs;
  resultado.erros.push(...errosDoc);

  // Limpar pastas
  const { deletadas: pastas, erros: errosPasta } = await limparPastasAntigas(diasRetencao);
  resultado.pastasDeletadas = pastas;
  resultado.erros.push(...errosPasta);

  console.log(`[Lixeira] Limpeza concluída: ${docs} documentos, ${pastas} pastas removidos`);

  if (resultado.erros.length > 0) {
    console.warn('[Lixeira] Erros durante limpeza:', resultado.erros);
  }

  return resultado;
}

/**
 * Conta itens na lixeira que serão removidos na próxima limpeza
 */
export async function contarItensParaLimpeza(
  diasRetencao: number = DIAS_RETENCAO_PADRAO
): Promise<{ documentos: number; pastas: number }> {
  const supabase = createServiceClient();

  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasRetencao);

  const [{ count: documentos }, { count: pastas }] = await Promise.all([
    supabase
      .from('documentos')
      .select('*', { count: 'exact', head: true })
      .not('deleted_at', 'is', null)
      .lt('deleted_at', dataLimite.toISOString()),
    supabase
      .from('pastas')
      .select('*', { count: 'exact', head: true })
      .not('deleted_at', 'is', null)
      .lt('deleted_at', dataLimite.toISOString()),
  ]);

  return {
    documentos: documentos ?? 0,
    pastas: pastas ?? 0,
  };
}
