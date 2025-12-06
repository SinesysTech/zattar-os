// Rota de API para Plano de Contas
// GET: Listar plano de contas | POST: Criar nova conta

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterPlanoContas } from '@/backend/plano-contas/services/plano-contas/listar-plano-contas.service';
import { criarPlanoConta } from '@/backend/plano-contas/services/plano-contas/gerenciar-plano-contas.service';
import {
  validarCriarPlanoContaDTO,
  type ListarPlanoContasParams,
  type TipoContaContabil,
  type NivelConta,
} from '@/backend/types/financeiro/plano-contas.types';

/**
 * @swagger
 * /api/plano-contas:
 *   get:
 *     summary: Lista o plano de contas
 *     description: Retorna uma lista paginada do plano de contas com filtros opcionais
 *     tags:
 *       - Plano de Contas
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
 *         description: Quantidade de itens por página (máximo 100)
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Busca textual no código ou nome da conta
 *       - in: query
 *         name: tipoConta
 *         schema:
 *           type: string
 *           enum: [ativo, passivo, receita, despesa, patrimonio_liquido]
 *         description: Filtrar por tipo de conta
 *       - in: query
 *         name: nivel
 *         schema:
 *           type: string
 *           enum: [sintetica, analitica]
 *         description: Filtrar por nível da conta
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *       - in: query
 *         name: contaPaiId
 *         schema:
 *           type: integer
 *         description: Filtrar por conta pai (null para contas raiz)
 *       - in: query
 *         name: ordenarPor
 *         schema:
 *           type: string
 *           enum: [codigo, nome, ordem_exibicao, created_at, updated_at]
 *           default: codigo
 *         description: Campo para ordenação
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Direção da ordenação
 *     responses:
 *       200:
 *         description: Lista do plano de contas retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria uma nova conta no plano de contas
 *     description: Cadastra uma nova conta contábil no sistema
 *     tags:
 *       - Plano de Contas
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nome
 *               - tipoConta
 *               - natureza
 *               - nivel
 *             properties:
 *               codigo:
 *                 type: string
 *                 description: Código hierárquico da conta (ex: 1.1.01)
 *               nome:
 *                 type: string
 *                 description: Nome descritivo da conta
 *               descricao:
 *                 type: string
 *                 description: Descrição detalhada (opcional)
 *               tipoConta:
 *                 type: string
 *                 enum: [ativo, passivo, receita, despesa, patrimonio_liquido]
 *               natureza:
 *                 type: string
 *                 enum: [devedora, credora]
 *               nivel:
 *                 type: string
 *                 enum: [sintetica, analitica]
 *               contaPaiId:
 *                 type: integer
 *                 description: ID da conta pai (opcional)
 *               ordemExibicao:
 *                 type: integer
 *                 description: Ordem de exibição (opcional)
 *               ativo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
 *       400:
 *         description: Dados inválidos ou código já existe
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);

    const params: ListarPlanoContasParams = {
      pagina: searchParams.get('pagina')
        ? parseInt(searchParams.get('pagina')!, 10)
        : undefined,
      limite: searchParams.get('limite')
        ? parseInt(searchParams.get('limite')!, 10)
        : undefined,
      busca: searchParams.get('busca') || undefined,
      tipoConta: (searchParams.get('tipoConta') as TipoContaContabil) || undefined,
      nivel: (searchParams.get('nivel') as NivelConta) || undefined,
      ativo:
        searchParams.get('ativo') !== null
          ? searchParams.get('ativo') === 'true'
          : undefined,
      contaPaiId: searchParams.get('contaPaiId')
        ? searchParams.get('contaPaiId') === 'null'
          ? null
          : parseInt(searchParams.get('contaPaiId')!, 10)
        : undefined,
      ordenarPor:
        (searchParams.get('ordenarPor') as
          | 'codigo'
          | 'nome'
          | 'ordem_exibicao'
          | 'created_at'
          | 'updated_at') || undefined,
      ordem: (searchParams.get('ordem') as 'asc' | 'desc') || undefined,
    };

    // 3. Listar plano de contas
    const resultado = await obterPlanoContas(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar plano de contas:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter ID do usuário autenticado
    const usuarioId = authResult.usuarioId;
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o usuário' },
        { status: 401 }
      );
    }

    // 3. Obter dados do body
    const body = await request.json();

    // 4. Validar dados
    if (!validarCriarPlanoContaDTO(body)) {
      return NextResponse.json(
        {
          error:
            'Dados inválidos. Campos obrigatórios: codigo, nome, tipoConta, natureza, nivel',
        },
        { status: 400 }
      );
    }

    // 5. Criar conta
    const planoConta = await criarPlanoConta(body, usuarioId);

    return NextResponse.json(
      {
        success: true,
        data: planoConta,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    // Verificar se é erro de validação
    if (
      erroMsg.includes('já existe') ||
      erroMsg.includes('obrigatório') ||
      erroMsg.includes('inválido') ||
      erroMsg.includes('sintética')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
