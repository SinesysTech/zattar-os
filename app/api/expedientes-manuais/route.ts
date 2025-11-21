/**
 * API de expedientes manuais
 * GET: Listar expedientes manuais com filtros
 * POST: Criar novo expediente manual
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { verificarPermissoes } from '@/backend/permissoes/services/persistence/permissao-persistence.service';
import {
  criarExpedienteManual,
  listarExpedientesManuais,
} from '@/backend/expedientes/services/persistence/expedientes-manuais-persistence.service';
import { CriarExpedienteManualParams } from '@/backend/types/expedientes-manuais/types';

/**
 * GET /api/expedientes-manuais
 * Listar expedientes manuais com filtros e paginação
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const { user } = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Permissão
    const temPermissao = await verificarPermissoes(
      user.id,
      'expedientes_manuais',
      'read'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar expedientes manuais' },
        { status: 403 }
      );
    }

    // Parâmetros da query
    const searchParams = request.nextUrl.searchParams;
    const pagina = parseInt(searchParams.get('pagina') || '0');
    const limite = parseInt(searchParams.get('limite') || '20');
    const busca = searchParams.get('busca') || undefined;
    const processo_id = searchParams.get('processo_id')
      ? parseInt(searchParams.get('processo_id')!)
      : undefined;
    const trt = searchParams.get('trt') || undefined;
    const grau = searchParams.get('grau') || undefined;
    const tipo_expediente_id = searchParams.get('tipo_expediente_id')
      ? parseInt(searchParams.get('tipo_expediente_id')!)
      : undefined;
    const responsavel_id =
      searchParams.get('responsavel_id') === 'null'
        ? 'null'
        : searchParams.get('responsavel_id')
        ? parseInt(searchParams.get('responsavel_id')!)
        : undefined;
    const prazo_vencido = searchParams.get('prazo_vencido')
      ? searchParams.get('prazo_vencido') === 'true'
      : undefined;
    const baixado = searchParams.get('baixado')
      ? searchParams.get('baixado') === 'true'
      : undefined;
    const criado_por = searchParams.get('criado_por')
      ? parseInt(searchParams.get('criado_por')!)
      : undefined;
    const data_prazo_legal_inicio = searchParams.get('data_prazo_legal_inicio') || undefined;
    const data_prazo_legal_fim = searchParams.get('data_prazo_legal_fim') || undefined;
    const ordenar_por = searchParams.get('ordenar_por') || 'created_at';
    const ordem = searchParams.get('ordem') || 'desc';

    // Listar expedientes
    const result = await listarExpedientesManuais({
      pagina,
      limite,
      busca,
      processo_id,
      trt: trt as any,
      grau: grau as any,
      tipo_expediente_id,
      responsavel_id: responsavel_id as any,
      prazo_vencido,
      baixado,
      criado_por,
      data_prazo_legal_inicio,
      data_prazo_legal_fim,
      ordenar_por: ordenar_por as any,
      ordem: ordem as any,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    console.error('[API] Erro ao listar expedientes manuais:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao listar expedientes manuais' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expedientes-manuais
 * Criar novo expediente manual
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const { user } = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Permissão
    const temPermissao = await verificarPermissoes(
      user.id,
      'expedientes_manuais',
      'create'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para criar expedientes manuais' },
        { status: 403 }
      );
    }

    // Body da requisição
    const body: CriarExpedienteManualParams = await request.json();

    // Validações
    if (!body.processo_id) {
      return NextResponse.json(
        { success: false, error: 'processo_id é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.descricao || body.descricao.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'descricao é obrigatória' },
        { status: 400 }
      );
    }

    // Criar expediente
    const expediente = await criarExpedienteManual(body, user.id);

    return NextResponse.json(
      { success: true, data: expediente },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API] Erro ao criar expediente manual:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar expediente manual' },
      { status: 500 }
    );
  }
}
