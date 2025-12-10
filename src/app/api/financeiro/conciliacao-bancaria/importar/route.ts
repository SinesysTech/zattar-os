import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { importarExtrato } from '@/backend/financeiro/conciliacao-bancaria/services/conciliacao-bancaria/importar-extrato.service';
import {
  TAMANHO_MAXIMO_ARQUIVO,
  EXTENSOES_PERMITIDAS,
} from '@/backend/types/financeiro/conciliacao-bancaria.types';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.usuarioId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const contaBancariaId = Number(formData.get('contaBancariaId'));
    const tipoArquivo = formData.get('tipoArquivo') as 'ofx' | 'csv' | null;
    const arquivo = formData.get('arquivo') as File | null;

    if (!contaBancariaId || !tipoArquivo || !arquivo) {
      return NextResponse.json({ error: 'Dados do upload incompletos' }, { status: 400 });
    }

    const extensao = `.${arquivo.name.split('.').pop()}`.toLowerCase();
    if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
      return NextResponse.json({ error: 'Extens\u00e3o de arquivo n\u00e3o permitida' }, { status: 400 });
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
      return NextResponse.json({ error: 'Arquivo excede tamanho permitido (10MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());

    const resultado = await importarExtrato(
      {
        contaBancariaId,
        tipoArquivo,
        arquivo: buffer,
        nomeArquivo: arquivo.name,
      },
      auth.usuarioId
    );

    return NextResponse.json({ success: true, data: resultado }, { status: 201 });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro ao importar extrato';
    const status = mensagem.includes('n\u00e3o encontrada') || mensagem.includes('inativo') ? 400 : 500;
    return NextResponse.json({ error: mensagem }, { status });
  }
}
