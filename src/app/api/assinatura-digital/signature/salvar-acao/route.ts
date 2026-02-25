import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/service-client';

const schema = z.object({
  segmentoId: z.number().int().positive(),
  segmentoNome: z.string().min(1),
  formularioId: z.union([z.string().min(1), z.number().int().positive()]),
  formularioNome: z.string().min(1),
  clienteId: z.number().int().positive(),
  clienteNome: z.string().min(1),
  clienteCpf: z.string().min(11),
  trt_id: z.string().optional().default(''),
  trt_nome: z.string().optional().default(''),
  dados: z.record(z.string(), z.unknown()),
});

type ParteContrariaPayload = {
  id?: number;
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  observacoes?: string;
};

function pickString(data: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function pickNumber(data: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  return undefined;
}

function normalizeDigits(value?: string): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  return digits.length > 0 ? digits : undefined;
}

function splitTelefone(telefone?: string): { ddd?: string; numero?: string } {
  const digits = normalizeDigits(telefone);
  if (!digits) return {};

  const base = digits.length > 11 && digits.startsWith('55') ? digits.slice(2) : digits;
  if (base.length < 10) return {};

  return {
    ddd: base.slice(0, 2),
    numero: base.slice(2),
  };
}

function parseParteContraria(dados: Record<string, unknown>): ParteContrariaPayload | null {
  const id = pickNumber(dados, [
    'parte_contraria_id',
    'id_parte_contraria',
    'parteContrariaId',
  ]);

  const tipoPessoaRaw = pickString(dados, [
    'parte_contraria_tipo_pessoa',
    'tipo_pessoa_parte_contraria',
    'tipo_pessoa',
  ]);

  const tipo_pessoa: 'pf' | 'pj' = tipoPessoaRaw?.toLowerCase() === 'pf' ? 'pf' : 'pj';

  const nome = pickString(dados, [
    'parte_contraria_nome',
    'nome_parte_contraria',
    'parte_contraria_razao_social',
    'razao_social_parte_contraria',
    'parte_contraria_nome_razao_social',
    'razao_social',
  ]);

  const cpf = normalizeDigits(
    pickString(dados, ['parte_contraria_cpf', 'cpf_parte_contraria'])
  );
  const cnpj = normalizeDigits(
    pickString(dados, ['parte_contraria_cnpj', 'cnpj_parte_contraria'])
  );

  if (!nome && !cpf && !cnpj && !id) {
    return null;
  }

  if (!nome) {
    return null;
  }

  return {
    id,
    tipo_pessoa,
    nome,
    cpf,
    cnpj,
    email: pickString(dados, ['parte_contraria_email', 'email_parte_contraria']),
    telefone: pickString(dados, ['parte_contraria_telefone', 'telefone_parte_contraria']),
    observacoes: pickString(dados, ['parte_contraria_observacoes', 'observacoes_parte_contraria']),
  };
}

