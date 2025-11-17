// Rota de API para usuários
// GET: Listar usuários | POST: Criar usuário

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { obterUsuarios } from '@/backend/usuarios/services/usuarios/listar-usuarios.service';
import { cadastrarUsuario } from '@/backend/usuarios/services/usuarios/criar-usuario.service';
import type { UsuarioDados, ListarUsuariosParams } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Lista usuários do sistema
 *     description: Retorna uma lista paginada de usuários com filtros opcionais
 *     tags:
 *       - Usuários
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
 *         description: Busca em nome completo, nome de exibição, CPF ou e-mail corporativo
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *       - in: query
 *         name: oab
 *         schema:
 *           type: string
 *         description: Filtrar por número da OAB
 *       - in: query
 *         name: ufOab
 *         schema:
 *           type: string
 *         description: Filtrar por UF da OAB
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo usuário
 *     description: Cadastra um novo usuário no sistema
 *     tags:
 *       - Usuários
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
 *               - nomeCompleto
 *               - nomeExibicao
 *               - cpf
 *               - emailCorporativo
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *               nomeExibicao:
 *                 type: string
 *               cpf:
 *                 type: string
 *               rg:
 *                 type: string
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *               genero:
 *                 type: string
 *                 enum: [masculino, feminino, outro, prefiro_nao_informar]
 *               oab:
 *                 type: string
 *               ufOab:
 *                 type: string
 *               emailPessoal:
 *                 type: string
 *               emailCorporativo:
 *                 type: string
 *               telefone:
 *                 type: string
 *               ramal:
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
 *               authUserId:
 *                 type: string
 *                 format: uuid
 *               ativo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
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
    const params: ListarUsuariosParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      busca: searchParams.get('busca') || undefined,
      ativo: searchParams.get('ativo') === 'true' ? true : searchParams.get('ativo') === 'false' ? false : undefined,
      oab: searchParams.get('oab') || undefined,
      ufOab: searchParams.get('ufOab') || undefined,
    };

    // 3. Listar usuários
    const resultado = await obterUsuarios(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
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
    const dadosUsuario = body as UsuarioDados;

    // Validações básicas
    if (!dadosUsuario.nomeCompleto || !dadosUsuario.nomeExibicao || !dadosUsuario.cpf || !dadosUsuario.emailCorporativo) {
      return NextResponse.json(
        { error: 'Missing required fields: nomeCompleto, nomeExibicao, cpf, emailCorporativo' },
        { status: 400 }
      );
    }

    // 3. Criar usuário
    const resultado = await cadastrarUsuario(dadosUsuario);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao criar usuário' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: resultado.usuario,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

