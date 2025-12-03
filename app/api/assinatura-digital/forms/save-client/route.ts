import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const clienteFormsignSchema = z.object({
  id: z.number(),
  nome: z.string(),
  cpf: z.string(),
  rg: z.string().nullable(),
  data_nascimento: z.string().nullable(),
  email: z.string(),
  celular: z.string(),
  endereco_completo: z.string().optional(),
  endereco_rua: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().optional(),
  endereco_cep: z.string().optional(),
  estado_civil: z.string().optional(),
  genero: z.string().optional(),
  nacionalidade: z.string().optional(),
});

const schema = z.object({
  segmentoId: z.number(),
  cpf: z.string().length(11),
  operation: z.enum(['insert', 'update']),
  clienteId: z.number().optional(),
  dados: clienteFormsignSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);

    if (payload.operation === 'update' && !payload.clienteId) {
      return NextResponse.json(
        { success: false, error: 'clienteId is required for update operation' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (payload.operation === 'insert') {
      const { id, ...insertData } = payload.dados;
      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...insertData, segmento_id: payload.segmentoId })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json(
            { success: false, error: 'CPF já cadastrado' },
            { status: 409 }
          );
        }
        throw error;
      }

      return NextResponse.json({ success: true, data: { cliente_id: data.id } });
    } else {
      const { id, ...updateData } = payload.dados;
      const { error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', payload.clienteId!);

      if (error) throw error;

      return NextResponse.json({ success: true, data: { cliente_id: payload.clienteId! } });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error saving client:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}