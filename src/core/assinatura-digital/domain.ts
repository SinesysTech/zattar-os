import { z } from 'zod';

export type EscopoSegmento = 'global' | 'contratos' | 'assinatura';
export type TipoTemplate = 'pdf' | 'markdown';

// Segmento
export const createSegmentoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  descricao: z.string().optional(),
  escopo: z.enum(['global', 'contratos', 'assinatura']).default('global'),
  ativo: z.boolean().default(true),
});

export const updateSegmentoSchema = createSegmentoSchema.partial();

export type Segmento = z.infer<typeof createSegmentoSchema> & {
  id: number;
  created_at: string;
  updated_at: string;
};

// Template
export const createTemplateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  tipo_template: z.enum(['pdf', 'markdown']).default('pdf'),
  conteudo_markdown: z.string().optional(),
  segmento_id: z.number().optional(), // Opcional, pode ser global
  pdf_url: z.string().optional(), // URL do PDF no storage
  ativo: z.boolean().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type Template = z.infer<typeof createTemplateSchema> & {
  id: number;
  created_at: string;
  updated_at: string;
};

// Formulário de Assinatura
export const createFormularioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  template_id: z.number().nullable(),
  segmento_id: z.number().nullable(),
  ativo: z.boolean().default(true),
});

export const updateFormularioSchema = createFormularioSchema.partial();

export type Formulario = z.infer<typeof createFormularioSchema> & {
  id: number;
  created_at: string;
  updated_at: string;
};

// Assinatura Digital
export const createAssinaturaDigitalSchema = z.object({
  formulario_id: z.number(),
  template_id: z.number(),
  segmento_id: z.number().nullable(),
  signatario_email: z.string().email('Email inválido'),
  signatario_nome: z.string().min(1, 'Nome do signatário é obrigatório'),
  status: z.enum(['pendente', 'assinado', 'cancelado', 'erro']).default('pendente'),
  token: z.string().optional(), // Gerado no backend
  documento_url: z.string().optional(), // URL do documento assinado
  metadados: z.record(z.any()).optional(), // Ex: { ip: '...', user_agent: '...' }
});

export const updateAssinaturaDigitalSchema = createAssinaturaDigitalSchema.partial();

export type AssinaturaDigital = z.infer<typeof createAssinaturaDigitalSchema> & {
  id: number;
  created_at: string;
  updated_at: string;
};
