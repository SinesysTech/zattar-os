// Rota de API para buscar clientes por nome
// GET: Busca clientes pelo nome (busca parcial)

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarClientePorNome } from '@/backend/clientes/services/clientes/buscar-cliente-por-nome.service';

/**
 * @swagger
 * /api/clientes/buscar/por-nome/{nome}:
 *   get:
 *     summary: Busca clientes por nome
 *     description: Retorna uma lista de clientes que contêm o nome buscado (busca parcial)
 *     tags:
 *       - Clientes
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: nome
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome ou parte do nome para buscar (mínimo 3 caracteres)
 *     responses:
 *       200:
 *         description: Lista de clientes encontrados (pode ser vazia)
 *       400:
 *         description: Nome inválido (vazio ou menos de 3 caracteres)
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nome: string }> }
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

    // 2. Obter nome do parâmetro
    const { nome } = await params;

    if (!nome || !nome.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Buscar clientes
    const clientes = await buscarClientePorNome(nome);

    return NextResponse.json({
      success: true,
      data: clientes,
      total: clientes.length,
    });
  } catch (error) {
    console.error('Erro ao buscar clientes por nome:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
