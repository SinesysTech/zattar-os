/**
 * @swagger
 * /api/expedientes-manuais/cliente/cpf/{cpf}:
 *   get:
 *     summary: Busca expedientes manuais por CPF do cliente
 *     description: Retorna todos os expedientes dos processos relacionados ao cliente com o CPF informado
 *     tags:
 *       - Expedientes Manuais
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do cliente (com ou sem formatação)
 *     responses:
 *       200:
 *         description: Lista de expedientes encontrados (pode ser vazia)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: CPF inválido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       500:
 *         description: Erro interno do servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { verificarPermissoes } from '@/backend/permissoes/services/persistence/permissao-persistence.service';
import { buscarExpedientesPorClienteCPF } from '@/backend/expedientes/services/persistence/expedientes-manuais-persistence.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cpf: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Permissão
    const temPermissao = await verificarPermissoes(
      authResult.usuarioId,
      'expedientes_manuais',
      'visualizar'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar expedientes manuais' },
        { status: 403 }
      );
    }

    // 3. Obter CPF do parâmetro
    const { cpf } = await params;

    if (!cpf || !cpf.trim()) {
      return NextResponse.json(
        { success: false, error: 'CPF é obrigatório' },
        { status: 400 }
      );
    }

    // 4. Buscar expedientes
    const expedientes = await buscarExpedientesPorClienteCPF(cpf);

    return NextResponse.json({
      success: true,
      data: expedientes,
    });
  } catch (error) {
    console.error('Erro ao buscar expedientes por CPF do cliente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { success: false, error: erroMsg },
      { status: 500 }
    );
  }
}
