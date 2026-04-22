import { createServiceClient } from '@/lib/supabase/service-client';
import type {
  DadosBancariosCliente,
  DadosBancariosInput,
  OrigemDadosBancarios,
  TipoConta,
  TipoChavePix,
} from './types';

interface DadosBancariosRow {
  id: number;
  cliente_id: number;
  banco_codigo: string;
  banco_nome: string;
  agencia: string;
  agencia_digito: string | null;
  conta: string;
  conta_digito: string | null;
  tipo_conta: TipoConta;
  chave_pix: string | null;
  tipo_chave_pix: TipoChavePix | null;
  titular_cpf: string;
  titular_nome: string;
  ativo: boolean;
  observacoes: string | null;
  origem: OrigemDadosBancarios;
  created_at: string;
  updated_at: string;
}

function mapRow(row: DadosBancariosRow): DadosBancariosCliente {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    bancoCodigo: row.banco_codigo,
    bancoNome: row.banco_nome,
    agencia: row.agencia,
    agenciaDigito: row.agencia_digito,
    conta: row.conta,
    contaDigito: row.conta_digito,
    tipoConta: row.tipo_conta,
    chavePix: row.chave_pix,
    tipoChavePix: row.tipo_chave_pix,
    titularCpf: row.titular_cpf,
    titularNome: row.titular_nome,
    ativo: row.ativo,
    observacoes: row.observacoes,
    origem: row.origem,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function buscarDadosBancariosAtivos(
  clienteId: number,
): Promise<DadosBancariosCliente | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('dados_bancarios_cliente' as never)
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('ativo', true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as unknown as DadosBancariosRow) : null;
}

export async function upsertDadosBancarios(
  clienteId: number,
  input: DadosBancariosInput,
  origem: OrigemDadosBancarios = 'prestacao_contas',
): Promise<DadosBancariosCliente> {
  const supabase = createServiceClient();

  // Desativa conta ativa anterior (se existir)
  await supabase
    .from('dados_bancarios_cliente' as never)
    .update({ ativo: false, updated_at: new Date().toISOString() } as never)
    .eq('cliente_id', clienteId)
    .eq('ativo', true);

  const { data, error } = await supabase
    .from('dados_bancarios_cliente' as never)
    .insert({
      cliente_id: clienteId,
      banco_codigo: input.bancoCodigo,
      banco_nome: input.bancoNome,
      agencia: input.agencia,
      agencia_digito: input.agenciaDigito ?? null,
      conta: input.conta,
      conta_digito: input.contaDigito ?? null,
      tipo_conta: input.tipoConta,
      chave_pix: input.chavePix ?? null,
      tipo_chave_pix: input.tipoChavePix ?? null,
      titular_cpf: input.titularCpf,
      titular_nome: input.titularNome,
      ativo: true,
      origem,
    } as never)
    .select()
    .single();

  if (error || !data) throw error ?? new Error('Falha ao inserir dados bancários');
  return mapRow(data as unknown as DadosBancariosRow);
}
