/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Schema Validator - Validação estrutural de schemas JSON para formulários dinâmicos
 *
 * Este módulo valida a estrutura de schemas JSON antes de salvá-los no sistema.
 * Não executa validações de dados (isso é feito pelo Zod gerado), apenas valida
 * a estrutura do schema em si.
 *
 * Erros impedem o salvamento do schema, warnings são informativos.
 *
 * @example
 * ```typescript
 * const result = validateFormSchema(mySchema);
 * if (!result.valid) {
 *   throw new SchemaValidationError(result);
 * }
 * ```
 */

import {
  DynamicFormSchema,
  FormSectionSchema,
  FormFieldSchema,
  CrossFieldValidation,
  FormFieldType,
  fieldRequiresOptions,
  isFormattedBRField
} from '@/types/assinatura-digital/form-schema.types';

/**
 * Resultado da validação de schema
 */
export interface SchemaValidationResult {
  /** Se o schema é válido */
  valid: boolean;
  /** Array de erros críticos que impedem o uso do schema */
  errors: string[];
  /** Array de avisos não-críticos */
  warnings: string[];
}

/**
 * Erro customizado para validação de schema
 */
export class SchemaValidationError extends Error {
  errors: string[];
  warnings: string[];

  constructor(result: SchemaValidationResult) {
    const message = `Schema validation failed:\n${result.errors.join('\n')}`;
    super(message);
    this.name = 'SchemaValidationError';
    this.errors = result.errors;
    this.warnings = result.warnings;
  }
}

/**
 * Valida a estrutura completa de um schema de formulário dinâmico
 */
