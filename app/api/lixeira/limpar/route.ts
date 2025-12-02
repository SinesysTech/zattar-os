/**
 * API Route para limpeza automática da lixeira
 *
 * POST /api/lixeira/limpar
 *
 * Endpoint para ser chamado por um job agendado (cron).
 * Requer autenticação via SERVICE_API_KEY.
 *
 * @swagger
 * /api/lixeira/limpar:
 *   post:
 *     tags: [Lixeira]
 *     summary: Limpa itens antigos da lixeira
 *     description: Remove permanentemente documentos e pastas que estão na lixeira há mais de 30 dias. Requer SERVICE_API_KEY.
 *     security:
 *       - serviceApiKey: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diasRetencao:
 *                 type: integer
 *                 default: 30
 *                 description: Dias de retenção antes da deleção permanente
 *     responses:
 *       200:
 *         description: Limpeza executada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     documentosDeletados:
 *                       type: integer
 *                     pastasDeletadas:
 *                       type: integer
 *                     erros:
 *                       type: array
 *                       items:
 *                         type: string
 *                     dataExecucao:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { limparLixeira, contarItensParaLimpeza } from '@/backend/documentos/services/lixeira/limpar-lixeira.service';

/**
 * Valida autenticação para jobs agendados
 *
 * Suporta:
 * - SERVICE_API_KEY via header x-service-api-key
 * - CRON_SECRET via header Authorization: Bearer (Vercel Cron)
 */
function validarAutenticacaoCron(request: NextRequest): boolean {
  // Vercel Cron usa header Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${cronSecret}`) {
      return true;
    }
  }

  // SERVICE_API_KEY para chamadas manuais
  const serviceApiKey = process.env.SERVICE_API_KEY;
  if (serviceApiKey) {
    const headerKey = request.headers.get('x-service-api-key');
    if (headerKey === serviceApiKey) {
      return true;
    }
  }

  console.error('[Lixeira] Autenticação falhou: CRON_SECRET ou SERVICE_API_KEY inválido');
  return false;
}

/**
 * POST - Executa limpeza da lixeira
 */
export async function POST(request: NextRequest) {
  try {
    // Validar autenticação (SERVICE_API_KEY ou CRON_SECRET)
    if (!validarAutenticacaoCron(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ler parâmetros opcionais
    let diasRetencao = 30;
    try {
      const body = await request.json();
      if (body.diasRetencao && typeof body.diasRetencao === 'number') {
        diasRetencao = Math.max(1, Math.min(365, body.diasRetencao)); // Entre 1 e 365 dias
      }
    } catch {
      // Body vazio ou inválido, usar padrão
    }

    console.log(`[API Lixeira] Iniciando limpeza com retenção de ${diasRetencao} dias`);

    // Executar limpeza
    const resultado = await limparLixeira(diasRetencao);

    return NextResponse.json({
      success: true,
      data: resultado,
    });

  } catch (error) {
    console.error('[API Lixeira] Erro ao executar limpeza:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Retorna preview do que será limpo
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação (SERVICE_API_KEY ou CRON_SECRET)
    if (!validarAutenticacaoCron(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const diasRetencao = parseInt(searchParams.get('diasRetencao') ?? '30', 10);

    // Contar itens que seriam limpos
    const contagem = await contarItensParaLimpeza(diasRetencao);

    return NextResponse.json({
      success: true,
      data: {
        diasRetencao,
        documentosParaLimpar: contagem.documentos,
        pastasParaLimpar: contagem.pastas,
        mensagem: contagem.documentos + contagem.pastas > 0
          ? `${contagem.documentos} documentos e ${contagem.pastas} pastas serão removidos`
          : 'Nenhum item para limpar',
      },
    });

  } catch (error) {
    console.error('[API Lixeira] Erro ao contar itens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
