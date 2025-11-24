/**
 * API Route: /api/partes/terceiros/upsert
 * Cria ou atualiza terceiro de forma idempotente
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { upsertTerceiroPorIdPessoa } from '@/backend/partes/services/terceiros-persistence.service';
import type { UpsertTerceiroPorIdPessoaParams } from '@/backend/types/partes/terceiros-types';

/**
 * @swagger
 * /api/partes/terceiros/upsert:
 *   post:
 *     summary: Cria ou atualiza terceiro de forma idempotente
 *     description: Busca por composite key (id_pessoa_pje, processo_id, trt, grau, numero_processo). Se encontrar, atualiza; caso contrário, cria.
 *     tags: [Terceiros]
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
 *               - processo_id
 *               - trt
 *               - grau
 *               - numero_processo
 *               - tipo_pessoa
 *               - nome
 *               - tipo_parte
 *             properties:
 *               id_pessoa_pje:
 *                 type: integer
 *                 description: ID da pessoa no PJE (parte da chave composta)
 *               processo_id:
 *                 type: integer
 *                 description: ID do processo (parte da chave composta)
 *               trt:
 *                 type: string
 *                 description: Tribunal Regional do Trabalho (parte da chave composta)
 *               grau:
 *                 type: string
 *                 enum: ["1", "2"]
 *                 description: Grau do processo (parte da chave composta)
 *               numero_processo:
 *                 type: string
 *                 description: Número do processo (parte da chave composta)
 *               tipo_pessoa:
 *                 type: string
 *                 enum: [pf, pj]
 *                 description: Tipo de pessoa (física ou jurídica)
 *               nome:
 *                 type: string
 *                 description: Nome completo do terceiro
 *               tipo_parte:
 *                 type: string
 *                 description: Tipo de parte (perito, MP, etc.)
 *               cpf:
 *                 type: string
 *                 description: CPF (obrigatório para pessoa física)
 *               cnpj:
 *                 type: string
 *                 description: CNPJ (obrigatório para pessoa jurídica)
 *     responses:
 *       200:
 *         description: Terceiro criado ou atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Terceiro'
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
    const params = body as UpsertTerceiroPorIdPessoaParams;

    // Validate required fields
    if (!('id_pessoa_pje' in params) || !('tipo_pessoa' in params) ||
        !('nome' in params) || !('tipo_parte' in params)) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não informados' },
        { status: 400 }
      );
    }

    // Validate conditional required fields
    if (params.tipo_pessoa === 'pf' && !('cpf' in params)) {
      return NextResponse.json(
        { success: false, error: 'CPF é obrigatório para pessoa física' },
        { status: 400 }
      );
    }

    if (params.tipo_pessoa === 'pj' && !('cnpj' in params)) {
      return NextResponse.json(
        { success: false, error: 'CNPJ é obrigatório para pessoa jurídica' },
        { status: 400 }
      );
    }

    // Upsert terceiro
    const result = await upsertTerceiroPorIdPessoa(params);

    if (!result.sucesso) {
      return NextResponse.json(
        { success: false, error: result.erro },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.terceiro },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao fazer upsert de terceiro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer upsert de terceiro' },
      { status: 500 }
    );
  }
}
