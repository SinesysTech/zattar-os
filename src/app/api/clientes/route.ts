// Rota de API para clientes
// GET: Listar clientes | POST: Criar cliente

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarClientes,
  criarCliente,
  type CreateClienteInput,
  type ListarClientesParams,
  toAppError,
  errorCodeToHttpStatus,
  isPartesError,
} from '@/core/partes';

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Lista clientes do sistema
 *     description: Retorna uma lista paginada de clientes com filtros opcionais
 *     tags:
 *       - Clientes
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
 *         description: Filtrar por tipo de pessoa (física ou jurídica)
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
 *         description: Lista de clientes retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo cliente
 *     description: Cadastra um novo cliente no sistema (pessoa física ou jurídica)
 *     tags:
 *       - Clientes
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
 *                 description: CPF do cliente (obrigatório se tipoPessoa = 'pf')
 *               cnpj:
 *                 type: string
 *                 description: CNPJ do cliente (obrigatório se tipoPessoa = 'pj')
 *               rg:
 *                 type: string
 *                 description: RG do cliente (apenas para PF)
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento (apenas para PF)
 *               genero:
 *                 type: string
 *                 enum: [masculino, feminino, outro, prefiro_nao_informar]
 *                 description: Gênero do cliente (apenas para PF)
 *               estadoCivil:
 *                 type: string
 *                 enum: [solteiro, casado, divorciado, viuvo, uniao_estavel, outro]
 *                 description: Estado civil (apenas para PF)
 *               nacionalidade:
 *                 type: string
 *                 description: Nacionalidade (apenas para PF)
 *               naturalidade:
 *                 type: string
 *                 description: Naturalidade - cidade/estado de nascimento (apenas para PF)
 *               inscricaoEstadual:
 *                 type: string
 *                 description: Inscrição estadual (apenas para PJ)
 *               email:
 *                 type: string
 *                 description: E-mail do cliente
 *               telefonePrimario:
 *                 type: string
 *                 description: Telefone primário
 *               telefoneSecundario:
 *                 type: string
 *                 description: Telefone secundário
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
 *                 description: Observações gerais sobre o cliente
 *               endereco_id:
 *                 type: integer
 *                 description: ID do endereço na tabela enderecos (FK)
 *               createdBy:
 *                 type: integer
 *                 description: ID do usuário que está criando o cliente
 *               ativo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *       400:
 *         description: Dados inválidos ou duplicados
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticacao
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter parametros da query string
    const { searchParams } = new URL(request.url);
    const params: ListarClientesParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      busca: searchParams.get('busca') || undefined,
      tipo_pessoa: (searchParams.get('tipo_pessoa') as 'pf' | 'pj' | null) || undefined,
      trt: searchParams.get('trt') || undefined,
      grau: (searchParams.get('grau') as 'primeiro_grau' | 'segundo_grau' | null) || undefined,
      incluir_endereco: searchParams.get('incluir_endereco') === 'true',
      incluir_processos: searchParams.get('incluir_processos') === 'true',
    };

    // 3. Listar clientes via core service (Result pattern)
    const result = await listarClientes(params);

    if (!result.success) {
      const status = errorCodeToHttpStatus(result.error.code);
      return NextResponse.json(
        {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data.data,
      pagination: result.data.pagination,
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);

    // Converter erros de dominio para AppError
    if (isPartesError(error)) {
      const appErr = toAppError(error);
      const status = errorCodeToHttpStatus(appErr.code);
      return NextResponse.json(
        { error: appErr.message, code: appErr.code, details: appErr.details },
        { status }
      );
    }

    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticacao
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validar e parsear body da requisicao
    const body = await request.json();
    const input = body as CreateClienteInput;

    // 3. Criar cliente via core service (Result pattern)
    // O service faz validacao completa via Zod e retorna Result<Cliente>
    const result = await criarCliente(input);

    if (!result.success) {
      const status = errorCodeToHttpStatus(result.error.code);
      return NextResponse.json(
        {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar cliente:', error);

    // Converter erros de dominio para AppError
    if (isPartesError(error)) {
      const appErr = toAppError(error);
      const status = errorCodeToHttpStatus(appErr.code);
      return NextResponse.json(
        { error: appErr.message, code: appErr.code, details: appErr.details },
        { status }
      );
    }

    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