export function validateFormSchema(schema: DynamicFormSchema): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar campos obrigatórios do schema
  if (!schema.id) {
    errors.push('Schema deve ter um "id"');
  }
  if (!schema.version) {
    errors.push('Schema deve ter uma "version"');
  }
  if (!schema.sections) {
    errors.push('Schema deve ter "sections"');
    return { valid: false, errors, warnings };
  }
  if (!Array.isArray(schema.sections) || schema.sections.length === 0) {
    errors.push('Schema deve ter pelo menos uma seção em "sections"');
    return { valid: false, errors, warnings };
  }

  // Coletar todos os IDs de campos para validações posteriores
  const allFieldIds = new Set<string>();

  // Validar cada seção
  for (const section of schema.sections) {
    const sectionErrors = validateSectionStructure(section, allFieldIds);
    errors.push(...sectionErrors);
  }

  // Validar IDs únicos globalmente
  const duplicateErrors = validateFieldIds(schema);
  errors.push(...duplicateErrors);

  // Validar que conditional.field referencia campos existentes
  const conditionalRefErrors = validateConditionalReferences(schema, allFieldIds);
  errors.push(...conditionalRefErrors);

  // Verificar dependências circulares em conditional
  const circularErrors = checkCircularDependencies(schema);
  errors.push(...circularErrors);

  // Validar globalValidations se existir
  if (schema.globalValidations) {
    for (const validation of schema.globalValidations) {
      const validationErrors = validateCrossFieldValidation(validation, allFieldIds);
      errors.push(...validationErrors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valida a estrutura de uma seção
 */
function validateSectionStructure(section: FormSectionSchema, allFieldIds: Set<string>): string[] {
  const errors: string[] = [];

  if (!section.id) {
    errors.push('Seção deve ter um "id"');
  }
  if (!section.title) {
    errors.push(`Seção "${section.id || 'sem-id'}" deve ter um "title"`);
  }
  if (!section.fields) {
    errors.push(`Seção "${section.id || 'sem-id'}" deve ter "fields"`);
    return errors;
  }
  if (!Array.isArray(section.fields) || section.fields.length === 0) {
    errors.push(`Seção "${section.id || 'sem-id'}" deve ter pelo menos um campo em "fields"`);
    return errors;
  }

  // Validar IDs únicos dentro da seção
  const sectionFieldIds = new Set<string>();

  for (const field of section.fields) {
    // Validar definição do campo
    const fieldErrors = validateFieldDefinition(field);
    errors.push(...fieldErrors.map(err => `[Seção: ${section.id}] ${err}`));

    // Verificar duplicatas na seção
    if (field.id) {
      if (sectionFieldIds.has(field.id)) {
        errors.push(`[Seção: ${section.id}] ID de campo duplicado: "${field.id}"`);
      }
      sectionFieldIds.add(field.id);
      allFieldIds.add(field.id);
    }
  }

  return errors;
}

/**
 * Valida a definição de um campo
 */
function validateFieldDefinition(field: FormFieldSchema): string[] {
  const errors: string[] = [];

  if (!field.id) {
    errors.push('Campo deve ter um "id"');
  }
  if (!field.name) {
    errors.push(`Campo "${field.id || 'sem-id'}" deve ter um "name"`);
  }
  if (!field.label) {
    errors.push(`Campo "${field.id || 'sem-id'}" deve ter um "label"`);
  }
  if (!field.type) {
    errors.push(`Campo "${field.id || 'sem-id'}" deve ter um "type"`);
    return errors;
  }

  // Validar que type é válido
  if (!isValidFormFieldType(field.type)) {
    errors.push(`Campo "${field.id || 'sem-id'}" tem tipo inválido: "${field.type}"`);
  }

  // Validar options para SELECT e RADIO
  if (fieldRequiresOptions(field.type)) {
    if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
      errors.push(`Campo "${field.id || 'sem-id'}" do tipo "${field.type}" deve ter "options" não-vazio`);
    } else {
      // Validar estrutura de cada option
      for (let i = 0; i < field.options.length; i++) {
        const option = field.options[i];
        if (!option.label) {
          errors.push(`Campo "${field.id || 'sem-id'}" option[${i}] deve ter "label"`);
        }
        if (option.value === undefined || option.value === null) {
          errors.push(`Campo "${field.id || 'sem-id'}" option[${i}] deve ter "value"`);
        }
      }
    }
  }

  // Validar validation rules são compatíveis com o tipo
  if (field.validation) {
    const { min, max, pattern, email } = field.validation;

    // min/max para strings
    if ((min !== undefined || max !== undefined) &&
        ![FormFieldType.TEXT, FormFieldType.TEXTAREA, FormFieldType.EMAIL, FormFieldType.NUMBER].includes(field.type as FormFieldType)) {
      errors.push(`Campo "${field.id || 'sem-id'}" do tipo "${field.type}" não suporta validação min/max`);
    }

    // pattern para strings
    if (pattern && ![FormFieldType.TEXT, FormFieldType.TEXTAREA, FormFieldType.EMAIL].includes(field.type as FormFieldType)) {
      errors.push(`Campo "${field.id || 'sem-id'}" do tipo "${field.type}" não suporta validação pattern`);
    }

    // email apenas para EMAIL type
    if (email && field.type !== FormFieldType.EMAIL) {
      errors.push(`Campo "${field.id || 'sem-id'}" do tipo "${field.type}" não deve usar validação email (use type: "email")`);
    }
  }

  // Validar conditional se existir
  if (field.conditional) {
    if (!field.conditional.field) {
      errors.push(`Campo "${field.id || 'sem-id'}" conditional deve ter "field"`);
    }
    if (!field.conditional.operator) {
      errors.push(`Campo "${field.id || 'sem-id'}" conditional deve ter "operator"`);
    }
    // value é obrigatório apenas para operadores que precisam dele
    const operatorsRequiringValue = ['=', '!=', '>', '<', 'contains'];
    if (operatorsRequiringValue.includes(field.conditional.operator) && field.conditional.value === undefined) {
      errors.push(`Campo "${field.id || 'sem-id'}" conditional com operator "${field.conditional.operator}" deve ter "value"`);
    }
  }

  // Validar gridColumns
  if (field.gridColumns !== undefined) {
    if (![1, 2, 3].includes(field.gridColumns)) {
      errors.push(`Campo "${field.id || 'sem-id'}" gridColumns deve ser 1, 2 ou 3`);
    }
  }

  return errors;
}

/**
 * Valida que todos os IDs de campos são únicos globalmente
 */
function validateFieldIds(schema: DynamicFormSchema): string[] {
  const errors: string[] = [];
  const seenIds = new Map<string, string>(); // id -> section id

  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.id) {
        if (seenIds.has(field.id)) {
          errors.push(`ID de campo duplicado: "${field.id}" encontrado nas seções "${seenIds.get(field.id)}" e "${section.id}"`);
        } else {
          seenIds.set(field.id, section.id);
        }
      }
    }
  }

  return errors;
}

