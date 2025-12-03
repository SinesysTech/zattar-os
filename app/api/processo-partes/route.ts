// Rota de API para processo_partes (vínculos N:N entre processos e entidades)
// GET: Listar vínculos | POST: Criar vínculo

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarProcessoPartes,
  vincularParteProcesso,
} from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';
import type {
  GrauProcessoParte,
  ListarProcessoPartesParams,
  VincularParteProcessoParams,
} from '@/backend/types/partes';

function normalizeGrauInput(value: unknown): GrauProcessoParte | undefined {
  if (typeof value === 'number') {
    return normalizeGrauInput(String(value));
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  if (value === '1' || value === 'primeiro_grau') {
    return 'primeiro_grau';
  }

  if (value === '2' || value === 'segundo_grau') {
    return 'segundo_grau';
  }

  return undefined;
}

/**
 * @swagger
 * /api/processo-partes:
 *   get:
 *     summary: Lista vínculos entre processos e partes
 *     tags:
 *       - Processo-Partes
 *     parameters:
 *       - in: query
 *         name: processo_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo_entidade
 *         schema:
 *           type: string
 *           enum: [cliente, parte_contraria, terceiro]
 *       - in: query
 *         name: entidade_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: polo
 *         schema:
 *           type: string
 *           enum: [ATIVO, PASSIVO, NEUTRO, TERCEIRO]
 *       - in: query
 *         name: tipo_parte
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de vínculos
 *   post:
 *     summary: Vincula uma entidade a um processo
 *     tags:
 *       - Processo-Partes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - processo_id
 *               - tipo_entidade
 *               - entidade_id
 *               - id_pje
 *               - trt
 *               - grau
 *               - numero_processo
 *               - tipo_parte
 *               - polo
 *             properties:
 *               processo_id:
 *                 type: integer
 *               tipo_entidade:
 *                 type: string
 *                 enum: [cliente, parte_contraria, terceiro]
 *               entidade_id:
 *                 type: integer
 *               id_pje:
 *                 type: integer
 *               trt:
 *                 type: string
 *               grau:
 *                 type: string
 *                 enum: ["1", "2"]
 *               numero_processo:
 *                 type: string
 *               tipo_parte:
 *                 type: string
 *               polo:
 *                 type: string
 *                 enum: [ATIVO, PASSIVO, NEUTRO, TERCEIRO]
 *               ordem:
 *                 type: integer
 *               principal:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Vínculo criado com sucesso
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Convert grau from "1"/"2" to "primeiro_grau"/"segundo_grau"
    const grauParam = searchParams.get('grau');
    const grau = normalizeGrauInput(grauParam);

    const params: ListarProcessoPartesParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      processo_id: searchParams.get('processo_id') ? parseInt(searchParams.get('processo_id')!, 10) : undefined,
      tipo_entidade: (searchParams.get('tipo_entidade') as 'cliente' | 'parte_contraria' | 'terceiro' | null) || undefined,
      entidade_id: searchParams.get('entidade_id') ? parseInt(searchParams.get('entidade_id')!, 10) : undefined,
      polo: searchParams.get('polo') || undefined,
      tipo_parte: searchParams.get('tipo_parte') || undefined,
      trt: searchParams.get('trt') || undefined,
      grau,
    };

    const resultado = await listarProcessoPartes(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar processo-partes:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const grauNormalizado = normalizeGrauInput(body?.grau);

    if (!grauNormalizado) {
      return NextResponse.json(
        { error: 'grau inválido (use valores "1" ou "2")' },
        { status: 400 }
      );
    }

    const dadosVinculo = {
      ...body,
      grau: grauNormalizado,
    } as VincularParteProcessoParams;

    const resultado = await vincularParteProcesso(dadosVinculo);

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error || 'Erro ao vincular parte ao processo' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: resultado.data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao vincular parte ao processo:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
