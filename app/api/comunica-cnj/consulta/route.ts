/**
 * API Route para consulta de comunicações CNJ
 * GET: Busca comunicações na API do CNJ (sem persistir)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarComunicacoes,
  obterStatusRateLimit,
} from '@/backend/comunica-cnj';
import type { MeioComunicacao } from '@/backend/comunica-cnj';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Schema de validação para query params
 */
const consultaParamsSchema = z.object({
  siglaTribunal: z.string().optional(),
  texto: z.string().optional(),
  nomeParte: z.string().optional(),
  nomeAdvogado: z.string().optional(),
  numeroOab: z.string().optional(),
  ufOab: z.string().optional(),
  numeroProcesso: z.string().optional(),
  numeroComunicacao: z.coerce.number().int().positive().optional(),
  orgaoId: z.coerce.number().int().positive().optional(),
  dataInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (use yyyy-mm-dd)')
    .optional(),
  dataFim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (use yyyy-mm-dd)')
    .optional(),
  meio: z.enum(['E', 'D']).optional(),
  pagina: z.coerce.number().int().positive().optional(),
  itensPorPagina: z.coerce
    .number()
    .int()
    .refine((val) => val === 5 || val === 100, {
      message: 'itensPorPagina deve ser 5 ou 100',
    })
    .optional(),
});

/**
 * @swagger
 * /api/comunica-cnj/consulta:
 *   get:
 *     summary: Consulta comunicações na API do CNJ
 *     description: |
 *       Busca comunicações processuais na API pública do CNJ.
 *       Os resultados são retornados sem persistir no banco de dados.
 *
 *       **Filtros disponíveis:**
 *       - siglaTribunal: Sigla do tribunal (ex: TRT1, TJSP)
 *       - texto: Texto da comunicação
 *       - nomeParte: Nome da parte
 *       - nomeAdvogado: Nome do advogado
 *       - numeroOab: Número da OAB
 *       - ufOab: UF da OAB
 *       - numeroProcesso: Número do processo
 *       - numeroComunicacao: Número da comunicação
 *       - dataInicio/dataFim: Período de disponibilização
 *       - meio: E (Edital) ou D (Diário Eletrônico)
 *
 *       **Rate Limiting:**
 *       A API do CNJ possui limite de requisições. O status do rate limit é
 *       retornado em cada resposta.
 *     tags:
 *       - Comunica CNJ
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: siglaTribunal
 *         schema:
 *           type: string
 *         description: "Sigla do tribunal (ex: TRT1, TRT3)"
 *       - in: query
 *         name: texto
 *         schema:
 *           type: string
 *         description: Texto da comunicação (busca parcial)
 *       - in: query
 *         name: nomeParte
 *         schema:
 *           type: string
 *         description: Nome da parte
 *       - in: query
 *         name: nomeAdvogado
 *         schema:
 *           type: string
 *         description: Nome do advogado
 *       - in: query
 *         name: numeroOab
 *         schema:
 *           type: string
 *         description: Número da OAB
 *       - in: query
 *         name: ufOab
 *         schema:
 *           type: string
 *         description: UF da OAB (2 letras)
 *       - in: query
 *         name: numeroProcesso
 *         schema:
 *           type: string
 *         description: Número do processo
 *       - in: query
 *         name: numeroComunicacao
 *         schema:
 *           type: integer
 *         description: Número da comunicação
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (yyyy-mm-dd)
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (yyyy-mm-dd)
 *       - in: query
 *         name: meio
 *         schema:
 *           type: string
 *           enum: [E, D]
 *         description: "Meio de comunicação: E (Edital) ou D (Diário Eletrônico)"
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: itensPorPagina
 *         schema:
 *           type: integer
 *           enum: [5, 100]
 *           default: 100
 *         description: Itens por página (5 ou 100)
 *     responses:
 *       200:
 *         description: Comunicações retornadas com sucesso
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
 *                     comunicacoes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ComunicacaoItem'
 *                     paginacao:
 *                       type: object
 *                       properties:
 *                         pagina:
 *                           type: integer
 *                         itensPorPagina:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPaginas:
 *                           type: integer
 *                     rateLimit:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         remaining:
 *                           type: integer
 *                         resetAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autenticado
 *       429:
 *         description: Rate limit atingido
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter parâmetros da query string
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    // 3. Validar parâmetros
    const validationResult = consultaParamsSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Parâmetros inválidos',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validatedParams = validationResult.data;

    // 4. Verificar rate limit antes de fazer chamada
    const rateLimitStatus = obterStatusRateLimit();
    if (rateLimitStatus.remaining === 0 && rateLimitStatus.resetAt) {
      const waitTime = rateLimitStatus.resetAt.getTime() - Date.now();
      if (waitTime > 0) {
        return NextResponse.json(
          {
            error: 'Rate limit atingido',
            retryAfter: Math.ceil(waitTime / 1000),
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil(waitTime / 1000).toString(),
            },
          }
        );
      }
    }

    // 5. Consultar comunicações
    const result = await buscarComunicacoes({
      siglaTribunal: validatedParams.siglaTribunal,
      texto: validatedParams.texto,
      nomeParte: validatedParams.nomeParte,
      nomeAdvogado: validatedParams.nomeAdvogado,
      numeroOab: validatedParams.numeroOab,
      ufOab: validatedParams.ufOab,
      numeroProcesso: validatedParams.numeroProcesso,
      numeroComunicacao: validatedParams.numeroComunicacao,
      orgaoId: validatedParams.orgaoId,
      dataInicio: validatedParams.dataInicio,
      dataFim: validatedParams.dataFim,
      meio: validatedParams.meio as MeioComunicacao | undefined,
      pagina: validatedParams.pagina,
      itensPorPagina: validatedParams.itensPorPagina,
    });

    // 6. Log de consulta
    console.log('[GET /api/comunica-cnj/consulta] Consulta realizada:', {
      params: validatedParams,
      total: result.data.paginacao.total,
      rateLimit: result.rateLimit,
    });

    // 7. Retornar resposta
    return NextResponse.json(
      {
        success: true,
        data: {
          comunicacoes: result.data.comunicacoes,
          paginacao: result.data.paginacao,
          rateLimit: result.rateLimit,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/comunica-cnj/consulta] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Rate limit')) {
        return NextResponse.json(
          {
            error: error.message,
            retryAfter: 60,
          },
          {
            status: 429,
            headers: {
              'Retry-After': '60',
            },
          }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Erro ao consultar comunicações' },
      { status: 500 }
    );
  }
}
