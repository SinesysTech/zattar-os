import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/server';

/**
 * Schema para dados do cliente no formato Formsign.
 *
 * Campos obrigatórios apenas: nome, cpf, email, celular
 * Demais campos são opcionais para permitir clientes com dados parciais.
 *
 * Campos _txt são textos descritivos adicionados pelo DadosPessoais component
 * para facilitar a leitura em PDFs e logs.
 */
const clienteFormsignSchema = z.object({
  // Identificador (presente em updates, gerado pelo form como placeholder em inserts)
  id: z.number().optional(),

  // Campos obrigatórios
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  email: z.string().email('Email inválido'),
  celular: z.string().min(10, 'Celular inválido'),

  // Campos opcionais de identificação
  rg: z.string().nullable().optional(),
  data_nascimento: z.string().nullable().optional(),

  // Campos opcionais de endereço
  endereco_completo: z.string().optional(),
  endereco_rua: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().optional(),
  endereco_cep: z.string().optional(),

  // Campos opcionais de estado civil/gênero/nacionalidade (códigos)
  estado_civil: z.string().optional(),
  genero: z.number().optional(),
  nacionalidade_id: z.number().optional(),

  // Campos descritivos (textos legíveis para estado_civil, genero, nacionalidade)
  estado_civil_txt: z.string().optional(),
  genero_txt: z.string().optional(),
  nacionalidade_txt: z.string().optional(),

  // Campos adicionais de contato
  telefone: z.string().optional(),
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- removendo id do payload
      const { id: _, ...insertData } = payload.dados;
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- removendo id do payload
      const { id: __, ...updateData } = payload.dados;
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