/**
 * Valida que todos os conditional.field referenciam campos existentes
 */
function validateConditionalReferences(schema: DynamicFormSchema, allFieldIds: Set<string>): string[] {
  const errors: string[] = [];

  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.conditional && field.conditional.field) {
        if (!allFieldIds.has(field.conditional.field)) {
          errors.push(`Campo "${field.id}" conditional referencia campo inexistente: "${field.conditional.field}"`);
        }
      }
    }
  }

  return errors;
}

/**
 * Verifica dependências circulares em conditional rendering
 */
function checkCircularDependencies(schema: DynamicFormSchema): string[] {
  const errors: string[] = [];

  // Construir grafo de dependências
  const dependencies = new Map<string, string[]>(); // fieldId -> [dependsOn...]
  const allFields = new Map<string, FormFieldSchema>();

  for (const section of schema.sections) {
    for (const field of section.fields) {
      allFields.set(field.id, field);
      if (field.conditional) {
        if (!dependencies.has(field.id)) {
          dependencies.set(field.id, []);
        }
        dependencies.get(field.id)!.push(field.conditional.field);
      }
    }
  }

  // DFS para detectar ciclos
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function detectCycle(fieldId: string, path: string[]): boolean {
    visited.add(fieldId);
    recursionStack.add(fieldId);
    path.push(fieldId);

    const deps = dependencies.get(fieldId) || [];
    for (const dep of deps) {
      if (!visited.has(dep)) {
        if (detectCycle(dep, [...path])) {
          return true;
        }
      } else if (recursionStack.has(dep)) {
        // Ciclo detectado
        const cyclePath = [...path, dep];
        errors.push(`Dependência circular detectada: ${cyclePath.join(' → ')}`);
        return true;
      }
    }

    recursionStack.delete(fieldId);
    return false;
  }

  for (const fieldId of dependencies.keys()) {
    if (!visited.has(fieldId)) {
      detectCycle(fieldId, []);
    }
  }

  return errors;
}

/**
 * Valida definição de validação cross-field
 */
function validateCrossFieldValidation(validation: CrossFieldValidation, allFieldIds: Set<string>): string[] {
  const errors: string[] = [];

  if (!validation.id) {
    errors.push('CrossFieldValidation deve ter um "id"');
  }
  if (!validation.fields || !Array.isArray(validation.fields) || validation.fields.length === 0) {
    errors.push(`CrossFieldValidation "${validation.id || 'sem-id'}" deve ter "fields" não-vazio`);
  } else {
    // Validar que todos os field IDs existem
    for (const fieldId of validation.fields) {
      if (!allFieldIds.has(fieldId)) {
        errors.push(`CrossFieldValidation "${validation.id || 'sem-id'}" referencia campo inexistente: "${fieldId}"`);
      }
    }
  }
  if (!validation.validator) {
    errors.push(`CrossFieldValidation "${validation.id || 'sem-id'}" deve ter "validator"`);
  }
  if (!validation.message) {
    errors.push(`CrossFieldValidation "${validation.id || 'sem-id'}" deve ter "message"`);
  }

  return errors;
}

/**
 * Verifica se um tipo é um FormFieldType válido
 */
function isValidFormFieldType(type: string): boolean {
  return Object.values(FormFieldType).includes(type as FormFieldType);
}
