import { z } from 'zod';

export type EscopoSegmento = 'global' | 'contratos' | 'assinatura';
export type TipoTemplate = 'pdf' | 'markdown';

/**
 * Status possíveis para um template
 */
export type StatusTemplate = 'ativo' | 'inativo' | 'rascunho';

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
  formularios_count?: number; // Adicionado para views
};

// Template
export const createTemplateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  tipo_template: z.enum(['pdf', 'markdown']).default('pdf'),
  conteudo_markdown: z.string().optional().nullable(),
  segmento_id: z.number().int().positive().optional().nullable(), // Pode ser nulo se global
  pdf_url: z.string().optional().nullable(), // URL do PDF no storage, pode ser nulo para markdown
  ativo: z.boolean().default(true),
  status: z.enum(['ativo', 'inativo', 'rascunho']).default('rascunho'), // Novo campo de status
  versao: z.number().int().positive().optional().default(1),
  arquivo_original: z.string().optional().nullable(), // Nome original do arquivo PDF
  arquivo_nome: z.string().optional().nullable(), // Nome do arquivo no storage
  arquivo_tamanho: z.number().int().positive().optional().nullable(),
  criado_por: z.string().optional().nullable(), // ID ou nome do usuario
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type Template = z.infer<typeof createTemplateSchema> & {
  id: number;
  template_uuid: string;
  created_at: string;
  updated_at: string;
};

export type MetadadoSeguranca = 'ip' | 'user_agent' | 'device_info' | 'geolocation'; // Extendido com 'geolocation' para ser mais completo

// Schema Zod básico para validação de estrutura de DynamicFormSchema
const dynamicFormSchemaBasicValidation = z.object({
  id: z.string().min(1, 'Schema deve ter um ID'),
  version: z.string().min(1, 'Schema deve ter uma versão'),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      // FormFieldSchema is a complex union type - use record as non-any placeholder
      fields: z.array(z.record(z.string(), z.unknown())),
      collapsible: z.boolean().optional(),
      defaultCollapsed: z.boolean().optional(),
    })
  ).min(1, 'Schema deve ter ao menos uma seção'),
  globalValidations: z.array(
    z.object({
      id: z.string(),
      fields: z.array(z.string()),
      validator: z.string(),
      message: z.string(),
      params: z.record(z.string(), z.unknown()).optional(),
    })
  ).optional(),
});

// Schema Zod relaxado para criação de FormularioEntity
const dynamicFormSchemaBasicValidationCreate = z.object({
  id: z.string().min(1, 'Schema deve ter um ID'),
  version: z.string().min(1, 'Schema deve ter uma versão'),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      // FormFieldSchema is a complex union type - use record as non-any placeholder
      fields: z.array(z.record(z.string(), z.unknown())),
      collapsible: z.boolean().optional(),
      defaultCollapsed: z.boolean().optional(),
    })
  ).min(0, 'Sections deve ser um array'),
  globalValidations: z.array(
    z.object({
      id: z.string(),
      fields: z.array(z.string()),
      validator: z.string(),
      message: z.string(),
      params: z.record(z.string(), z.unknown()).optional(),
    })
  ).optional(),
});


// Formulário de Assinatura
export const createFormularioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens').max(50, 'Slug deve ter no máximo 50 caracteres'),
  descricao: z.string().optional().max(500, 'Descrição deve ter no máximo 500 caracteres'),
  segmento_id: z.number().int().positive('Selecione um segmento'),
  form_schema: dynamicFormSchemaBasicValidationCreate,
  schema_version: z.string().optional(),
  template_ids: z.array(z.string()).min(1, 'Deve haver ao menos um template associado'),
  ativo: z.boolean().default(true),
  arquivado: z.boolean().optional(),
  ordem: z.number().optional(),
  foto_necessaria: z.boolean().optional(),
  geolocation_necessaria: z.boolean().optional(),
  metadados_seguranca: z.array(z.enum(['ip', 'user_agent', 'device_info', 'geolocation'])).optional(),
});

export const updateFormularioSchema = createFormularioSchema.partial();

