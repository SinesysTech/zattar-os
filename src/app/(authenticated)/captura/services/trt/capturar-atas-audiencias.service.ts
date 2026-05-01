// Serviço de captura inteligente de atas de audiências.
// Fluxo: pré-check no banco → só abre PJe se houver audiências sem ata → captura pontual.

import { buscarAudienciasSemAtaHoje } from './buscar-audiencias-sem-ata.service';
import { tentarCapturarAta } from './capturar-ata-audiencia.service';
import { atualizarAtaAudiencia } from '../persistence/audiencias-persistence.service';
import { getCredentialComplete } from '../../credentials/credential.service';
import { getTribunalConfig } from './config';
import { autenticarPJE, type AuthResult } from './trt-auth.service';
import type { CodigoTRT, GrauTRT } from '../../types/trt-types';

export interface CapturarAtasResult {
  precheck_total: number;
  capturadas: number;
  ainda_sem_ata: number;
  erros: number;
  detalhes: Array<{
    audiencia_id: number;
    status: 'capturada' | 'sem_ata_no_pje' | 'erro';
    url?: string;
    erro?: string;
  }>;
}

export async function capturarAtasAudiencias(params: {
  credencial_ids: number[];
}): Promise<CapturarAtasResult> {
  const result: CapturarAtasResult = {
    precheck_total: 0,
    capturadas: 0,
    ainda_sem_ata: 0,
    erros: 0,
    detalhes: [],
  };

  // ── FASE 1: Pré-check no banco — nenhum browser aberto aqui ──────────────
  console.log('[AtasAudiencias] Fase 1: Verificando audiências sem ata no banco...');
  const pendentes = await buscarAudienciasSemAtaHoje();
  result.precheck_total = pendentes.total;

  if (pendentes.total === 0) {
    console.log('[AtasAudiencias] Nenhuma audiência sem ata para o período. Pulando PJe.');
    return result;
  }

  console.log(`[AtasAudiencias] ${pendentes.total} audiência(s) sem ata encontrada(s). Iniciando captura.`);

  // ── FASE 2: Carregar credenciais ─────────────────────────────────────────
  const credenciais = (
    await Promise.all(params.credencial_ids.map((id) => getCredentialComplete(id)))
  ).filter((c): c is NonNullable<typeof c> => c !== null);

  // ── FASE 3: Por (trt, grau) → encontrar credencial → abrir PJe ───────────
  for (const [chave, audiencias] of Object.entries(pendentes.porTrtGrau)) {
    const [trt, grau] = chave.split(':');

    const credencial = credenciais.find(
      (c) => c.tribunal === (trt as CodigoTRT) && c.grau === (grau as GrauTRT)
    );

    if (!credencial) {
      console.warn(`[AtasAudiencias] Nenhuma credencial para ${trt} ${grau}. Pulando ${audiencias.length} audiência(s).`);
      for (const a of audiencias) {
        result.erros++;
        result.detalhes.push({
          audiencia_id: a.id,
          status: 'erro',
          erro: `Sem credencial ativa para ${trt} ${grau}`,
        });
      }
      continue;
    }

    let authResult: AuthResult | null = null;
    try {
      const tribunalConfig = await getTribunalConfig(
        credencial.tribunal,
        credencial.grau
      );

      console.log(`[AtasAudiencias] Autenticando em ${trt} ${grau} para ${audiencias.length} audiência(s)...`);
      authResult = await autenticarPJE({
        credential: credencial.credenciais,
        config: tribunalConfig,
        headless: true,
      });

      const { page } = authResult;

      // ── FASE 4: Para cada audiência neste tribunal, tentar capturar ata ──
      for (const audiencia of audiencias) {
        try {
          const ata = await tentarCapturarAta(page, {
            audienciaId: audiencia.id,
            idPje: audiencia.id_pje,
            numeroProcesso: audiencia.numero_processo,
          });

          if (ata) {
            await atualizarAtaAudiencia(audiencia.id, {
              ata_audiencia_id: ata.documentoId,
              url_ata_audiencia: ata.url,
            });
            result.capturadas++;
            result.detalhes.push({ audiencia_id: audiencia.id, status: 'capturada', url: ata.url });
            console.log(`   ✅ Ata capturada: audiência ${audiencia.id} (${audiencia.numero_processo})`);
          } else {
            result.ainda_sem_ata++;
            result.detalhes.push({ audiencia_id: audiencia.id, status: 'sem_ata_no_pje' });
            console.log(`   ⏳ Sem ata ainda: audiência ${audiencia.id} (${audiencia.numero_processo})`);
          }
        } catch (e) {
          result.erros++;
          const erro = e instanceof Error ? e.message : String(e);
          result.detalhes.push({ audiencia_id: audiencia.id, status: 'erro', erro });
          console.error(`   ❌ Erro ao capturar ata da audiência ${audiencia.id}:`, erro);
        }
      }
    } finally {
      if (authResult?.browser) {
        await authResult.browser.close();
      }
    }
  }

  console.log(
    `[AtasAudiencias] Concluído: ${result.capturadas} capturadas, ${result.ainda_sem_ata} pendentes, ${result.erros} erros.`
  );
  return result;
}
