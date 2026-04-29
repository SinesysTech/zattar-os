/**
 * Serviço de merge incremental de timeline
 *
 * Carrega dados de backblaze da timeline existente no banco para evitar
 * re-download de documentos que já foram capturados anteriormente.
 *
 * Usa indexação dupla (por item.id e por idUnicoDocumento) para garantir
 * que o merge funcione mesmo quando IDs mudam entre capturas do PJE.
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type { TimelineItemEnriquecido, BackblazeB2Info } from '@/types/contracts/pje-trt';

/**
 * Resultado do carregamento de backblaze existente
 */
export interface BackblazeExistenteResult {
  /** Mapa por item.id (numérico) */
  porId: Map<number, BackblazeB2Info>;
  /** Mapa por idUnicoDocumento (string) — fallback para IDs instáveis */
  porIdUnico: Map<string, BackblazeB2Info>;
}

/**
 * Carrega backblaze existente da timeline no banco, indexado por ID e por idUnicoDocumento.
 *
 * @param processoIdPje - ID do processo no PJE (coluna id_pje)
 * @param trt - Código do TRT (necessário para identificar o registro único em acervo)
 * @param grau - Grau da instância (necessário para identificar o registro único em acervo)
 * @returns Objeto com dois mapas para lookup flexível
 */
export async function carregarBackblazeExistente(
  processoIdPje: string,
  trt: string,
  grau: string
): Promise<BackblazeExistenteResult> {
  const porId = new Map<number, BackblazeB2Info>();
  const porIdUnico = new Map<string, BackblazeB2Info>();

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('acervo')
      .select('timeline_jsonb')
      .eq('id_pje', processoIdPje)
      .eq('trt', trt)
      .eq('grau', grau)
      .maybeSingle();

    if (error) {
      console.warn('[timeline-merge] Erro na query Supabase:', error.message);
      return { porId, porIdUnico };
    }

    if (!data?.timeline_jsonb) {
      console.log('[timeline-merge] Nenhuma timeline existente encontrada para merge');
      return { porId, porIdUnico };
    }

    const timeline = (data.timeline_jsonb as { timeline?: TimelineItemEnriquecido[] }).timeline;
    if (!timeline) return { porId, porIdUnico };

    for (const item of timeline) {
      if (item.documento && item.backblaze) {
        porId.set(item.id, item.backblaze);
        if (item.idUnicoDocumento) {
          porIdUnico.set(item.idUnicoDocumento, item.backblaze);
        }
      }
    }

    console.log(`[timeline-merge] ${porId.size} documentos com backblaze encontrados (${porIdUnico.size} com idUnicoDocumento)`);
  } catch (err) {
    console.warn('[timeline-merge] Erro ao carregar timeline existente (continuando sem merge):', err);
  }

  return { porId, porIdUnico };
}
