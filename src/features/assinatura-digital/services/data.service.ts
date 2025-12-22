import { createServiceClient } from '@/lib/supabase/service-client';

export interface ClienteBasico {
  id: number;
  nome: string;
  cpf?: string | null;
  cnpj?: string | null;
  tipo_pessoa?: string | null;
}

export interface TemplateBasico {
  id: number;
  template_uuid: string;
  nome: string;
  ativo: boolean;
  arquivo_original: string;
  campos: string;
}

export interface FormularioBasico {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  segmento_id: number;
  ativo: boolean;
  foto_necessaria?: boolean;
}

export interface SegmentoBasico {
  id: number;
  nome: string;
  slug: string;
  ativo: boolean;
}

export async function getClienteBasico(id: number): Promise<ClienteBasico | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome, cpf, cnpj, tipo_pessoa')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao obter cliente: ${error.message}`);
  }

  return data as ClienteBasico;
}

function parseTemplateId(id: string): { column: 'id' | 'template_uuid'; value: string | number } {
  const numeric = Number(id);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return { column: 'id', value: numeric };
  }
  return { column: 'template_uuid', value: id };
}

export async function getTemplateBasico(id: string): Promise<TemplateBasico | null> {
  const supabase = createServiceClient();
  const parsed = parseTemplateId(id);
  const { data, error } = await supabase
    .from('assinatura_digital_templates')
    .select('id, template_uuid, nome, ativo, arquivo_original, campos')
    .eq(parsed.column, parsed.value)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao obter template: ${error.message}`);
  }

  return data as TemplateBasico;
}

function parseFormularioId(id: string | number): { column: 'id' | 'formulario_uuid'; value: string | number } {
  if (typeof id === 'number') {
    return { column: 'id', value: id };
  }
  const numeric = Number(id);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return { column: 'id', value: numeric };
  }
  return { column: 'formulario_uuid', value: id };
}

export async function getFormularioBasico(id: string | number): Promise<FormularioBasico | null> {
  const supabase = createServiceClient();
  const parsed = parseFormularioId(id);
  const { data, error } = await supabase
    .from('assinatura_digital_formularios')
    .select('id, formulario_uuid, nome, slug, segmento_id, ativo, foto_necessaria')
    .eq(parsed.column, parsed.value)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao obter formulário: ${error.message}`);
  }

  return data as FormularioBasico;
}

export async function getSegmentoBasico(id: number): Promise<SegmentoBasico | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('segmentos')
    .select('id, nome, slug, ativo')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao obter segmento: ${error.message}`);
  }

  return data as SegmentoBasico;
}