// Rota de API para assistentes
// GET: Listar assistentes | POST: Criar assistente

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { listarAssistentes } from '@/backend/assistentes/services/listar-assistentes.service';
import { criarAssistente } from '@/backend/assistentes/services/criar-assistente.service';
import { createClient } from '@/backend/utils/supabase/server';

/**
 * Verifica se o usuário autenticado é super admin
 */
async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('isSuperAdmin')
    .eq('auth_user_id', user.id)
    .single();

  return usuario?.isSuperAdmin === true;
}

/**
 * @swagger
 * /api/assistentes:
 *   get:
 *     summary: Lista assistentes do sistema
 *     description: Retorna uma lista paginada de assistentes com filtros opcionais. Apenas super admins podem acessar.
 *     tags:
 *       - Assistentes
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
 *         description: Busca em nome e descrição
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *     responses:
 *       200:
 *         description: Lista de assistentes retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado (não é super admin)
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo assistente
 *     description: Cadastra um novo assistente no sistema. Apenas super admins podem criar.
 *     tags:
 *       - Assistentes
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
 *               - nome
 *               - iframe_code
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do assistente
 *               descricao:
 *                 type: string
 *                 description: Descrição do assistente (opcional)
 *               iframe_code:
 *                 type: string
 *                 description: Código HTML do iframe
 *     responses:
 *       201:
 *         description: Assistente criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado (não é super admin)
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verificar se é super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado: apenas super admins podem acessar assistentes' },
        { status: 403 }
      );
    }

    // 3. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);
    const params = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : 1,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : 50,
      busca: searchParams.get('busca') || undefined,
      ativo: searchParams.get('ativo') === 'true' ? true : searchParams.get('ativo') === 'false' ? false : undefined,
    };

    // 4. Listar assistentes
    const resultado = await listarAssistentes(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar assistentes:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { success: false, error: erroMsg },
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
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verificar se é super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado: apenas super admins podem criar assistentes' },
        { status: 403 }
      );
    }

    // 3. Validar e parsear body da requisição
    const body = await request.json();
    const { nome, descricao, iframe_code } = body;

    // Validações básicas
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0 || nome.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório e deve ter entre 1 e 200 caracteres' },
        { status: 400 }
      );
    }

    if (!iframe_code || typeof iframe_code !== 'string' || iframe_code.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Código do iframe é obrigatório' },
        { status: 400 }
      );
    }

    if (descricao && (typeof descricao !== 'string' || descricao.length > 1000)) {
      return NextResponse.json(
        { success: false, error: 'Descrição deve ter no máximo 1000 caracteres' },
        { status: 400 }
      );
    }

    // 4. Obter ID numérico do usuário logado para criado_por
    // criado_por referencia usuarios.id (bigint), não auth_user_id (uuid)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    // Buscar o ID numérico do usuário na tabela usuarios usando auth_user_id
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (usuarioError || !usuario) {
      console.error('Erro ao buscar usuário:', usuarioError);
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado no sistema' },
        { status: 401 }
      );
    }

    // 5. Criar assistente
    const resultado = await criarAssistente({
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      iframe_code: iframe_code.trim(),
      criado_por: usuario.id, // usuarios.id (bigint), não auth_user_id
    });

    // Verificar resultado do serviço
    if (!resultado.sucesso) {
      return NextResponse.json(
        { success: false, error: resultado.erro || 'Erro ao criar assistente' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: resultado.assistente,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar assistente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { success: false, error: erroMsg },
      { status: 500 }
    );
  }
}