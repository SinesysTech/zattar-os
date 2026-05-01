// Consulta banco local por audiências do dia sem ata — não abre PJe.
// Usado como pré-verificação pelo scheduler de atas.

import { createServiceClient } from '@/lib/supabase/service-client';

export interface AudienciaSemAta {
  id: number;
  id_pje: number;
  processo_id: number;
  numero_processo: string;
  trt: string;
  grau: string;
  advogado_id: number;
  data_inicio: string; // ISO timestamp
}

export interface BuscarAudienciasSemAtaResult {
  total: number;
  // Agrupado por "trt:grau" para minimizar logins no PJe
  porTrtGrau: Record<string, AudienciaSemAta[]>;
}

/**
 * Busca audiências de HOJE (Brasília) que:
 * - Já começaram (data_inicio <= agora)
 * - Ainda não têm ata (url_ata_audiencia IS NULL)
 *
 * Retorna agrupadas por (trt, grau) para abrir um único browser por tribunal+grau.
 */
export async function buscarAudienciasSemAtaHoje(): Promise<BuscarAudienciasSemAtaResult> {
  const supabase = createServiceClient();
  const agora = new Date();

  // Início do dia em Brasília (UTC-3) expresso em UTC
  // Ex: 2026-05-01 00:00 Brasília = 2026-05-01T03:00:00Z
  const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;
  const agoraBrasilia = new Date(agora.getTime() - BRASILIA_OFFSET_MS);
  const inicioDiaBrasilia = new Date(agoraBrasilia);
  inicioDiaBrasilia.setUTCHours(0, 0, 0, 0);
  const inicioDiaUTC = new Date(inicioDiaBrasilia.getTime() + BRASILIA_OFFSET_MS);

  const { data, error } = await supabase
    .from('audiencias')
    .select('id, id_pje, processo_id, numero_processo, trt, grau, advogado_id, data_inicio')
    .gte('data_inicio', inicioDiaUTC.toISOString())
    .lte('data_inicio', agora.toISOString())
    .is('url_ata_audiencia', null)
    .order('data_inicio', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar audiências sem ata: ${error.message}`);
  }

  const audiencias = (data || []) as AudienciaSemAta[];
  const porTrtGrau: Record<string, AudienciaSemAta[]> = {};

  for (const a of audiencias) {
    const chave = `${a.trt}:${a.grau}`;
    if (!porTrtGrau[chave]) porTrtGrau[chave] = [];
    porTrtGrau[chave].push(a);
  }

  return { total: audiencias.length, porTrtGrau };
}
