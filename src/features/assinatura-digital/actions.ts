'use server';

import { createClient } from '@/lib/server';
import { AssinaturaDigitalService } from './service';
import {
  createSegmentoSchema,
  updateSegmentoSchema,
  createTemplateSchema,
  Template,
  EscopoSegmento,
} from './types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { indexText, indexDocument } from '@/features/ai/services/indexing.service';
import { extractKeyFromUrl } from '@/features/ai/services/storage-adapter.service';

const supabase = createClient();
const assinaturaDigitalService = new AssinaturaDigitalService(supabase);

// Helper para lidar com erros
const handleError = (error: unknown) => {
  console.error('AssinaturaDigital Action Error:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Um erro inesperado ocorreu.',
  };
};

// Segmentos
export async function listarSegmentosAction(filtros?: {
  escopo?: EscopoSegmento;
  ativo?: boolean;
}) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('Usuário não autenticado.');
    }
    // TODO: Adicionar verificação de permissões aqui

    const segmentos = await assinaturaDigitalService.listarSegmentos(filtros);
    return { success: true, data: segmentos };
  } catch (error) {
    return handleError(error);
  }
}

export async function criarSegmentoAction(
  input: z.infer<typeof createSegmentoSchema>,
) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('Usuário não autenticado.');
    }
    // TODO: Adicionar verificação de permissões aqui

    const segmento = await assinaturaDigitalService.criarSegmento(input);
    revalidatePath('/assinatura-digital/segmentos');
    return { success: true, data: segmento };
  } catch (error) {
    return handleError(error);
  }
}

export async function atualizarSegmentoAction(
  id: number,
  input: z.infer<typeof updateSegmentoSchema>,
) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('Usuário não autenticado.');
    }
    // TODO: Adicionar verificação de permissões aqui

    const segmento = await assinaturaDigitalService.atualizarSegmento(id, input);
    revalidatePath('/assinatura-digital/segmentos');
    return { success: true, data: segmento };
  } catch (error) {
    return handleError(error);
  }
}

// Templates
export async function listarTemplatesAction(filtros?: {
  segmento_id?: number;
  tipo_template?: 'pdf' | 'markdown';
  ativo?: boolean;
}) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('Usuário não autenticado.');
    }
    // TODO: Adicionar verificação de permissões aqui

    const templates = await assinaturaDigitalService.listarTemplates(filtros);
    return { success: true, data: templates };
  } catch (error) {
    return handleError(error);
  }
}

export async function criarTemplateAction(
  input: z.infer<typeof createTemplateSchema>,
) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('Usuário não autenticado.');
    }
    // TODO: Adicionar verificação de permissões aqui

    const template = await assinaturaDigitalService.criarTemplate(input);
    
    // 🆕 AI Indexing Hook
    after(async () => {
      try {
        console.log(`🧠 [AI] Indexando template de assinatura digital ${template.id}`);
        
        const metadata = {
          nome: template.nome,
          descricao: template.descricao,
          segmento_id: template.segmento_id,
          indexed_by: userData.user.id, // Auth user
        };

        if (template.tipo_template === 'markdown' && template.conteudo_markdown) {
          await indexText(template.conteudo_markdown, {
            entity_type: 'assinatura_digital', // Usando tipo genérico mapeado no chat
            entity_id: template.id,
            metadata: { ...metadata, type: 'markdown_template' },
          });
        } else if (template.tipo_template === 'pdf' && template.pdf_url) {
          const key = extractKeyFromUrl(template.pdf_url);
          if (key) {
            await indexDocument({
              entity_type: 'assinatura_digital',
              entity_id: template.id,
              storage_provider: 'backblaze', // Assumindo backblaze padrão
              storage_key: key,
              content_type: 'application/pdf',
              metadata: { ...metadata, type: 'pdf_template' },
            });
          }
        }
      } catch (error) {
        console.error(`❌ [AI] Erro ao indexar template ${template.id}:`, error);
      }
    });

    revalidatePath('/assinatura-digital/templates');
    return { success: true, data: template };
  } catch (error) {
    return handleError(error);
  }
}

export async function processarTemplateAction(
  templateId: number,
  data: Record<string, unknown>,
) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('Usuário não autenticado.');
    }
    // TODO: Adicionar verificação de permissões aqui

    const { data: templateData, error: templateError } = await supabase
      .from('assinatura_digital_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !templateData) {
      throw new Error('Template não encontrado.');
    }

    const processedContent =
      await assinaturaDigitalService.processarVariaveisMarkdown(
        templateData as Template,
        data,
      );

    return { success: true, data: processedContent };
  } catch (error) {
    return handleError(error);
  }
}

export async function gerarPdfDeMarkdownAction(
  markdownContent: string,
  data: Record<string, unknown>,
) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('Usuário não autenticado.');
    }
    // TODO: Adicionar verificação de permissões aqui

    const pdfBuffer = await assinaturaDigitalService.gerarPdfDeMarkdown(
      markdownContent,
      data,
    );
    // Retornar o buffer como uma string base64 para facilitar o transporte via JSON
    return { success: true, data: pdfBuffer.toString('base64') };
  } catch (error) {
    return handleError(error);
  }
}
