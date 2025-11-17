// Rota de API para clientes
// GET: Listar clientes | POST: Criar cliente

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { obterClientes } from '@/backend/clientes/services/clientes/listar-clientes.service';
import { cadastrarCliente } from '@/backend/clientes/services/clientes/criar-cliente.service';
import type { ClienteDados, ListarClientesParams } from '@/backend/clientes/services/persistence/cliente-persistence.service';

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
    const params: ListarClientesParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      busca: searchParams.get('busca') || undefined,
      tipoPessoa: (searchParams.get('tipoPessoa') as 'pf' | 'pj' | null) || undefined,
      ativo: searchParams.get('ativo') === 'true' ? true : searchParams.get('ativo') === 'false' ? false : undefined,
    };

    // 3. Listar clientes
    const resultado = await obterClientes(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validar e parsear body da requisição
    const body = await request.json();
    const dadosCliente = body as ClienteDados;

    // Validações básicas
    if (!dadosCliente.tipoPessoa || !dadosCliente.nome) {
      return NextResponse.json(
        { error: 'Missing required fields: tipoPessoa, nome' },
        { status: 400 }
      );
    }

    // 3. Criar cliente
    const resultado = await cadastrarCliente(dadosCliente);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao criar cliente' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: resultado.cliente,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

