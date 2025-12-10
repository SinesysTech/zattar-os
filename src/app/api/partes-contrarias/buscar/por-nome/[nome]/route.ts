// Rota de API para buscar partes contrárias por nome
// GET: Busca partes contrárias pelo nome (busca parcial)

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarParteContrariaPorNome } from '@/backend/partes-contrarias/services/partes-contrarias/buscar-parte-contraria-por-nome.service';

/**
 * @swagger
 * /api/partes-contrarias/buscar/por-nome/{nome}:
 *   get:
 *     summary: Busca partes contrárias por nome
 *     description: Retorna uma lista de partes contrárias cujo nome contém o texto buscado (mínimo 3 caracteres)
 *     tags:
 *       - Partes Contrárias
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
 *         description: Lista de partes contrárias encontradas (pode ser vazia)
 *       400:
 *         description: Parâmetros inválidos (nome muito curto)
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

    // 3. Buscar partes contrárias
    const partesContrarias = await buscarParteContrariaPorNome(nome);

    return NextResponse.json({
      success: true,
      data: partesContrarias,
    });
  } catch (error) {
    console.error('Erro ao buscar partes contrárias por nome:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
