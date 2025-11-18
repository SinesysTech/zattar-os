/**
 * API Routes: /api/cargos
 * GET - Listar cargos
 * POST - Criar cargo
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import {
  listarCargos,
  criarCargo,
  buscarCargoPorNome,
} from '@/backend/cargos/services/persistence/cargo-persistence.service';
import { validarCriarCargoDTO } from '@/backend/types/cargos/types';

/**
 * GET /api/cargos
 * Listar cargos com filtros e paginação
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extrair query params
    const { searchParams } = new URL(request.url);
    const pagina = parseInt(searchParams.get('pagina') || '1', 10);
    const limite = parseInt(searchParams.get('limite') || '50', 10);
    const busca = searchParams.get('busca') || undefined;
    const ativo = searchParams.get('ativo')
      ? searchParams.get('ativo') === 'true'
      : undefined;
    const ordenarPor = (searchParams.get('ordenarPor') || 'nome') as any;
    const ordem = (searchParams.get('ordem') || 'asc') as 'asc' | 'desc';

    // Listar cargos
    const resultado = await listarCargos({
      pagina,
      limite,
      busca,
      ativo,
      ordenarPor,
      ordem,
    });

    return NextResponse.json(
      {
        success: true,
        data: resultado,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao listar cargos:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cargos
 * Criar novo cargo
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuarioId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();

    // Validar DTO
    if (!validarCriarCargoDTO(body)) {
      return NextResponse.json(
        { error: 'Dados inválidos. Campo "nome" é obrigatório.' },
        { status: 400 }
      );
    }

    // Verificar se nome já existe
    const cargoExistente = await buscarCargoPorNome(body.nome);
    if (cargoExistente) {
      return NextResponse.json(
        { error: 'Cargo com este nome já existe' },
        { status: 400 }
      );
    }

    // Criar cargo
    const cargo = await criarCargo(body, authResult.usuarioId);

    return NextResponse.json(
      {
        success: true,
        data: cargo,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar cargo:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
