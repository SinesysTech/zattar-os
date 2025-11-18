// Rota de API para advogados
// GET: Listar advogados | POST: Criar advogado

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { listarAdvogados } from '@/backend/advogados/services/advogados/listar-advogados.service';
import { criarAdvogado } from '@/backend/advogados/services/advogados/criar-advogado.service';
import type { ListarAdvogadosParams, CriarAdvogadoParams } from '@/backend/types/advogados/types';

/**
 * @swagger
 * /api/advogados:
 *   get:
 *     summary: Lista advogados do sistema
 *     description: Retorna uma lista paginada de advogados com filtros opcionais
 *     tags:
 *       - Advogados
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Quantidade de itens por página
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Busca em nome completo, CPF ou OAB
 *       - in: query
 *         name: oab
 *         schema:
 *           type: string
 *         description: Filtrar por número da OAB
 *       - in: query
 *         name: uf_oab
 *         schema:
 *           type: string
 *         description: Filtrar por UF da OAB
 *       - in: query
 *         name: com_credenciais
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas advogados com credenciais ativas
 *     responses:
 *       200:
 *         description: Lista de advogados retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo advogado
 *     description: Cadastra um novo advogado no sistema
 *     tags:
 *       - Advogados
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome_completo
 *               - cpf
 *               - oab
 *               - uf_oab
 *             properties:
 *               nome_completo:
 *                 type: string
 *               cpf:
 *                 type: string
 *               oab:
 *                 type: string
 *               uf_oab:
 *                 type: string
 *     responses:
 *       201:
 *         description: Advogado criado com sucesso
 *       400:
 *         description: Dados inválidos ou duplicados
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);
    const params: ListarAdvogadosParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      busca: searchParams.get('busca') || undefined,
      oab: searchParams.get('oab') || undefined,
      uf_oab: searchParams.get('uf_oab') || undefined,
      com_credenciais: searchParams.get('com_credenciais') === 'true' ? true : undefined,
    };

    // 3. Listar advogados
    const resultado = await listarAdvogados(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar advogados:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter e validar body
    const body = await request.json();
    const params: CriarAdvogadoParams = {
      nome_completo: body.nome_completo,
      cpf: body.cpf,
      oab: body.oab,
      uf_oab: body.uf_oab,
    };

    // 3. Criar advogado
    const advogado = await criarAdvogado(params);

    return NextResponse.json(
      {
        success: true,
        data: advogado,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar advogado:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar se é erro de validação (400) ou duplicado (409)
    if (erroMsg.includes('já cadastrado') || erroMsg.includes('obrigatório') || erroMsg.includes('inválido')) {
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

