// Rota de API para operações em processo específico do acervo
// GET: Buscar processo do acervo por ID

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterAcervoPorId } from '@/backend/acervo/services/buscar-acervo.service';

/**
 * @swagger
 * /api/acervo/{id}:
 *   get:
 *     summary: Busca um processo do acervo por ID
 *     description: Retorna os dados completos de um processo específico do acervo
 *     tags:
 *       - Acervo
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
 *         description: ID do processo no acervo
 *     responses:
 *       200:
 *         description: Processo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Acervo'
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 id_pje: 12345
 *                 advogado_id: 1
 *                 origem: "acervo_geral"
 *                 trt: "TRT3"
 *                 grau: "primeiro_grau"
 *                 numero_processo: "0010014-94.2025.5.03.0022"
 *                 numero: 10014
 *                 descricao_orgao_julgador: "1ª Vara do Trabalho de São Paulo"
 *                 classe_judicial: "ATOrd"
 *                 segredo_justica: false
 *                 codigo_status_processo: "DISTRIBUIDO"
 *                 prioridade_processual: 0
 *                 nome_parte_autora: "João Silva"
 *                 qtde_parte_autora: 1
 *                 nome_parte_re: "Empresa XYZ Ltda"
 *                 qtde_parte_re: 1
 *                 data_autuacao: "2025-01-10T13:03:15.862Z"
 *                 juizo_digital: false
 *                 data_arquivamento: null
 *                 data_proxima_audiencia: null
 *                 tem_associacao: false
 *                 responsavel_id: null
 *                 created_at: "2025-01-10T13:03:15.862Z"
 *                 updated_at: "2025-01-10T13:03:15.862Z"
 *       404:
 *         description: Processo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Processo não encontrado"
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "ID inválido"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    const acervoId = parseInt(id, 10);

    if (isNaN(acervoId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Buscar processo do acervo
    const acervo = await obterAcervoPorId(acervoId);

    if (!acervo) {
      return NextResponse.json(
        { error: 'Processo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: acervo,
    });
  } catch (error) {
    console.error('Erro ao buscar acervo:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

