// Rota de API para terceiros
// GET: Listar terceiros

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { listarTerceiros } from '@/backend/partes/services/terceiros-persistence.service';
import type { ListarTerceirosParams } from '@/backend/types/partes/terceiros-types';

/**
 * @swagger
 * /api/partes/terceiros:
 *   get:
 *     summary: Lista terceiros
 *     description: Retorna uma lista paginada de terceiros (peritos, MP, assistentes, etc.)
 *     tags:
 *       - Partes
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
 *         description: Busca em nome, CPF, CNPJ ou nome social
 *       - in: query
 *         name: tipo_pessoa
 *         schema:
 *           type: string
 *           enum: [pf, pj]
 *         description: Filtrar por tipo de pessoa (física ou jurídica)
 *       - in: query
 *         name: tipo_parte
 *         schema:
 *           type: string
 *           enum: [perito, ministerio_publico, assistente, testemunha, custos_legis, amicus_curiae, outro]
 *         description: Filtrar por tipo de parte
 *       - in: query
 *         name: polo
 *         schema:
 *           type: string
 *           enum: [ativo, passivo]
 *         description: Filtrar por polo
 *       - in: query
 *         name: situacao
 *         schema:
 *           type: string
 *           enum: [A, I]
 *         description: Filtrar por situação (ativo/inativo)
 *     responses:
 *       200:
 *         description: Lista de terceiros retornada com sucesso
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
    const params: ListarTerceirosParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      busca: searchParams.get('busca') || undefined,
      tipo_pessoa: (searchParams.get('tipo_pessoa') as 'pf' | 'pj' | null) || undefined,
      tipo_parte: (searchParams.get('tipo_parte') as ListarTerceirosParams['tipo_parte']) || undefined,
      polo: (searchParams.get('polo') as ListarTerceirosParams['polo']) || undefined,
    };

    // 3. Listar terceiros
    const resultado = await listarTerceiros(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar terceiros:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
