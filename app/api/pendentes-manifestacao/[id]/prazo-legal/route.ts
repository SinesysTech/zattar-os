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
      .from('pendentes_manifestacao')
      .select('*')
      .eq('id', expedienteId)
      .limit(1)
      .single()
    if (getError) {
      return NextResponse.json({ error: 'Expediente não encontrado' }, { status: 404 })
    }

    const baixadoEm = registro.baixado_em as string | null
    let novoPrazoVencido = registro.prazo_vencido as boolean
    if (dataPrazoLegal) {
      const agora = new Date()
      const fim = new Date(dataPrazoLegal)
      novoPrazoVencido = !baixadoEm && fim.getTime() < agora.getTime()
    } else {
      novoPrazoVencido = false
    }

    const { data: updated, error: updError } = await supabase
      .from('pendentes_manifestacao')
      .update({ data_prazo_legal_parte: dataPrazoLegal, prazo_vencido: novoPrazoVencido })
      .eq('id', expedienteId)
      .select('*')
      .single()
    if (updError) {
      return NextResponse.json({ error: updError.message || 'Erro ao atualizar prazo' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
