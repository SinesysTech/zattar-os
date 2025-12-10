/**
 * ASSINATURA DIGITAL - Repository
 *
 * Camada de persistência para o módulo de assinatura digital.
 * Abstrai o acesso ao Supabase para entidades do módulo.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  Segmento,
  Template,
  Formulario,
  AssinaturaDigital,
  CreateSegmentoInput,
  UpdateSegmentoInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  CreateFormularioInput,
  UpdateFormularioInput,
  CreateAssinaturaDigitalInput,
  UpdateAssinaturaDigitalInput,
  EscopoSegmento,
} from './types';
/**
 * Gera um slug URL-friendly a partir de uma string.
 */
function generateSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export class AssinaturaDigitalRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ==========================================================================
  // SEGMENTOS
  // ==========================================================================

  async listarSegmentos(filtros?: {
    escopo?: EscopoSegmento;
    ativo?: boolean;
  }): Promise<Segmento[]> {
    let query = this.supabase.from('assinatura_digital_segmentos').select('*');

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
      .from('assinatura_digital_segmentos')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Segmento | null;
  }

  async criarSegmento(input: CreateSegmentoInput): Promise<Segmento> {
    const slug = generateSlug(input.nome);
    const { data, error } = await this.supabase
      .from('assinatura_digital_segmentos')
      .insert({ ...input, slug })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Segmento;
  }

  async atualizarSegmento(
    id: number,
    input: UpdateSegmentoInput
  ): Promise<Segmento> {
    const updateData = input.nome
      ? { ...input, slug: generateSlug(input.nome) }
      : input;

    const { data, error } = await this.supabase
      .from('assinatura_digital_segmentos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Segmento;
  }

  // ==========================================================================
  // TEMPLATES
  // ==========================================================================

  async listarTemplates(filtros?: {
    segmento_id?: number;
    tipo_template?: 'pdf' | 'markdown';
    ativo?: boolean;
    status?: string;
  }): Promise<Template[]> {
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
    if (filtros?.status) {
      query = query.eq('status', filtros.status);
    }

    const { data, error } = await query.order('nome');
    if (error) throw new Error(error.message);
    return data as Template[];
  }

  async buscarTemplatePorId(id: number): Promise<Template | null> {
    const { data, error } = await this.supabase
      .from('assinatura_digital_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Template | null;
  }

  async buscarTemplatePorUuid(uuid: string): Promise<Template | null> {
    const { data, error } = await this.supabase
      .from('assinatura_digital_templates')
      .select('*')
      .eq('template_uuid', uuid)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Template | null;
  }

  async criarTemplate(input: CreateTemplateInput): Promise<Template> {
    const { data, error } = await this.supabase
      .from('assinatura_digital_templates')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Template;
  }

  async atualizarTemplate(
    id: number,
    input: UpdateTemplateInput
  ): Promise<Template> {
    const { data, error } = await this.supabase
      .from('assinatura_digital_templates')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Template;
  }

  // ==========================================================================
  // FORMULÁRIOS
  // ==========================================================================

  async listarFormularios(filtros?: {
    segmento_id?: number;
    ativo?: boolean;
  }): Promise<Formulario[]> {
    let query = this.supabase
      .from('assinatura_digital_formularios')
      .select('*, segmento:assinatura_digital_segmentos(*)');

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

  async buscarFormularioPorId(id: number): Promise<Formulario | null> {
    const { data, error } = await this.supabase
      .from('assinatura_digital_formularios')
      .select('*, segmento:assinatura_digital_segmentos(*)')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Formulario | null;
  }

  async buscarFormularioPorSlug(
    segmentoSlug: string,
    formularioSlug: string
  ): Promise<Formulario | null> {
    const { data, error } = await this.supabase
      .from('assinatura_digital_formularios')
      .select('*, segmento:assinatura_digital_segmentos!inner(*)')
      .eq('slug', formularioSlug)
      .eq('segmento.slug', segmentoSlug)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Formulario | null;
  }

  async criarFormulario(input: CreateFormularioInput): Promise<Formulario> {
    const { data, error } = await this.supabase
      .from('assinatura_digital_formularios')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Formulario;
  }

  async atualizarFormulario(
    id: number,
    input: UpdateFormularioInput
  ): Promise<Formulario> {
    const { data, error } = await this.supabase
      .from('assinatura_digital_formularios')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Formulario;
  }

  // ==========================================================================
  // ASSINATURAS
  // ==========================================================================

  async listarAssinaturas(filtros?: {
    formulario_id?: number;
    segmento_id?: number;
    status?: string;
  }): Promise<AssinaturaDigital[]> {
    let query = this.supabase
      .from('assinatura_digital_assinaturas')
      .select('*');

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

  async criarAssinatura(
    input: CreateAssinaturaDigitalInput
  ): Promise<AssinaturaDigital> {
    const { data, error } = await this.supabase
      .from('assinatura_digital_assinaturas')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as AssinaturaDigital;
  }

  async atualizarAssinatura(
    id: number,
    input: UpdateAssinaturaDigitalInput
  ): Promise<AssinaturaDigital> {
    const { data, error } = await this.supabase
      .from('assinatura_digital_assinaturas')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as AssinaturaDigital;
  }
}
