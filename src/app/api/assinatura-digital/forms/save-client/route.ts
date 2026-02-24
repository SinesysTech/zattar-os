import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { NACIONALIDADES } from '@/app/app/assinatura-digital/feature/constants/nacionalidades';

/**
 * Schema de entrada — mantém o formato que o frontend envia (ClienteFormsignPayload).
 * A transformação para o schema real do DB acontece dentro da rota.
 */
const clienteFormsignSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  email: z.string().email('Email inválido'),
  celular: z.string().min(10, 'Celular inválido'),
  telefone: z.string().optional(),
  rg: z.string().nullable().optional(),
  data_nascimento: z.string().nullable().optional(),

  endereco_completo: z.string().optional(),
  endereco_rua: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().optional(),
  endereco_cep: z.string().optional(),

  estado_civil: z.string().optional(),
  genero: z.number().optional(),
  nacionalidade_id: z.number().optional(),

  // Campos descritivos (ignorados na escrita ao DB)
  estado_civil_txt: z.string().optional(),
  genero_txt: z.string().optional(),
  nacionalidade_txt: z.string().optional(),
});

const schema = z.object({
  segmentoId: z.number(),
  cpf: z.string().length(11),
  operation: z.enum(['insert', 'update']),
  clienteId: z.number().optional(),
  dados: clienteFormsignSchema,
});

// ---------------------------------------------------------------------------
// Mapeamentos: código do form → enum do DB
// ---------------------------------------------------------------------------
const ESTADO_CIVIL_TO_ENUM: Record<string, string> = {
  '1': 'solteiro',
  '2': 'casado',
  '4': 'divorciado',
  '5': 'viuvo',
};

const GENERO_TO_ENUM: Record<number, string> = {
  1: 'masculino',
  2: 'feminino',
  3: 'outro',
  4: 'prefiro_nao_informar',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Separa telefone em DDD + número. Ex: "11999999999" → ["11", "999999999"] */
function splitPhone(phone: string | undefined): { ddd: string | null; numero: string | null } {
  if (!phone || phone.length < 10) return { ddd: null, numero: null };
  return { ddd: phone.slice(0, 2), numero: phone.slice(2) };
}

/** Converte "dd/mm/yyyy" → "yyyy-mm-dd" para o tipo date do PostgreSQL */
function parseDataNascimento(value: string | null | undefined): string | null {
  if (!value) return null;
  // Formato dd/mm/yyyy
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  // Já em formato ISO (yyyy-mm-dd) ou outro — retorna como está
  return value;
}

/** Verifica se há dados de endereço preenchidos */
function hasEnderecoData(dados: z.infer<typeof clienteFormsignSchema>): boolean {
  return Boolean(
    dados.endereco_rua ||
    dados.endereco_numero ||
    dados.endereco_bairro ||
    dados.endereco_cidade ||
    dados.endereco_uf ||
    dados.endereco_cep
  );
}

/** Monta o objeto de dados do cliente para insert/update na tabela clientes */
function buildClienteData(dados: z.infer<typeof clienteFormsignSchema>) {
  const { ddd: dddCelular, numero: numeroCelular } = splitPhone(dados.celular);
  const { ddd: dddResidencial, numero: numeroResidencial } = splitPhone(dados.telefone);

  return {
    nome: dados.nome,
    cpf: dados.cpf,
    rg: dados.rg || null,
    data_nascimento: parseDataNascimento(dados.data_nascimento),
    emails: dados.email ? [dados.email] : null,
    ddd_celular: dddCelular,
    numero_celular: numeroCelular,
    ddd_residencial: dddResidencial,
    numero_residencial: numeroResidencial,
    estado_civil: dados.estado_civil
      ? ESTADO_CIVIL_TO_ENUM[dados.estado_civil] ?? null
      : null,
    genero: dados.genero != null
      ? GENERO_TO_ENUM[dados.genero] ?? null
      : null,
    nacionalidade: dados.nacionalidade_id != null
      ? NACIONALIDADES[dados.nacionalidade_id] ?? null
      : null,
  };
}

/** Monta o objeto de endereço para insert/update na tabela enderecos */
function buildEnderecoData(dados: z.infer<typeof clienteFormsignSchema>, clienteId: number) {
  return {
    entidade_tipo: 'cliente' as const,
    entidade_id: clienteId,
    logradouro: dados.endereco_rua || null,
    numero: dados.endereco_numero || null,
    complemento: dados.endereco_complemento || null,
    bairro: dados.endereco_bairro || null,
    cep: dados.endereco_cep || null,
    municipio: dados.endereco_cidade || null,
    estado_sigla: dados.endereco_uf || null,
  };
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

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
      // ---- INSERT cliente ----
      const clienteData = {
        ...buildClienteData(payload.dados),
        tipo_pessoa: 'pf' as const,
      };

      const { data: newCliente, error: insertError } = await supabase
        .from('clientes')
        .insert(clienteData)
        .select('id')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json(
            { success: false, error: 'CPF já cadastrado' },
            { status: 409 }
          );
        }
        throw insertError;
      }

      // ---- INSERT endereço (se houver dados) ----
      if (hasEnderecoData(payload.dados)) {
        const enderecoData = buildEnderecoData(payload.dados, newCliente.id);

        const { data: newEndereco, error: enderecoError } = await supabase
          .from('enderecos')
          .insert(enderecoData)
          .select('id')
          .single();

        if (enderecoError) {
          console.error('Error creating address:', enderecoError);
          // Endereço falhou, mas cliente foi criado — não bloqueia o fluxo
        } else {
          // Vincular endereço ao cliente
          await supabase
            .from('clientes')
            .update({ endereco_id: newEndereco.id })
            .eq('id', newCliente.id);
        }
      }

      return NextResponse.json({ success: true, data: { cliente_id: newCliente.id } });

    } else {
      // ---- UPDATE cliente ----
      const clienteData = buildClienteData(payload.dados);

      const { error: updateError } = await supabase
        .from('clientes')
        .update(clienteData)
        .eq('id', payload.clienteId!);

      if (updateError) throw updateError;

      // ---- UPDATE ou INSERT endereço ----
      if (hasEnderecoData(payload.dados)) {
        // Buscar endereco_id atual do cliente
        const { data: currentCliente } = await supabase
          .from('clientes')
          .select('endereco_id')
          .eq('id', payload.clienteId!)
          .single();

        const enderecoFields = buildEnderecoData(payload.dados, payload.clienteId!);

        if (currentCliente?.endereco_id) {
          // Update endereço existente
          const { error: enderecoError } = await supabase
            .from('enderecos')
            .update(enderecoFields)
            .eq('id', currentCliente.endereco_id);

          if (enderecoError) {
            console.error('Error updating address:', enderecoError);
          }
        } else {
          // Inserir novo endereço e vincular
          const { data: newEndereco, error: enderecoError } = await supabase
            .from('enderecos')
            .insert(enderecoFields)
            .select('id')
            .single();

          if (enderecoError) {
            console.error('Error creating address:', enderecoError);
          } else {
            await supabase
              .from('clientes')
              .update({ endereco_id: newEndereco.id })
              .eq('id', payload.clienteId!);
          }
        }
      }

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
