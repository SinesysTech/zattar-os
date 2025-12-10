import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import { AssinaturaDigitalRepository } from './repository';
import {
  createSegmentoSchema,
  updateSegmentoSchema,
  createTemplateSchema,
  updateTemplateSchema,
  Segmento,
  Template,
  EscopoSegmento,
} from './domain';
import { generateSlug } from '@/lib/utils'; // Já presente
import mustache from 'mustache'; // Biblioteca para template, se não tiver, instalar ou usar alternativa
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'; // Para geração de PDF, se não tiver, instalar

export class AssinaturaDigitalService {
  private repository: AssinaturaDigitalRepository;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.repository = new AssinaturaDigitalRepository(supabase);
  }

  // Segmentos
  async listarSegmentos(filtros?: { escopo?: EscopoSegmento; ativo?: boolean }): Promise<Segmento[]> {
    return this.repository.listarSegmentos(filtros);
  }

  async criarSegmento(input: z.infer<typeof createSegmentoSchema>): Promise<Segmento> {
    const validated = createSegmentoSchema.parse(input);
    const slug = generateSlug(validated.nome);

    const existingSegmento = await this.repository.buscarSegmentoPorSlug(slug);
    if (existingSegmento) {
      throw new Error('Já existe um segmento com este nome ou slug.');
    }

    return this.repository.criarSegmento({ ...validated, slug });
  }

  async atualizarSegmento(id: number, input: z.infer<typeof updateSegmentoSchema>): Promise<Segmento> {
    const validated = updateSegmentoSchema.parse(input);

    if (validated.nome) {
      const slug = generateSlug(validated.nome);
      const existingSegmento = await this.repository.buscarSegmentoPorSlug(slug);
      if (existingSegmento && existingSegmento.id !== id) {
        throw new Error('Já existe outro segmento com este nome ou slug.');
      }
      return this.repository.atualizarSegmento(id, { ...validated, slug });
    }

    return this.repository.atualizarSegmento(id, validated);
  }

  // Templates
  async listarTemplates(filtros?: { segmento_id?: number; tipo_template?: 'pdf' | 'markdown'; ativo?: boolean }): Promise<Template[]> {
    return this.repository.listarTemplates(filtros);
  }

  async criarTemplate(input: z.infer<typeof createTemplateSchema>): Promise<Template> {
    const validated = createTemplateSchema.parse(input);
    // Validações específicas para PDF ou Markdown
    if (validated.tipo_template === 'pdf' && !validated.pdf_url) {
      throw new Error('URL do PDF é obrigatória para templates PDF.');
    }
    if (validated.tipo_template === 'markdown' && !validated.conteudo_markdown) {
      throw new Error('Conteúdo Markdown é obrigatório para templates Markdown.');
    }
    return this.repository.criarTemplate(validated);
  }

  async atualizarTemplate(id: number, input: z.infer<typeof updateTemplateSchema>): Promise<Template> {
    const validated = updateTemplateSchema.parse(input);
    return this.repository.atualizarTemplate(id, validated);
  }

  async processarVariaveisMarkdown(template: Template, data: Record<string, any>): Promise<string> {
    if (template.tipo_template !== 'markdown' || !template.conteudo_markdown) {
      throw new Error('Template não é do tipo Markdown ou não possui conteúdo Markdown.');
    }
    // Usar Mustache.js para interpolação simples
    return mustache.render(template.conteudo_markdown, data);
  }

  async gerarPdfDeMarkdown(markdownContent: string, data: Record<string, any>): Promise<Buffer> {
    const renderedMarkdown = mustache.render(markdownContent, data);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(renderedMarkdown, {
      x: 50,
      y: page.getHeight() - 50,
      font,
      size: 12,
      color: rgb(0, 0, 0),
      maxWidth: page.getWidth() - 100,
      lineHeight: 18,
    });

    return pdfDoc.save();
  }

  // Validação de Escopo
  validarEscopoSegmento(segmento: Segmento, contexto: 'contratos' | 'assinatura'): boolean {
    if (segmento.escopo === 'global') {
      return true;
    }
    return segmento.escopo === contexto;
  }
}
