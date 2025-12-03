/**
 * @swagger
 * /api/cargos/{id}:
 *   get:
 *     summary: Busca um cargo por ID
 *     description: Retorna os detalhes de um cargo específico
 *     tags:
 *       - Cargos
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cargo
 *     responses:
 *       200:
 *         description: Cargo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     descricao:
 *                       type: string
 *                     ativo:
 *                       type: boolean
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Cargo não encontrado
 *   put:
 *     summary: Atualiza um cargo
 *     description: Atualiza os dados de um cargo existente
 *     tags:
 *       - Cargos
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cargo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cargo atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Cargo não encontrado
 *   delete:
 *     summary: Deleta um cargo
 *     description: Remove um cargo do sistema (falha se houver usuários associados)
 *     tags:
 *       - Cargos
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cargo
 *     responses:
 *       200:
 *         description: Cargo deletado com sucesso
 *       400:
 *         description: Não é possível deletar (usuários associados)
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Cargo não encontrado
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import {
  buscarCargoPorId,
  atualizarCargo,
  deletarCargo,
  contarUsuariosComCargo,
  listarUsuariosComCargo,
} from '@/backend/cargos/services/persistence/cargo-persistence.service';
import { validarAtualizarCargoDTO } from '@/backend/types/cargos/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permissão: cargos.visualizar
    const authOrError = await requirePermission(request, 'cargos', 'visualizar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const cargo = await buscarCargoPorId(id);

    if (!cargo) {
      return NextResponse.json({ error: 'Cargo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: cargo }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permissão: cargos.editar
    const authOrError = await requirePermission(request, 'cargos', 'editar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const body = await request.json();

    if (!validarAtualizarCargoDTO(body)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const cargo = await atualizarCargo(id, body);
    return NextResponse.json({ success: true, data: cargo }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permissão: cargos.deletar
    const authOrError = await requirePermission(request, 'cargos', 'deletar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    // Verificar se cargo existe
    const cargo = await buscarCargoPorId(id);
    if (!cargo) {
      return NextResponse.json({ error: 'Cargo não encontrado' }, { status: 404 });
    }

    // Verificar se há usuários associados
    const totalUsuarios = await contarUsuariosComCargo(id);
    if (totalUsuarios > 0) {
      const usuarios = await listarUsuariosComCargo(id);
      const nomesUsuarios = usuarios.map((u) => u.nome_completo).join(', ');

      return NextResponse.json(
        {
          error: `Não é possível deletar o cargo. ${totalUsuarios} usuário(s) associado(s): ${nomesUsuarios}`,
          cargoId: id,
          cargoNome: cargo.nome,
          totalUsuarios,
          usuarios,
        },
        { status: 400 }
      );
    }

    await deletarCargo(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 });
  }
}
