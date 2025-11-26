/**
 * API Route: /api/representantes/upsert
 * Create or update representante idempotently
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { upsertRepresentantePorCPF } from '@/backend/representantes/services/representantes-persistence.service';
import type { UpsertRepresentantePorCPFParams } from '@/backend/types/representantes/representantes-types';

/**
 * @swagger
 * /api/representantes/upsert:
 *   post:
 *     summary: Cria ou atualiza representante de forma idempotente
 *     description: Baseado no CPF (chave única), cria novo registro ou atualiza existente. Múltiplas chamadas com mesmos dados não duplicam.
 *     tags: [Representantes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cpf
 *               - nome
 *             properties:
 *               cpf:
 *                 type: string
 *                 description: CPF do representante (chave única)
 *               nome:
 *                 type: string
 *                 description: Nome completo do representante
 *               numero_oab:
 *                 type: string
 *                 description: Número da OAB
 *               uf_oab:
 *                 type: string
 *                 description: UF da OAB
 *               situacao_oab:
 *                 type: string
 *                 description: Situação na OAB
 *               email:
 *                 type: string
 *                 description: Email do representante
 *     responses:
 *       200:
 *         description: Representante criado ou atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Representante'
 *                 criado:
 *                   type: boolean
 *                   description: Indica se o registro foi criado (true) ou atualizado (false)
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const params: UpsertRepresentantePorCPFParams = body;

    // Validate required fields
    if (!params.cpf || !params.nome) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não informados (cpf, nome)' },
        { status: 400 }
      );
    }

    // Upsert representante
    const result = await upsertRepresentantePorCPF(params);

    if (!result.sucesso) {
      return NextResponse.json(
        { success: false, error: result.erro },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.representante, criado: result.criado },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao fazer upsert de representante:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer upsert de representante' },
      { status: 500 }
    );
  }
}
