// Helper para capturar a ata de uma única audiência via timeline do PJe.
// Retorna { documentoId, url } ou null se a ata ainda não foi publicada.

import type { Page } from 'playwright-core';
import { obterTimeline } from '@/app/(authenticated)/captura/pje-trt/timeline/obter-timeline';
import { obterDocumento } from '@/app/(authenticated)/captura/pje-trt/timeline/obter-documento';
import { baixarDocumento } from '@/app/(authenticated)/captura/pje-trt/timeline/baixar-documento';
import { uploadToBackblaze } from '@/lib/storage/backblaze-b2.service';
import { gerarNomeDocumentoAudiencia, gerarCaminhoDocumento } from '@/lib/storage/file-naming.utils';

export interface AtaCapturaParams {
  audienciaId: number;
  idPje: number;
  numeroProcesso: string;
  timelinePreCarregada?: unknown[];
}

export interface AtaCapturaResult {
  documentoId: number;
  url: string;
}

/**
 * Tenta capturar a ata de uma audiência.
 * Busca "ata" na timeline do processo, baixa o PDF e sobe no Backblaze.
 * Retorna null se não encontrar ata na timeline (ainda não publicada pelo tribunal).
 */
export async function tentarCapturarAta(
  page: Page,
  params: AtaCapturaParams
): Promise<AtaCapturaResult | null> {
  const { audienciaId, idPje, numeroProcesso, timelinePreCarregada } = params;

  const timeline =
    timelinePreCarregada ||
    (await obterTimeline(page, String(idPje), {
      somenteDocumentosAssinados: true,
      buscarDocumentos: true,
      buscarMovimentos: false,
    }));

  const candidato = (
    timeline as Array<{ id?: number; tipo?: string; titulo?: string; documento?: unknown }>
  ).find(
    (d) =>
      d.documento &&
      ((d.tipo || '').toLowerCase().includes('ata') ||
        (d.titulo || '').toLowerCase().includes('ata'))
  );

  if (!candidato?.id) return null;

  const documentoId = candidato.id;

  const docDetalhes = await obterDocumento(page, String(idPje), String(documentoId), {
    incluirAssinatura: true,
    grau: 1,
  });

  const pdf = await baixarDocumento(page, String(idPje), String(documentoId), {
    incluirCapa: false,
    incluirAssinatura: true,
    grau: 1,
  });

  const nomeArquivo = gerarNomeDocumentoAudiencia(audienciaId);
  const key = gerarCaminhoDocumento(numeroProcesso, 'audiencias', nomeArquivo);

  const upload = await uploadToBackblaze({
    buffer: pdf,
    key,
    contentType: 'application/pdf',
  });

  return { documentoId: docDetalhes.id, url: upload.url };
}
