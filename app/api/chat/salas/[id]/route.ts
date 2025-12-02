import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/backend/auth/api-auth'
import { obterUsuarioPorId } from '@/backend/usuarios/services/usuarios/buscar-usuario.service'
import { buscarSalaChatPorId, deletarSalaChat, atualizarSalaChatNome } from '@/backend/documentos/services/persistence/chat-persistence.service'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated || !auth.usuarioId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const salaId = Number(id)
    if (!Number.isFinite(salaId)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    const sala = await buscarSalaChatPorId(salaId)
    if (!sala) {
      return NextResponse.json({ success: false, error: 'Sala não encontrada' }, { status: 404 })
    }

    if (sala.tipo === 'geral') {
      return NextResponse.json({ success: false, error: 'Sala Geral não pode ser deletada' }, { status: 400 })
    }

    const usuario = await obterUsuarioPorId(auth.usuarioId)
    const isSuperAdmin = usuario?.isSuperAdmin === true

    // Regras:
    // - Grupos: criador ou superadmin
    // - Privado: apenas criador
    // - Documento: não deletável por aqui (pode ser implementado depois)
    const podeDeletar = sala.tipo === 'grupo'
      ? isSuperAdmin || sala.criado_por === auth.usuarioId
      : sala.tipo === 'privado'
      ? sala.criado_por === auth.usuarioId
      : false

    if (!podeDeletar) {
      return NextResponse.json({ success: false, error: 'Sem permissão para deletar esta sala' }, { status: 403 })
    }

    await deletarSalaChat(salaId)
    return NextResponse.json({ success: true, data: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated || !auth.usuarioId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const salaId = Number(id)
    if (!Number.isFinite(salaId)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const nome = String(body?.nome || '').trim()
    if (!nome) {
      return NextResponse.json({ success: false, error: 'Nome é obrigatório' }, { status: 400 })
    }

    const sala = await buscarSalaChatPorId(salaId)
    if (!sala) {
      return NextResponse.json({ success: false, error: 'Sala não encontrada' }, { status: 404 })
    }

    if (sala.tipo !== 'grupo') {
      return NextResponse.json({ success: false, error: 'Apenas grupos podem ser renomeados' }, { status: 400 })
    }

    const usuario = await obterUsuarioPorId(auth.usuarioId)
    const isSuperAdmin = usuario?.isSuperAdmin === true
    const podeEditar = isSuperAdmin || sala.criado_por === auth.usuarioId

    if (!podeEditar) {
      return NextResponse.json({ success: false, error: 'Sem permissão para editar este grupo' }, { status: 403 })
    }

    const atualizada = await atualizarSalaChatNome(salaId, nome)
    return NextResponse.json({ success: true, data: atualizada })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
