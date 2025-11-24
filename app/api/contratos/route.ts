// Rota de API para contratos
// GET: Listar contratos | POST: Criar contrato

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterContratos } from '@/backend/contratos/services/contratos/listar-contratos.service';
import { cadastrarContrato } from '@/backend/contratos/services/contratos/criar-contrato.service';
import type {
  ContratoDados,
  ListarContratosParams,
} from '@/backend/contratos/services/persistence/contrato-persistence.service';

/**
 * @swagger
 * /api/contratos:
 *   get:
 *     summary: Lista contratos do sistema
 *     description: Retorna uma lista paginada de contratos com filtros opcionais
 *     tags:
 *       - Contratos
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
 *         description: Busca em observações
 *       - in: query
 *         name: areaDireito
 *         schema:
 *           type: string
 *           enum: [trabalhista, civil, previdenciario, criminal, empresarial, administrativo]
 *       - in: query
 *         name: tipoContrato
 *         schema:
 *           type: string
 *           enum: [ajuizamento, defesa, ato_processual, assessoria, consultoria, extrajudicial, parecer]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [em_contratacao, contratado, distribuido, desistencia]
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: parteContrariaId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: responsavelId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de contratos retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo contrato
 *     description: Cadastra um novo contrato no sistema
 *     tags:
 *       - Contratos
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContratoDadosRequest'
 *     responses:
 *       201:
 *         description: Contrato criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params: ListarContratosParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      busca: searchParams.get('busca') || undefined,
      areaDireito: (searchParams.get('areaDireito') as ListarContratosParams['areaDireito']) || undefined,
      tipoContrato: (searchParams.get('tipoContrato') as ListarContratosParams['tipoContrato']) || undefined,
      tipoCobranca: (searchParams.get('tipoCobranca') as ListarContratosParams['tipoCobranca']) || undefined,
      status: (searchParams.get('status') as ListarContratosParams['status']) || undefined,
      clienteId: searchParams.get('clienteId') ? parseInt(searchParams.get('clienteId')!, 10) : undefined,
      parteContrariaId: searchParams.get('parteContrariaId') ? parseInt(searchParams.get('parteContrariaId')!, 10) : undefined,
      responsavelId: searchParams.get('responsavelId') ? parseInt(searchParams.get('responsavelId')!, 10) : undefined,
    };

    const resultado = await obterContratos(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar contratos:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const dadosContrato = body as ContratoDados;

    if (
      !dadosContrato.areaDireito ||
      !dadosContrato.tipoContrato ||
      !dadosContrato.tipoCobranca ||
      !dadosContrato.clienteId ||
      !dadosContrato.poloCliente
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: areaDireito, tipoContrato, tipoCobranca, clienteId, poloCliente' },
        { status: 400 },
      );
    }

    const resultado = await cadastrarContrato(dadosContrato);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao criar contrato' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: resultado.contrato,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 },
    );
  }
}