async function upsertParteContraria(
  supabase: ReturnType<typeof createServiceClient>,
  parte: ParteContrariaPayload
): Promise<{ id: number; nome: string; cpf?: string | null; cnpj?: string | null } | null> {
  const telefone = splitTelefone(parte.telefone);

  const baseUpdate: Record<string, unknown> = {
    nome: parte.nome,
    tipo_pessoa: parte.tipo_pessoa,
    tipo_documento: parte.tipo_pessoa === 'pf' ? 'CPF' : 'CNPJ',
    observacoes: parte.observacoes ?? null,
    ddd_celular: telefone.ddd ?? null,
    numero_celular: telefone.numero ?? null,
    ativo: true,
  };

  if (parte.email) {
    baseUpdate.emails = [parte.email];
  }
  if (parte.cpf) {
    baseUpdate.cpf = parte.cpf;
    baseUpdate.cnpj = null;
  }
  if (parte.cnpj) {
    baseUpdate.cnpj = parte.cnpj;
    baseUpdate.cpf = null;
  }

  if (parte.id) {
    const { data, error } = await supabase
      .from('partes_contrarias')
      .update(baseUpdate)
      .eq('id', parte.id)
      .select('id, nome, cpf, cnpj')
      .single();

    if (!error && data) {
      return data;
    }
  }

  if (parte.cpf) {
    const { data: existingPf } = await supabase
      .from('partes_contrarias')
      .select('id, nome, cpf, cnpj')
      .eq('cpf', parte.cpf)
      .maybeSingle();

    if (existingPf?.id) {
      const { data: updated } = await supabase
        .from('partes_contrarias')
        .update(baseUpdate)
        .eq('id', existingPf.id)
        .select('id, nome, cpf, cnpj')
        .single();
      return updated ?? existingPf;
    }
  }

  if (parte.cnpj) {
    const { data: existingPj } = await supabase
      .from('partes_contrarias')
      .select('id, nome, cpf, cnpj')
      .eq('cnpj', parte.cnpj)
      .maybeSingle();

    if (existingPj?.id) {
      const { data: updated } = await supabase
        .from('partes_contrarias')
        .update(baseUpdate)
        .eq('id', existingPj.id)
        .select('id, nome, cpf, cnpj')
        .single();
      return updated ?? existingPj;
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('partes_contrarias')
    .insert(baseUpdate)
    .select('id, nome, cpf, cnpj')
    .single();

  if (insertError) {
    throw new Error(`Erro ao criar parte contrária: ${insertError.message}`);
  }

  return inserted;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);
    const supabase = createServiceClient();

    const formularioId =
      typeof payload.formularioId === 'number'
        ? payload.formularioId
        : Number.parseInt(payload.formularioId, 10);

    if (!Number.isFinite(formularioId) || formularioId <= 0) {
      return NextResponse.json(
        { success: false, error: 'formularioId inválido' },
        { status: 400 }
      );
    }

    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, nome, cpf, cnpj, email')
      .eq('id', payload.clienteId)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado para criar o contrato' },
        { status: 404 }
      );
    }

    const partePayload = parseParteContraria(payload.dados);
    const parteContraria = partePayload
      ? await upsertParteContraria(supabase, partePayload)
      : null;

    // Idempotência: verificar se já existe contrato recente (últimos 5 min)
    // para este cliente + segmento com status em_contratacao.
    // Previne duplicatas quando o usuário volta e re-submete o formulário.
    const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000;
    const idempotencyThreshold = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS).toISOString();

    const { data: existingContrato } = await supabase
      .from('contratos')
      .select('id, status')
      .eq('cliente_id', payload.clienteId)
      .eq('segmento_id', payload.segmentoId)
      .eq('status', 'em_contratacao')
      .gte('cadastrado_em', idempotencyThreshold)
      .order('cadastrado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    let contrato: { id: number; status: string };

    if (existingContrato) {
      // Reutilizar contrato existente (idempotente)
      contrato = existingContrato;
    } else {
      // Criar novo contrato
      const { data: novoContrato, error: contratoError } = await supabase
        .from('contratos')
        .insert({
          segmento_id: payload.segmentoId,
          tipo_contrato: 'ajuizamento',
          tipo_cobranca: 'pro_exito',
          cliente_id: payload.clienteId,
          papel_cliente_no_contrato: 'autora',
          status: 'em_contratacao',
          cadastrado_em: new Date().toISOString(),
          observacoes:
            pickString(payload.dados, ['observacoes', 'descricao_caso']) ??
            `Contrato iniciado via formulário ${payload.formularioNome}`,
        })
        .select('id, status')
        .single();

      if (contratoError || !novoContrato) {
        throw new Error(contratoError?.message || 'Falha ao criar contrato');
      }

      contrato = novoContrato;
    }

    // Somente inserir partes e histórico se o contrato é novo (não reutilizado)
    if (!existingContrato) {
      const partesRows: Array<Record<string, unknown>> = [
        {
          contrato_id: contrato.id,
          tipo_entidade: 'cliente',
          entidade_id: payload.clienteId,
          papel_contratual: 'autora',
          ordem: 0,
        },
      ];

      if (parteContraria?.id) {
        partesRows.push({
          contrato_id: contrato.id,
          tipo_entidade: 'parte_contraria',
          entidade_id: parteContraria.id,
          papel_contratual: 're',
          ordem: 1,
        });
      }

      const { error: partesError } = await supabase
        .from('contrato_partes')
        .insert(partesRows);

      if (partesError) {
        throw new Error(`Falha ao salvar partes do contrato: ${partesError.message}`);
      }

      const { error: historicoError } = await supabase
        .from('contrato_status_historico')
        .insert({
          contrato_id: contrato.id,
          from_status: null,
          to_status: 'em_contratacao',
          changed_at: new Date().toISOString(),
          reason: 'Contrato criado a partir de formulário de assinatura digital',
        });

      if (historicoError) {
        throw new Error(`Falha ao registrar histórico de status: ${historicoError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        contrato_id: contrato.id,
        cliente_dados: {
          id: cliente.id,
          nome: cliente.nome,
          cpf: cliente.cpf,
          cnpj: cliente.cnpj,
          email: cliente.email,
        },
        parte_contraria_dados: parteContraria
          ? [
              {
                id: parteContraria.id,
                nome: parteContraria.nome,
                cpf: parteContraria.cpf ?? null,
                cnpj: parteContraria.cnpj ?? null,
              },
            ]
          : [],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.flatten() },
        { status: 400 }
      );
    }

    console.error('Erro em POST /assinatura-digital/signature/salvar-acao:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno no servidor',
      },
      { status: 500 }
    );
  }
}
