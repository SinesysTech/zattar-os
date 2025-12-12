/**
 * Tipos e enums do Schema de Formulário Dinâmico (runtime + types).
 *
 * OBS:
 * - Estes exports são usados por Client Components (ex: `DynamicFormRenderer`),
 *   portanto não podem ser `export type` apenas.
 */

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  CPF = 'cpf',
  CNPJ = 'cnpj',
  PHONE = 'phone',
  CEP = 'cep',
}

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  email?: boolean;
  custom?: string;
  message?: string;
}

export interface FormFieldOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface ConditionalRule {
  field: string;
  operator: '=' | '!=' | '>' | '<' | 'contains' | 'empty' | 'notEmpty';
  value?: string | number | boolean;
}

export interface FormFieldSchema {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  validation?: ValidationRule;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: FormFieldOption[];
  conditional?: ConditionalRule;
  gridColumns?: 1 | 2 | 3;
  helpText?: string;
  disabled?: boolean;
}

export interface FormSectionSchema {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldSchema[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface CrossFieldValidation {
  id: string;
  fields: string[];
  validator: string;
  message: string;
  params?: Record<string, unknown>;
}

export interface DynamicFormSchema {
  id: string;
  version: string;
  sections: FormSectionSchema[];
  globalValidations?: CrossFieldValidation[];
}

export type FormFieldValue = string | number | boolean | Date | null | undefined;
export type DynamicFormData = Record<string, FormFieldValue>;

export function fieldRequiresOptions(type: FormFieldType): boolean {
  return type === FormFieldType.SELECT || type === FormFieldType.RADIO;
}

export function isFormattedBRField(type: FormFieldType): boolean {
  return [
    FormFieldType.CPF,
    FormFieldType.CNPJ,
    FormFieldType.PHONE,
    FormFieldType.CEP,
  ].includes(type);
}


