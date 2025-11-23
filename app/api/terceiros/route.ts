// Rota de API para terceiros
// GET: Listar terceiros | POST: Criar terceiro

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import {
  listarTerceiros,
  criarTerceiro,
} from '@/backend/terceiros/services/persistence/terceiro-persistence.service';
import type { CriarTerceiroParams, ListarTerceirosParams } from '@/backend/types/partes';

/**
 * @swagger
 * /api/terceiros:
 *   get:
 *     summary: Lista terceiros (peritos, MP, assistentes, etc.)
 *     tags:
 *       - Terceiros
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo_pessoa
 *         schema:
 *           type: string
 *           enum: [pf, pj]
 *       - in: query
 *         name: tipo_parte
 *         schema:
 *           type: string
 *           enum: [PERITO, MINISTERIO_PUBLICO, ASSISTENTE, TESTEMUNHA, CUSTOS_LEGIS, AMICUS_CURIAE, OUTRO]
 *       - in: query
 *         name: processo_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de terceiros
 *   post:
 *     summary: Cria um novo terceiro
 *     tags:
 *       - Terceiros
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_pessoa
 *               - nome
 *               - tipo_parte
 *               - polo
 *               - processo_id
 *             properties:
 *               tipo_pessoa:
 *                 type: string
 *                 enum: [pf, pj]
 *               nome:
 *                 type: string
 *               cpf:
 *                 type: string
 *               cnpj:
 *                 type: string
 *               tipo_parte:
 *                 type: string
 *                 enum: [PERITO, MINISTERIO_PUBLICO, ASSISTENTE, TESTEMUNHA, CUSTOS_LEGIS, AMICUS_CURIAE, OUTRO]
 *               polo:
 *                 type: string
 *                 enum: [ATIVO, PASSIVO, NEUTRO, TERCEIRO]
 *               processo_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Terceiro criado com sucesso
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params: ListarTerceirosParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      busca: searchParams.get('busca') || undefined,
      tipo_pessoa: (searchParams.get('tipo_pessoa') as 'pf' | 'pj' | null) || undefined,
      tipo_parte: searchParams.get('tipo_parte') as any || undefined,
      processo_id: searchParams.get('processo_id') ? parseInt(searchParams.get('processo_id')!, 10) : undefined,
      situacao: (searchParams.get('situacao') as 'A' | 'I' | 'E' | 'H' | null) || undefined,
    };

    const resultado = await listarTerceiros(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar terceiros:', error);
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
    const dadosTerceiro = body as CriarTerceiroParams;

    if (!dadosTerceiro.tipo_pessoa || !dadosTerceiro.nome || !dadosTerceiro.tipo_parte || !dadosTerceiro.polo || !dadosTerceiro.processo_id) {
      return NextResponse.json(
        { error: 'Missing required fields: tipo_pessoa, nome, tipo_parte, polo, processo_id' },
        { status: 400 }
      );
    }

    const resultado = await criarTerceiro(dadosTerceiro);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao criar terceiro' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: resultado.terceiro,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar terceiro:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
