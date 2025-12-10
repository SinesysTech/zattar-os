/**
 * POST /api/acervo/:id/timeline/recapture
 *
 * Recaptura a timeline de TODAS as instâncias do processo (1º, 2º e TST),
 * garantindo que a visão unificada fique atualizada.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { capturarTimeline } from '@/backend/captura/services/timeline/timeline-capture.service';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';

interface InstanciaAcervo {
  id: number;
  trt: string;
  grau: string;
  id_pje: number;
  numero_processo: string;
  advogado_id: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Autenticação
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const acervoId = Number(id);
    if (Number.isNaN(acervoId)) {
      return NextResponse.json({ error: 'ID do acervo inválido' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Buscar número do processo
    const { data: acervo, error: acervoError } = await supabase
      .from('acervo')
      .select('numero_processo')
      .eq('id', acervoId)
      .single();

    if (acervoError || !acervo) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 });
    }

    // Buscar todas as instâncias do mesmo número de processo
    const { data: instancias, error: instanciasError } = await supabase
      .from('acervo')
      .select('id, trt, grau, id_pje, numero_processo, advogado_id')
      .eq('numero_processo', acervo.numero_processo);

    if (instanciasError) {
      throw new Error(`Erro ao buscar instâncias: ${instanciasError.message}`);
    }

    if (!instancias || instancias.length === 0) {
      return NextResponse.json({ error: 'Nenhuma instância encontrada para o processo' }, { status: 404 });
    }

    const resultados: Array<{
      instanciaId: number;
      trt: string;
      grau: string;
      status: 'ok' | 'erro';
      mensagem?: string;
      totalItens?: number;
      totalDocumentos?: number;
      totalMovimentos?: number;
      mongoId?: string;
    }> = [];

    // Recapturar cada instância sequencialmente
    // IMPORTANTE: Fazer isso de forma assíncrona para não travar a requisição HTTP
    for (const inst of instancias as InstanciaAcervo[]) {
      console.log(`[recapture] Processando instância ${inst.grau} (${inst.trt})...`);
      
      try {
        const resultado = await capturarTimeline({
          trtCodigo: inst.trt as CodigoTRT,
          grau: inst.grau as GrauTRT,
          processoId: String(inst.id_pje),
          numeroProcesso: inst.numero_processo,
          advogadoId: inst.advogado_id,
          baixarDocumentos: true,
          // Mantém consistência com captura manual: trazer tudo
          filtroDocumentos: {
            apenasAssinados: false,
            apenasNaoSigilosos: false,
          },
        });

        console.log(`[recapture] ✅ Instância ${inst.grau} capturada:`, {
          totalItens: resultado.totalItens,
          totalDocumentos: resultado.totalDocumentos,
        });

        resultados.push({
          instanciaId: inst.id,
          trt: inst.trt,
          grau: inst.grau,
          status: 'ok',
          totalItens: resultado.totalItens,
          totalDocumentos: resultado.totalDocumentos,
          totalMovimentos: resultado.totalMovimentos,
          mongoId: resultado.mongoId,
        });
      } catch (error) {
        console.error(`[recapture] ❌ Erro na instância ${inst.grau}:`, error);
        resultados.push({
          instanciaId: inst.id,
          trt: inst.trt,
          grau: inst.grau,
          status: 'erro',
          mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    const totalSucesso = resultados.filter(r => r.status === 'ok').length;
    const totalErro = resultados.length - totalSucesso;

    console.log(`[recapture] ✅ Recaptura finalizada: ${totalSucesso} sucesso, ${totalErro} erro`);

    return NextResponse.json(
      {
        success: true,
        data: {
          numero_processo: acervo.numero_processo,
          resultados,
          totalSucesso,
          totalErro,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[recapture-timeline] Erro geral', error);
    const mensagem = error instanceof Error ? error.message : 'Erro ao recapturar timeline';
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