export type Formulario = z.infer<typeof createFormularioSchema> & {
  id: number;
  formulario_uuid: string;
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

// ============================================================================
// Enums para DynamicFormSchema
// ============================================================================

/**
 * Tipos de campo disponíveis no formulário dinâmico
 */
export enum FormFieldType {
  // Texto
  TEXT = 'text',
  EMAIL = 'email',
  TEXTAREA = 'textarea',

  // Números
  NUMBER = 'number',

  // Datas
  DATE = 'date',

  // Seleção
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',

  // Formatados BR (usam validadores de lib/validators/)
  CPF = 'cpf',
  CNPJ = 'cnpj',
  PHONE = 'phone',
  CEP = 'cep',
}

// ============================================================================
// Interfaces de Validação para DynamicFormSchema
// ============================================================================

/**
 * Regras de validação para campos individuais
 *
 * Estas regras são convertidas para validações Zod no runtime.
 */
export interface ValidationRule {
  /** Campo obrigatório */
  required?: boolean;

  /** Comprimento mínimo (string) ou valor mínimo (number) */
  min?: number;

  /** Comprimento máximo (string) ou valor máximo (number) */
  max?: number;

  /** Regex pattern para validação customizada */
  pattern?: string;

  /** Validação de email (usa validador de email do Zod) */
  email?: boolean;

  /**
   * Nome de validador customizado
   * Referencia funções em lib/validators/ (ex: 'validateCPF', 'validateCNPJ')
   */
  custom?: string;

  /** Mensagem de erro customizada */
  message?: string;
}

// ============================================================================
// Interfaces de Opções para DynamicFormSchema
// ============================================================================

/**
 * Opções para campos de seleção (select, radio)
 */
export interface FormFieldOption {
  /** Label exibido ao usuário */
  label: string;

  /** Valor do campo quando selecionado */
  value: string | number;

  /** Opção desabilitada */
  disabled?: boolean;
}

// ============================================================================
// Interfaces de Renderização Condicional para DynamicFormSchema
// ============================================================================

/**
 * Regras para renderização condicional de campos
 *
 * Permite mostrar/ocultar campos baseado em valores de outros campos.
 *
 * @example
 * // Mostrar campo "motivo_bloqueio" apenas se "situacao" === "bloqueado"
 * {
 *   field: 'situacao',
 *   operator: '=',
 *   value: 'bloqueado'
 * }
 */
export interface ConditionalRule {
  /** ID do campo que controla a condição */
  field: string;

  /** Operador de comparação */
  operator: '=' | '!=' | '>' | '<' | 'contains' | 'empty' | 'notEmpty';

  /** Valor para comparação (não usado em 'empty' e 'notEmpty') */
  value?: string | number | boolean;
}

// ============================================================================
// Interfaces de Campos para DynamicFormSchema
// ============================================================================

/**
 * Definição completa de um campo do formulário
 */
export interface FormFieldSchema {
  /** ID único do campo (usado como name no form) */
  id: string;

  /** Name do campo HTML (pode ser igual ao id) */
  name: string;

  /** Label exibido ao usuário */
  label: string;

  /** Tipo do campo */
  type: FormFieldType;

  /** Regras de validação */
  validation?: ValidationRule;

  /** Placeholder do campo */
  placeholder?: string;

  /** Valor padrão do campo */
  defaultValue?: string | number | boolean;

  /**
   * Opções para select/radio
   * Obrigatório quando type é SELECT ou RADIO
   */
  options?: FormFieldOption[];

  /** Condição para exibir o campo */
  conditional?: ConditionalRule;

  /**
   * Largura do campo no grid
   * 1 = full width (12 cols)
   * 2 = half width (6 cols)
   * 3 = one third width (4 cols)
   */
  gridColumns?: 1 | 2 | 3;

  /** Texto de ajuda exibido abaixo do campo */
  helpText?: string;

  /** Campo desabilitado */
  disabled?: boolean;
}

// ============================================================================
// Interfaces de Seções para DynamicFormSchema
// ============================================================================

/**
 * Agrupamento de campos em seções
 *
 * Permite organizar formulários complexos em múltiplas seções visuais.
 */
export interface FormSectionSchema {
  /** ID único da seção */
  id: string;

  /** Título da seção */
  title: string;

  /** Descrição da seção (opcional) */
  description?: string;

  /** Array de campos da seção */
  fields: FormFieldSchema[];

  /** Seção pode ser colapsada/expandida */
  collapsible?: boolean;

  /** Seção inicia colapsada (só funciona se collapsible=true) */
  defaultCollapsed?: boolean;
}

// ============================================================================
// Interfaces de Validações Cross-Field para DynamicFormSchema
// ============================================================================

/**
 * Validações entre múltiplos campos
 *
 * Usado para validações que envolvem relação entre campos,
 * como: data fim >= data início, confirmação de senha, etc.
 *
 * @example
 * // Validar que dataFim >= dataInicio
 * {
 *   id: 'validar_range_datas',
 *   fields: ['dataInicio', 'dataFim'],
 *   validator: 'validateDateRange',
 *   message: 'Data fim deve ser posterior à data início',
 *   params: { allowEqual: true }
 * }
 */
export interface CrossFieldValidation {
  /** ID único da validação */
  id: string;

  /** IDs dos campos envolvidos na validação */
  fields: string[];

  /**
   * Nome da função validadora
   * Deve estar disponível em um registry de validadores
   */
  validator: string;

  /** Mensagem de erro exibida quando validação falha */
  message: string;

  /** Parâmetros adicionais passados para o validador */
  params?: Record<string, unknown>;
}

// ============================================================================
// Interface Principal - Schema Completo para DynamicFormSchema
// ============================================================================

/**
 * Schema completo do formulário dinâmico
 *
 * Este é o tipo principal que define toda a estrutura de um formulário.
 * É armazenado como JSON no campo form_schema de FormularioEntity.
 */
export interface DynamicFormSchema {
  /** ID único do schema */
  id: string;

  /** Versão do schema (ex: '1.0.0', '2.1.0') - usado para versionamento */
  version: string;

  /** Array de seções do formulário */
  sections: FormSectionSchema[];

  /** Validações globais que envolvem múltiplos campos */
  globalValidations?: CrossFieldValidation[];
}

// ============================================================================
// Types Auxiliares para DynamicFormSchema
// ============================================================================

/**
 * Union type para valores possíveis de campos do formulário
 */
export type FormFieldValue = string | number | boolean | Date | null | undefined;

/**
 * Dados do formulário preenchido
 *
 * Record onde a key é o ID do campo e o value é o valor preenchido.
 *
 * @example
 * {
 *   nome: 'João Silva',
 *   cpf: '123.456.789-00',
 *   idade: 30,
 *   ativo: true
 * }
 */
export type DynamicFormData = Record<string, FormFieldValue>;

// ============================================================================
// Type Guards para DynamicFormSchema
// ============================================================================

/**
 * Type guard para verificar se um campo requer opções
 */
export function fieldRequiresOptions(type: FormFieldType): boolean {
  return type === FormFieldType.SELECT || type === FormFieldType.RADIO;
}

/**
 * Type guard para verificar se um campo é formatado brasileiro
 */
export function isFormattedBRField(type: FormFieldType): boolean {
  return [
    FormFieldType.CPF,
    FormFieldType.CNPJ,
    FormFieldType.PHONE,
    FormFieldType.CEP,
  ].includes(type);
}