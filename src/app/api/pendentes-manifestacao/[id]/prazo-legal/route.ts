/**
 * @swagger
 * /api/pendentes-manifestacao/{id}/prazo-legal:
 *   patch:
 *     summary: Atualiza prazo legal de expediente pendente
 *     description: Atualiza a data do prazo legal de um expediente pendente de manifestação
 *     tags:
 *       - Pendentes Manifestação
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do expediente pendente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dataPrazoLegal:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Nova data do prazo legal (ISO 8601) ou null para remover
 *     responses:
 *       200:
 *         description: Prazo legal atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Expediente não encontrado
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/backend/auth/api-auth'
import { createServiceClient } from '@/backend/utils/supabase/service-client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const expedienteId = parseInt(id, 10)
    if (isNaN(expedienteId) || expedienteId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const dataPrazoLegal: string | null = body.dataPrazoLegal ?? null
    if (dataPrazoLegal !== null && typeof dataPrazoLegal !== 'string') {
      return NextResponse.json({ error: 'dataPrazoLegal deve ser string ISO ou null' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: registro, error: getError } = await supabase
      .from('expedientes')
      .select('*')
      .eq('id', expedienteId)
      .limit(1)
      .single()
    if (getError) {
      return NextResponse.json({ error: 'Expediente não encontrado' }, { status: 404 })
    }

    const baixadoEm = registro.baixado_em as string | null
    const dataCienciaAtual = registro.data_ciencia_parte as string | null
    const createdAt = registro.created_at as string | null
    
    let novoPrazoVencido = registro.prazo_vencido as boolean
    if (dataPrazoLegal) {
      const agora = new Date()
      const fim = new Date(dataPrazoLegal)
      novoPrazoVencido = !baixadoEm && fim.getTime() < agora.getTime()
    } else {
      novoPrazoVencido = false
    }

    // Preparar dados para atualização
    const updateData: Record<string, string | boolean | null> = {
      data_prazo_legal_parte: dataPrazoLegal,
      prazo_vencido: novoPrazoVencido
    }

    // Se não tem data de início (ciência) e estamos definindo uma data de fim,
    // usa a data de criação do expediente como data de início
    if (!dataCienciaAtual && dataPrazoLegal && createdAt) {
      updateData.data_ciencia_parte = createdAt
    }

    const { data: updated, error: updError } = await supabase
      .from('expedientes')
      .update(updateData)
      .eq('id', expedienteId)
      .select('*')
      .single()
    if (updError) {
      return NextResponse.json({ error: updError.message || 'Erro ao atualizar prazo' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
