// Rota de API para partes contrárias
// GET: Listar partes contrárias

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  obterPartesContrarias,
  type ObterPartesContrariasParams,
} from '@/backend/partes-contrarias/services/partes-contrarias/listar-partes-contrarias.service';

/**
 * @swagger
 * /api/partes/partes-contrarias:
 *   get:
 *     summary: Lista partes contrárias
 *     description: Retorna uma lista paginada de partes contrárias (clientes no polo passivo)
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
 *         description: Busca em nome, nome fantasia, CPF, CNPJ ou e-mail
 *       - in: query
 *         name: tipo_pessoa
 *         schema:
 *           type: string
 *           enum: [pf, pj]
 *         description: Filtrar por tipo de pessoa (física ou jurídica)
 *       - in: query
 *         name: situacao
 *         schema:
 *           type: string
 *           enum: [A, I]
 *         description: Filtrar por situação (ativo/inativo)
 *     responses:
 *       200:
 *         description: Lista de partes contrárias retornada com sucesso
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
    const params: ObterPartesContrariasParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      busca: searchParams.get('busca') || undefined,
      tipo_pessoa: (searchParams.get('tipo_pessoa') as 'pf' | 'pj' | null) || undefined,
      incluir_endereco: false,
    };

    // 3. Listar partes contrárias com o serviço dedicado
    const resultado = await obterPartesContrarias(params);

    // 4. Responder no formato esperado pelo frontend
    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar partes contrárias:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
