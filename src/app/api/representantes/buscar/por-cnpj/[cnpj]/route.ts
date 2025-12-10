// Rota de API para buscar representante por CNPJ
// GET: Busca um representante pelo CNPJ (sempre retorna 404)
// NOTA: Representantes são sempre pessoas físicas (advogados), portanto não possuem CNPJ

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';

/**
 * @swagger
 * /api/representantes/buscar/por-cnpj/{cnpj}:
 *   get:
 *     summary: Busca um representante por CNPJ
 *     description: Representantes são sempre pessoas físicas, portanto esta rota sempre retorna 404
 *     tags:
 *       - Representantes
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: cnpj
 *         required: true
 *         schema:
 *           type: string
 *         description: CNPJ (ignorado)
 *     responses:
 *       404:
 *         description: Representantes não possuem CNPJ (são sempre PF)
 *       401:
 *         description: Não autenticado
 */
export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parâmetro obrigatório do Next.js
  _: { params: Promise<{ cnpj: string }> }
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

    // 2. Representantes são sempre PF (advogados), não têm CNPJ
    return NextResponse.json(
      { error: 'Representantes são sempre pessoas físicas e não possuem CNPJ. Use a busca por CPF.' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Erro na rota de busca por CNPJ:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
