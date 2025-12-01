import { z } from 'zod';
import { DynamicFormSchema } from '@/types/formsign/form-schema.types';
import { SLUG_PATTERN, generateFormularioSlug } from '@/lib/formsign/slug-helpers';
import { MetadadoSeguranca } from '@/types/formsign/template.types';

/**
 * Formulario Entity Types
 *
 * IMPORTANTE: Este arquivo define FormularioEntity (entidade no banco de dados).
 * NÃO confundir com types/formulario.types.ts que define FormularioContext
 * (contexto do fluxo multi-step).
 *
 * Diferenças:
 * - FormularioEntity: Entidade persistida no n8n Data Tables, representa um tipo de formulário
 *   configurável (ex: 'Contrato Apps', 'Ação Trabalhista') com seu schema de campos dinâmicos.
 *
 * - FormularioContext: Estado do fluxo multi-step no Zustand, guarda dados temporários
 *   durante o preenchimento do formulário pelo usuário.
 *
 * Relacionamentos:
 * - Formulário pertence a UM ÚNICO Segmento (relação 1:N via segmento_id)
 * - Formulário usa múltiplos Templates (relação N:N via array template_ids)
 * - form_schema define os campos dinâmicos do formulário
 */

// ============================================================================
// Interface Principal - Backend (snake_case)
// ============================================================================

/**
 * Interface FormularioEntity - Representa um tipo de formulário no sistema
 *
 * Exemplos: 'Contrato Apps', 'Ação Trabalhista', 'Cadastro de Cliente', etc.
 * Cada formulário pertence a um segmento e possui um schema de campos dinâmicos.
 */
export interface FormularioEntity {
  /** ID auto-incremental do n8n Data Tables (Primary Key) */
  id: number;

  /** UUID de negócio gerado pelo Next.js */
  formulario_uuid: string;

  /** Nome do formulário (ex: 'Contrato Apps', 'Ação Trabalhista') */
  nome: string;

  /** Slug único para URL (ex: 'contrato-apps', 'acao-trabalhista') */
  slug: string;

  /** Descrição opcional do formulário */
  descricao?: string;

  /** ID do segmento ao qual pertence (FK - relação 1:N) */
  segmento_id: number;

  /**
   * Schema JSON de campos dinâmicos do formulário
   * Define quais campos serão exibidos e como validá-los
   */
  form_schema: DynamicFormSchema;

  /** Versão do schema (ex: '1.0.0') - permite versionamento e migração */
  schema_version: string;

  /**
   * Array de IDs/UUIDs de templates usados no fluxo
   * Gerencia relação N:N com templates
   */
  template_ids: string[];

  /** Flag de ativação (default: true) */
  ativo: boolean;

  /**
   * Flag de arquivamento (opcional)
   * Quando true, indica que o formulário foi arquivado
   * Status derivado: arquivado > ativo > inativo
   */
  arquivado?: boolean;

  /** Ordem de exibição (opcional) */
  ordem?: number;

  /**
   * Flag indicando se captura de selfie é obrigatória neste formulário
   * Controla se a etapa de captura de foto será incluída no fluxo multi-step
   * @default true
   */
  foto_necessaria?: boolean;

  /**
   * Flag indicando se captura de geolocalização GPS é obrigatória
   * Controla se a etapa de captura de localização será incluída no fluxo multi-step
   * @default false
   */
  geolocation_necessaria?: boolean;

  /**
   * Array de metadados de segurança a serem capturados automaticamente
   * Controla quais metadados técnicos serão coletados durante o preenchimento
   * @default ['ip', 'user_agent']
   */
  metadados_seguranca?: MetadadoSeguranca[];

  /** Timestamp ISO do n8n (camelCase) - Data de criação */
  createdAt: string;

  /** Timestamp ISO do n8n (camelCase) - Data de atualização */
  updatedAt: string;

  /** Usuário que criou o formulário */
  criado_por?: string;
}

// ============================================================================
// Interface de Formulário - Frontend (camelCase)
// ============================================================================

/**
 * Interface para formulário de criação/edição de FormularioEntity
 * Usa camelCase seguindo padrão do frontend
 */
export interface FormularioForm {
  /** Nome do formulário */
  nome: string;

  /** Slug único para URL */
  slug: string;

  /** Descrição opcional */
  descricao?: string;

  /** ID do segmento */
  segmento_id: number;

  /** Array de IDs de templates */
  template_ids: string[];

  /**
   * Flag indicando se captura de selfie é obrigatória neste formulário
   * @default true
   */
  foto_necessaria?: boolean;

  /**
   * Flag indicando se captura de geolocalização GPS é obrigatória
   * @default false
   */
  geolocation_necessaria?: boolean;

  /**
   * Array de metadados de segurança a serem capturados automaticamente
   * @default ['ip', 'user_agent']
   */
  metadados_seguranca?: MetadadoSeguranca[];
}

