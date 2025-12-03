/**
 * Assinatura Digital - Form Schema Types
 *
 * Tipos TypeScript para definição de schemas de formulários dinâmicos (JSON-driven forms).
 * Sistema inspirado em formcn/AutoForm mas adaptado para usar JSON como fonte de dados.
 *
 * Características:
 * - Compatível com validação progressiva (FORM_VALIDATION_UX.md)
 * - Suporte a campos formatados brasileiros (CPF, CNPJ, phone, CEP)
 * - Renderização condicional de campos
 * - Validações cross-field entre múltiplos campos
 * - Integração com validadores customizados de lib/validators/
 */

// ============================================================================
// Enums
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
// Interfaces de Validação
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
// Interfaces de Opções
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
// Interfaces de Renderização Condicional
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
// Interfaces de Campos
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
// Interfaces de Seções
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
// Interfaces de Validações Cross-Field
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
// Interface Principal - Schema Completo
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
// Types Auxiliares
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
// Type Guards
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