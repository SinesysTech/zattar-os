/**
 * API Route: /api/representantes/upsert
 * Create or update representante idempotently
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { upsertRepresentantePorIdPessoa } from '@/backend/representantes/services/representantes-persistence.service';
import type { UpsertRepresentantePorIdPessoaParams } from '@/backend/types/representantes/representantes-types';

/**
 * @swagger
 * /api/representantes/upsert:
 *   post:
 *     summary: Cria ou atualiza representante de forma idempotente
 *     description: Baseado na chave composta (id_pessoa_pje, trt, grau, parte_id, parte_tipo, numero_processo), cria novo registro ou atualiza existente. Múltiplas chamadas com mesmos dados não duplicam.
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
 *               - id_pessoa_pje
 *               - trt
 *               - grau
 *               - parte_tipo
 *               - parte_id
 *               - numero_processo
 *               - tipo_pessoa
 *               - nome
 *             properties:
 *               id_pessoa_pje:
 *                 type: integer
 *                 description: ID da pessoa no PJE
 *               trt:
 *                 type: string
 *                 description: Tribunal Regional do Trabalho
 *               grau:
 *                 type: string
 *                 enum: ["1", "2"]
 *                 description: Grau do processo
 *               parte_tipo:
 *                 type: string
 *                 enum: [cliente, parte_contraria, terceiro]
 *                 description: Tipo de parte representada
 *               parte_id:
 *                 type: integer
 *                 description: ID da parte representada
 *               numero_processo:
 *                 type: string
 *                 description: Número do processo
 *               tipo_pessoa:
 *                 type: string
 *                 enum: [pf, pj]
 *                 description: Tipo de pessoa (física ou jurídica)
 *               nome:
 *                 type: string
 *                 description: Nome completo do representante
 *               cpf:
 *                 type: string
 *                 description: CPF (obrigatório para pessoa física)
 *               cnpj:
 *                 type: string
 *                 description: CNPJ (obrigatório para pessoa jurídica)
 *               numero_oab:
 *                 type: string
 *                 description: Número da OAB
 *               uf_oab:
 *                 type: string
 *                 description: UF da OAB
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
    const params: UpsertRepresentantePorIdPessoaParams = body;

    // Validate required fields
    if (!params.id_pessoa_pje || !params.parte_tipo || !params.parte_id || !params.nome) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não informados' },
        { status: 400 }
      );
    }

    // Upsert representante
    const result = await upsertRepresentantePorIdPessoa(params);

    if (!result.sucesso) {
      return NextResponse.json(
        { success: false, error: result.erro },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.representante },
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
