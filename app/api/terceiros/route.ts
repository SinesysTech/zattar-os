// Rota de API para terceiros
// GET: Listar terceiros | POST: Criar terceiro

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarTerceiros,
  listarTerceirosComEndereco,
  listarTerceirosComEnderecoEProcessos,
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
 *       - in: query
 *         name: incluir_endereco
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Se true, inclui dados de endereço via JOIN
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
 *               endereco_id:
 *                 type: integer
 *                 description: ID do endereço na tabela enderecos (FK)
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
    const incluirEndereco = searchParams.get('incluir_endereco') === 'true';
    const incluirProcessos = searchParams.get('incluir_processos') === 'true';
    const params: ListarTerceirosParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      busca: searchParams.get('busca') || undefined,
      tipo_pessoa: (searchParams.get('tipo_pessoa') as 'pf' | 'pj' | null) || undefined,
      tipo_parte: searchParams.get('tipo_parte') || undefined,
    };

    // Se incluir processos, usa a função que busca ambos (endereço + processos)
    const resultado = incluirProcessos
      ? await listarTerceirosComEnderecoEProcessos(params)
      : incluirEndereco
        ? await listarTerceirosComEndereco(params)
        : await listarTerceiros(params);

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

    if (!dadosTerceiro.tipo_pessoa || !dadosTerceiro.nome || !dadosTerceiro.tipo_parte || !dadosTerceiro.polo) {
      return NextResponse.json(
        { error: 'Missing required fields: tipo_pessoa, nome, tipo_parte, polo' },
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
