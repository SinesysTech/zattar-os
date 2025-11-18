// Rota de API para credenciais de um advogado
// GET: Listar credenciais | POST: Criar credencial

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { listarCredenciais } from '@/backend/advogados/services/credenciais/listar-credenciais.service';
import { criarCredencial } from '@/backend/advogados/services/credenciais/criar-credencial.service';
import type { ListarCredenciaisParams, CriarCredencialParams } from '@/backend/types/credenciais/types';

/**
 * @swagger
 * /api/advogados/{id}/credenciais:
 *   get:
 *     summary: Lista credenciais de um advogado
 *     description: Retorna todas as credenciais (ou apenas ativas) de um advogado específico
 *     tags:
 *       - Credenciais
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do advogado
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo (true) ou inativo (false)
 *     responses:
 *       200:
 *         description: Lista de credenciais retornada com sucesso
 *       404:
 *         description: Advogado não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria uma nova credencial para o advogado
 *     description: Cadastra uma nova credencial de acesso ao tribunal para o advogado
 *     tags:
 *       - Credenciais
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do advogado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tribunal
 *               - grau
 *               - senha
 *             properties:
 *               tribunal:
 *                 type: string
 *                 example: "TRT3"
 *               grau:
 *                 type: string
 *                 enum: [primeiro_grau, segundo_grau]
 *               senha:
 *                 type: string
 *               active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Credencial criada com sucesso
 *       400:
 *         description: Dados inválidos ou credencial duplicada
 *       404:
 *         description: Advogado não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter ID do parâmetro
    const { id } = await params;
    const advogadoId = parseInt(id, 10);

    if (isNaN(advogadoId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);
    const paramsList: ListarCredenciaisParams = {
      advogado_id: advogadoId,
      active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
    };

    // 4. Listar credenciais
    const credenciais = await listarCredenciais(paramsList);

    return NextResponse.json({
      success: true,
      data: credenciais,
    });
  } catch (error) {
    console.error('Erro ao listar credenciais:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter ID do parâmetro
    const { id } = await params;
    const advogadoId = parseInt(id, 10);

    if (isNaN(advogadoId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Obter e validar body
    const body = await request.json();
    const paramsCreate: CriarCredencialParams = {
      advogado_id: advogadoId,
      tribunal: body.tribunal,
      grau: body.grau,
      senha: body.senha,
      active: body.active !== undefined ? body.active : true,
    };

    // 4. Criar credencial
    const credencial = await criarCredencial(paramsCreate);

    return NextResponse.json(
      {
        success: true,
        data: credencial,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar credencial:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar tipo de erro
    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 404 }
      );
    }
    
    if (erroMsg.includes('já existe') || erroMsg.includes('obrigatório') || erroMsg.includes('inválido')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

