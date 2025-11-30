/**
 * API Route: /api/partes/processo-partes/processo/[processo_id]/polo/[polo]
 * Busca partes de um processo filtradas por polo processual
 * Retorna dados completos da entidade (nome, cpf, cnpj, contato)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarPartesPorProcesso } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';
import type { PoloProcessoParte } from '@/backend/types/partes/processo-partes-types';

type RouteContext = {
  params: Promise<{
    processo_id: string;
    polo: string;
  }>;
};

const POLOS_VALIDOS: PoloProcessoParte[] = ['ATIVO', 'PASSIVO', 'NEUTRO', 'TERCEIRO'];

/**
 * @swagger
 * /api/partes/processo-partes/processo/{processo_id}/polo/{polo}:
 *   get:
 *     summary: Busca partes de um processo por polo
 *     description: |
 *       Retorna todas as partes vinculadas a um processo em um polo específico,
 *       com dados completos da entidade (nome, CPF/CNPJ, emails, telefones).
 *       Também destaca a parte principal do polo.
 *     tags: [Processo-Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: processo_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do processo no acervo
 *       - in: path
 *         name: polo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ATIVO, PASSIVO, NEUTRO, TERCEIRO]
 *         description: Polo processual (ATIVO=parte autora, PASSIVO=parte ré)
 *     responses:
 *       200:
 *         description: Lista de partes do polo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     partes:
 *                       type: array
 *                       description: Todas as partes do polo
 *                       items:
 *                         $ref: '#/components/schemas/ParteComDadosCompletos'
 *                     principal:
 *                       description: Parte principal do polo (ou primeira por ordem)
 *                       $ref: '#/components/schemas/ParteComDadosCompletos'
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse path parameters
    const { processo_id, polo } = await context.params;
    const processoId = parseInt(processo_id);

    if (isNaN(processoId) || processoId <= 0) {
      return NextResponse.json(
        { success: false, error: 'processo_id inválido' },
        { status: 400 }
      );
    }

    const poloUpper = polo.toUpperCase() as PoloProcessoParte;
    if (!POLOS_VALIDOS.includes(poloUpper)) {
      return NextResponse.json(
        { success: false, error: `polo inválido. Valores aceitos: ${POLOS_VALIDOS.join(', ')}` },
        { status: 400 }
      );
    }

    // Find partes with full entity data
    const partes = await buscarPartesPorProcesso({
      processo_id: processoId,
      polo: poloUpper,
    });

    // Find principal (marked as principal=true, or first by order)
    const principal = partes.find(p => p.principal) || partes[0] || null;

    return NextResponse.json(
      {
        success: true,
        data: {
          partes,
          principal,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao buscar partes por polo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar partes por polo' },
      { status: 500 }
    );
  }
}
