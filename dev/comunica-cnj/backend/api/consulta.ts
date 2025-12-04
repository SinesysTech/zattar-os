/**
 * API Route para consulta de comunicações CNJ
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getComunicaCNJClient } from '@/lib/services/comunica-cnj-client';
import { MeioComunicacao } from '@/lib/types/comunica-cnj';
import { getSupabase } from '@/lib/supabase';

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
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meio: z.enum(['E', 'D']).optional(),
  pagina: z.coerce.number().int().positive().optional(),
  itensPorPagina: z.coerce.number().int().refine((val) => val === 5 || val === 100, {
    message: 'itensPorPagina deve ser 5 ou 100',
  }).optional(),
  persistir: z.coerce.boolean().optional(), // Se deve persistir resultados no banco
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    // Validar parâmetros
    const validatedParams = consultaParamsSchema.parse(params);

    // Criar cliente
    const client = getComunicaCNJClient();

    // Verificar rate limit antes de fazer chamada
    const rateLimitStatus = client.getRateLimitStatus();
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

    // Consultar comunicações
    const result = await client.consultarComunicacoes({
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

    // Persistir resultados no banco se solicitado
    if (validatedParams.persistir) {
      await persistirComunicacoes(result.data.comunicacoes);
    }

    // Log de consulta (parâmetros sanitizados)
    console.log('[GET /api/comunica-cnj/consulta] Consulta realizada:', {
      params: validatedParams,
      total: result.data.paginacao.total,
      rateLimit: result.rateLimit,
    });

    return NextResponse.json(
      {
        comunicacoes: result.data.comunicacoes,
        paginacao: result.data.paginacao,
        rateLimit: result.rateLimit,
      },
      {
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Parâmetros inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

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

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao consultar comunicações',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar parâmetros
    const validatedParams = consultaParamsSchema.parse(body);

    // Criar cliente
    const client = getComunicaCNJClient();

    // Verificar rate limit
    const rateLimitStatus = client.getRateLimitStatus();
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

    // Consultar comunicações
    const result = await client.consultarComunicacoes({
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

    // Persistir resultados no banco se solicitado
    if (validatedParams.persistir) {
      await persistirComunicacoes(result.data.comunicacoes);
    }

    // Log de consulta
    console.log('[POST /api/comunica-cnj/consulta] Consulta realizada:', {
      params: validatedParams,
      total: result.data.paginacao.total,
      rateLimit: result.rateLimit,
    });

    return NextResponse.json(
      {
        comunicacoes: result.data.comunicacoes,
        paginacao: result.data.paginacao,
        rateLimit: result.rateLimit,
      },
      {
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Parâmetros inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('[POST /api/comunica-cnj/consulta] Error:', error);

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

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao consultar comunicações',
      },
      { status: 500 }
    );
  }
}

/**
 * Persiste comunicações no banco de dados
 */
async function persistirComunicacoes(comunicacoes: any[]): Promise<void> {
  try {
    const supabase = await getSupabase();

    for (const item of comunicacoes) {
      const { error } = await supabase
        .from('ComunicacaoCNJ')
        .upsert(
          {
            hash: item.hash,
            siglaTribunal: item.siglaTribunal,
            numeroProcesso: item.numeroProcesso,
            nomeParte: item.nomeParte || null,
            nomeAdvogado: item.nomeAdvogado || null,
            numeroOab: item.numeroOab || null,
            ufOab: item.ufOab || null,
            texto: item.texto || null,
            dataDisponibilizacao: new Date(item.dataDisponibilizacao).toISOString(),
            numeroComunicacao: item.numeroComunicacao || null,
            orgaoId: item.orgaoId || null,
            meio: item.meio,
            metadados: {},
          },
          {
            onConflict: 'hash',
            ignoreDuplicates: false,
          }
        );

      if (error) {
        console.error('[persistirComunicacoes] Erro ao persistir item:', error);
        // Continuar com próximo item
      }
    }
  } catch (error) {
    console.error('[persistirComunicacoes] Erro ao persistir:', error);
    // Não propagar erro - persistência é opcional
  }
}
