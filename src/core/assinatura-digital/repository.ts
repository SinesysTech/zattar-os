import { SupabaseClient } from '@supabase/supabase-js';
import {
  Segmento,
  createSegmentoSchema,
  updateSegmentoSchema,
  Template,
  createTemplateSchema,
  updateTemplateSchema,
  Formulario,
  createFormularioSchema,
  updateFormularioSchema,
  AssinaturaDigital,
  createAssinaturaDigitalSchema,
  updateAssinaturaDigitalSchema,
  EscopoSegmento,
} from './domain';
import { generateSlug } from '@/lib/utils'; // Assumindo que você tem um util de slug
import { z } from 'zod';

export class AssinaturaDigitalRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Segmentos
  async listarSegmentos(filtros?: { escopo?: EscopoSegmento; ativo?: boolean }): Promise<Segmento[]> {
    let query = this.supabase.from('segmentos').select('*');

    if (filtros?.escopo) {
      query = query.eq('escopo', filtros.escopo);
    }
    if (filtros?.ativo !== undefined) {
      query = query.eq('ativo', filtros.ativo);
    }

    const { data, error } = await query.order('nome');
    if (error) throw new Error(error.message);
    return data as Segmento[];
  }

  async buscarSegmentoPorSlug(slug: string): Promise<Segmento | null> {
    const { data, error } = await this.supabase
      .from('segmentos')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message); // PGRST116 = No rows found
    return data as Segmento | null;
  }

  async criarSegmento(input: z.infer<typeof createSegmentoSchema>): Promise<Segmento> {
    const validated = createSegmentoSchema.parse(input);
    const slug = generateSlug(validated.nome); // Gera slug automaticamente
    const { data, error } = await this.supabase
      .from('segmentos')
      .insert({ ...validated, slug })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Segmento;
  }

  async atualizarSegmento(id: number, input: z.infer<typeof updateSegmentoSchema>): Promise<Segmento> {
    const validated = updateSegmentoSchema.parse(input);
    const { data, error } = await this.supabase
      .from('segmentos')
      .update(validated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Segmento;
  }

  // Templates
  async listarTemplates(filtros?: { segmento_id?: number; tipo_template?: 'pdf' | 'markdown'; ativo?: boolean }): Promise<Template[]> {
    let query = this.supabase.from('assinatura_digital_templates').select('*');

    if (filtros?.segmento_id) {
      query = query.eq('segmento_id', filtros.segmento_id);
    }
    if (filtros?.tipo_template) {
      query = query.eq('tipo_template', filtros.tipo_template);
    }
    if (filtros?.ativo !== undefined) {
      query = query.eq('ativo', filtros.ativo);
    }

    const { data, error } = await query.order('nome');
    if (error) throw new Error(error.message);
    return data as Template[];
  }

  async criarTemplate(input: z.infer<typeof createTemplateSchema>): Promise<Template> {
    const validated = createTemplateSchema.parse(input);
    const { data, error } = await this.supabase
      .from('assinatura_digital_templates')
      .insert(validated)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Template;
  }

  async atualizarTemplate(id: number, input: z.infer<typeof updateTemplateSchema>): Promise<Template> {
    const validated = updateTemplateSchema.parse(input);
    const { data, error } = await this.supabase
      .from('assinatura_digital_templates')
      .update(validated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Template;
  }

  // Formularios
  async listarFormularios(filtros?: { segmento_id?: number; ativo?: boolean }): Promise<Formulario[]> {
    let query = this.supabase.from('assinatura_digital_formularios').select('*');

    if (filtros?.segmento_id) {
      query = query.eq('segmento_id', filtros.segmento_id);
    }
    if (filtros?.ativo !== undefined) {
      query = query.eq('ativo', filtros.ativo);
    }

    const { data, error } = await query.order('nome');
    if (error) throw new Error(error.message);
    return data as Formulario[];
  }

  async criarFormulario(input: z.infer<typeof createFormularioSchema>): Promise<Formulario> {
    const validated = createFormularioSchema.parse(input);
    const { data, error } = await this.supabase
      .from('assinatura_digital_formularios')
      .insert(validated)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Formulario;
  }

  async atualizarFormulario(id: number, input: z.infer<typeof updateFormularioSchema>): Promise<Formulario> {
    const validated = updateFormularioSchema.parse(input);
    const { data, error } = await this.supabase
      .from('assinatura_digital_formularios')
      .update(validated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Formulario;
  }

  // Assinaturas Digitais
  async listarAssinaturas(filtros?: { formulario_id?: number; segmento_id?: number; status?: string }): Promise<AssinaturaDigital[]> {
    let query = this.supabase.from('assinatura_digital_assinaturas').select('*');

    if (filtros?.formulario_id) {
      query = query.eq('formulario_id', filtros.formulario_id);
    }
    if (filtros?.segmento_id) {
      query = query.eq('segmento_id', filtros.segmento_id);
    }
    if (filtros?.status) {
      query = query.eq('status', filtros.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as AssinaturaDigital[];
  }

  async criarAssinatura(input: z.infer<typeof createAssinaturaDigitalSchema>): Promise<AssinaturaDigital> {
    const validated = createAssinaturaDigitalSchema.parse(input);
    const { data, error } = await this.supabase
      .from('assinatura_digital_assinaturas')
      .insert(validated)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as AssinaturaDigital;
  }

  async atualizarAssinatura(id: number, input: z.infer<typeof updateAssinaturaDigitalSchema>): Promise<AssinaturaDigital> {
    const validated = updateAssinaturaDigitalSchema.parse(input);
    const { data, error } = await this.supabase
      .from('assinatura_digital_assinaturas')
      .update(validated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as AssinaturaDigital;
  }
}