// ============================================================================
// NOTA: Payloads, Filtros e Responses foram movidos para types/n8n.types.ts
// para eliminar duplicação e centralizar contratos de API.
// ============================================================================

// ============================================================================
// Interface com Join
// ============================================================================

/**
 * Interface FormularioEntity com dados do segmento populados via JOIN
 *
 * USO RECOMENDADO:
 * - Listagens na dashboard que precisam exibir nome/slug do segmento
 * - Cards de formulários ativos que precisam gerar links
 * - Tabelas administrativas com filtros por segmento
 *
 * IMPLEMENTAÇÃO:
 * - Requer modificação no workflow n8n para fazer JOIN com tabela segmentos
 * - Alternativa temporária: Buscar segmentos separadamente e fazer merge client-side
 *
 * EXEMPLO DE QUERY SQL (para workflow n8n):
 * ```sql
 * SELECT f.*, s.nome as segmento_nome, s.slug as segmento_slug
 * FROM formularios f
 * INNER JOIN segmentos s ON f.segmento_id = s.id
 * WHERE f.ativo = true
 * ```
 */
export interface FormularioComSegmentos extends FormularioEntity {
  /** Nome do segmento ao qual pertence */
  segmento_nome: string;

  /** Slug do segmento */
  segmento_slug: string;
}

// ============================================================================
// Validação Zod
// ============================================================================

/**
 * Schema Zod básico para validação de estrutura de DynamicFormSchema
 * Valida apenas estrutura mínima (objeto com id, version, sections)
 *
 * @see DynamicFormSchema para a definição completa do tipo
 */
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

/**
 * Schema Zod relaxado para criação de FormularioEntity
 * Permite sections vazias (min 0) para permitir criação com schema padrão
 *
 * @see DynamicFormSchema para a definição completa do tipo
 */
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

/**
 * Schema Zod para validação de formulário de FormularioEntity (update/completo)
 */
export const formularioEntitySchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  slug: z
    .string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(
      SLUG_PATTERN,
      'Slug deve estar no formato kebab-case (ex: contrato-apps)'
    )
    .toLowerCase(),

  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),

  segmento_id: z
    .number()
    .int()
    .positive('Selecione um segmento'),

  template_ids: z
    .array(z.string())
    .min(1, 'Deve haver ao menos um template associado'),

  form_schema: dynamicFormSchemaBasicValidation,

  foto_necessaria: z.boolean().optional(),

  geolocation_necessaria: z.boolean().optional(),

  metadados_seguranca: z
    .array(z.enum(['ip', 'user_agent', 'device_info']))
    .optional(),
});

/**
 * Schema Zod relaxado para criação de FormularioEntity
 * Permite form_schema com sections vazias (para formulários em construção)
 */
export const formularioEntityCreateSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  slug: z
    .string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(
      SLUG_PATTERN,
      'Slug deve estar no formato kebab-case (ex: contrato-apps)'
    )
    .toLowerCase(),

  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),

  segmento_id: z
    .number()
    .int()
    .positive('Selecione um segmento'),

  template_ids: z
    .array(z.string())
    .min(1, 'Deve haver ao menos um template associado'),

  form_schema: dynamicFormSchemaBasicValidationCreate,

  foto_necessaria: z.boolean().optional(),

  geolocation_necessaria: z.boolean().optional(),

  metadados_seguranca: z
    .array(z.enum(['ip', 'user_agent', 'device_info']))
    .optional(),
});

/**
 * Type inferido do schema Zod completo
 */
export type FormularioEntitySchemaType = z.infer<typeof formularioEntitySchema>;

/**
 * Type inferido do schema Zod de criação
 */
export type FormularioEntityCreateSchemaType = z.infer<typeof formularioEntityCreateSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gera slug a partir do nome do formulário
 *
 * @param nome - Nome do formulário
 * @returns Slug no formato kebab-case
 *
 * @example
 * generateSlugFromNome('Contrato Apps') // 'contrato-apps'
 * generateSlugFromNome('Ação Trabalhista') // 'acao-trabalhista'
 */
export function generateSlugFromNome(nome: string): string {
  return generateFormularioSlug(nome);
}

/**
 * Mapeia dados do formulário (camelCase) para formato do backend (snake_case)
 *
 * @param form - Dados do formulário
 * @returns Objeto parcial de FormularioEntity pronto para envio ao backend
 */
export function mapFormularioFormToFormulario(
  form: FormularioForm
): Partial<FormularioEntity> {
  return {
    nome: form.nome,
    slug: form.slug,
    descricao: form.descricao,
    segmento_id: form.segmento_id,
    template_ids: form.template_ids,
    foto_necessaria: form.foto_necessaria,
    geolocation_necessaria: form.geolocation_necessaria,
    metadados_seguranca: form.metadados_seguranca,
  };
}