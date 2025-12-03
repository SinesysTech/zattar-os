// Rota de API para partes contrárias
// GET: Listar partes contrárias | POST: Criar parte contrária

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterPartesContrarias } from '@/backend/partes-contrarias/services/partes-contrarias/listar-partes-contrarias.service';
import { cadastrarParteContraria } from '@/backend/partes-contrarias/services/partes-contrarias/criar-parte-contraria.service';
import type {
  CriarParteContrariaParams,
} from '@/backend/types/partes';

/**
 * @swagger
 * /api/partes-contrarias:
 *   get:
 *     summary: Lista partes contrárias
 *     description: Retorna uma lista paginada de partes contrárias com filtros opcionais
 *     tags:
 *       - Partes Contrárias
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
 *         name: tipoPessoa
 *         schema:
 *           type: string
 *           enum: [pf, pj]
 *         description: Filtrar por tipo de pessoa
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *       - in: query
 *         name: incluir_endereco
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Se true, inclui dados de endereço via JOIN
 *     responses:
 *       200:
 *         description: Lista de partes contrárias retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria uma nova parte contrária
 *     description: Cadastra uma nova parte contrária (pessoa física ou jurídica)
 *     tags:
 *       - Partes Contrárias
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
 *               - tipoPessoa
 *               - nome
 *             properties:
 *               tipoPessoa:
 *                 type: string
 *                 enum: [pf, pj]
 *                 description: Tipo de pessoa (pf para física, pj para jurídica)
 *               nome:
 *                 type: string
 *                 description: Nome completo (PF) ou Razão Social (PJ)
 *               nomeFantasia:
 *                 type: string
 *                 description: Nome social (PF) ou Nome fantasia (PJ)
 *               cpf:
 *                 type: string
 *                 description: CPF (obrigatório para PF)
 *               cnpj:
 *                 type: string
 *                 description: CNPJ (obrigatório para PJ)
 *               rg:
 *                 type: string
 *                 description: RG (apenas para PF)
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *               genero:
 *                 type: string
 *                 enum: [masculino, feminino, outro, prefiro_nao_informar]
 *               estadoCivil:
 *                 type: string
 *                 enum: [solteiro, casado, divorciado, viuvo, uniao_estavel, outro]
 *               nacionalidade:
 *                 type: string
 *               inscricaoEstadual:
 *                 type: string
 *                 description: Inscrição estadual (PF ou PJ)
 *               email:
 *                 type: string
 *               telefonePrimario:
 *                 type: string
 *               telefoneSecundario:
 *                 type: string
 *               endereco:
 *                 type: object
 *                 properties:
 *                   logradouro:
 *                     type: string
 *                   numero:
 *                     type: string
 *                   complemento:
 *                     type: string
 *                   bairro:
 *                     type: string
 *                   cidade:
 *                     type: string
 *                   estado:
 *                     type: string
 *                   pais:
 *                     type: string
 *                   cep:
 *                     type: string
 *               observacoes:
 *                 type: string
 *               endereco_id:
 *                 type: integer
 *                 description: ID do endereço na tabela enderecos (FK)
 *               createdBy:
 *                 type: integer
 *                 description: ID do usuário que está criando o registro
 *               ativo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Parte contrária criada com sucesso
 *       400:
 *         description: Dados inválidos ou duplicados
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
    const params = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      busca: searchParams.get('busca') || undefined,
      tipo_pessoa: (searchParams.get('tipo_pessoa') as 'pf' | 'pj' | null) || undefined,
      trt: searchParams.get('trt') || undefined,
      grau: (searchParams.get('grau') as 'primeiro_grau' | 'segundo_grau' | null) || undefined,
      incluir_endereco: searchParams.get('incluir_endereco') === 'true',
      incluir_processos: searchParams.get('incluir_processos') === 'true',
    };

    const resultado = await obterPartesContrarias(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar partes contrárias:', error);
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
    const dadosParteContraria = body as CriarParteContrariaParams;

    if (!dadosParteContraria.tipo_pessoa || !dadosParteContraria.nome) {
      return NextResponse.json(
        { error: 'Missing required fields: tipo_pessoa, nome' },
        { status: 400 },
      );
    }

    const resultado = await cadastrarParteContraria(dadosParteContraria);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao criar parte contrária' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: resultado.parteContraria,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Erro ao criar parte contrária:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 },
    );
  }
}

