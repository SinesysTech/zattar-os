/**
 * Zod Generator - Gerador de schemas Zod a partir de schemas JSON
 *
 * Converte DynamicFormSchema (JSON) em schemas Zod tipados, integrando:
 * - Validadores do validator-registry
 * - Transformadores/formatters
 * - Validação progressiva (UX - não mostrar erros prematuros)
 * - Cross-field validations via superRefine
 * - TEXT_LIMITS automáticos
 *
 * O schema gerado é usado como resolver do React Hook Form.
 *
 * @example
 * ```typescript
 * const zodSchema = generateZodSchema(appsSchema);
 * const { register, handleSubmit } = useForm({ resolver: zodResolver(zodSchema) });
 * ```
 */

import { z } from 'zod';
import {
  DynamicFormSchema,
  FormFieldSchema,
  FormFieldType,
  ValidationRule,
  CrossFieldValidation
} from '@/types/assinatura-digital/form-schema.types';
import {
  VALIDATOR_REGISTRY,
  TRANSFORMER_REGISTRY,
  CROSS_FIELD_VALIDATOR_REGISTRY,
  getValidator,
  getTransformer,
  getCrossFieldValidator
} from './validator-registry';
import { validateCPF } from '@/lib/assinatura-digital/validators/cpf.validator';
import { validateCNPJ } from '@/lib/assinatura-digital/validators/cnpj.validator';
import { validateTelefone } from '@/lib/assinatura-digital/validators/telefone.validator';
import { TEXT_LIMITS } from '@/lib/assinatura-digital/validations/business.validations';
import { parseCPF, parseCNPJ, parseTelefone, parseCEP, parseData } from '@/lib/assinatura-digital/formatters';

/**
 * Gera schema Zod completo a partir de DynamicFormSchema
 *
 * @returns Zod object schema with properly typed shape (z.ZodRawShape)
 */
export function generateZodSchema(schema: DynamicFormSchema): z.ZodObject<z.ZodRawShape> {
  const fields: Record<string, z.ZodTypeAny> = {};

  // Processar cada seção e seus campos
  for (const section of schema.sections) {
    for (const field of section.fields) {
      // 1. Obter tipo base
      let zodType = fieldTypeToZod(field);

      // 2. Aplicar regras de validação básicas
      zodType = applyValidationRules(zodType, field.validation);

      // 3. Aplicar validadores customizados
      zodType = applyCustomValidators(zodType, field.type, field.validation);

      // 4. Aplicar validação progressiva
      zodType = applyProgressiveValidation(zodType, field.type);

      // 5. Aplicar limites de texto automáticos
      zodType = applyTextLimits(zodType, field.type, field.id);

      // 6. Aplicar transformações
      zodType = applyTransformations(zodType, field.type);

      // 7. Aplicar validação de required APÓS transformações
      zodType = applyRequiredValidation(zodType, field);

      fields[field.id] = zodType;
    }
  }

  // Criar schema base
  let zodSchema: z.ZodTypeAny = z.object(fields);

  // Aplicar globalValidations (cross-field validations)
  if (schema.globalValidations) {
    for (const validation of schema.globalValidations) {
      zodSchema = generateCrossFieldValidation(zodSchema, validation);
    }
  }

  return zodSchema as z.ZodObject<z.ZodRawShape>;
}

/**
 * Mapeia FormFieldType para tipo Zod base
 */
function fieldTypeToZod(field: FormFieldSchema): z.ZodTypeAny {
  const isRequired = field.validation?.required !== false;

  let baseType: z.ZodTypeAny;

  const fieldLabel = field.label || 'Campo';

  switch (field.type) {
    case FormFieldType.TEXT:
    case FormFieldType.EMAIL:
    case FormFieldType.TEXTAREA:
    case FormFieldType.CPF:
    case FormFieldType.CNPJ:
    case FormFieldType.PHONE:
    case FormFieldType.CEP:
    case FormFieldType.DATE:
      baseType = z.string();
      break;

    case FormFieldType.NUMBER:
      // Number vem como string do input, usar coerce para converter e permitir min/max
      baseType = z.coerce.number();
      break;

    case FormFieldType.SELECT:
    case FormFieldType.RADIO:
      // Determinar tipo baseado nas options e aplicar coercion apropriada
      if (field.options && field.options.length > 0) {
        const firstValue = field.options[0].value;
        if (typeof firstValue === 'number') {
          // SELECT com valores numéricos - HTML retorna string, coerce para number
          baseType = z.coerce.number();
        } else if (typeof firstValue === 'boolean') {
          // RADIO com valores boolean - HTML retorna string 'true'/'false', converter
          baseType = z.preprocess((val) => {
            if (val === 'true' || val === true) return true;
            if (val === 'false' || val === false) return false;
            return val;
          }, z.boolean());
        } else {
          baseType = z.string();
        }
      } else {
        baseType = z.string();
      }
      break;

    case FormFieldType.CHECKBOX:
      baseType = z.boolean().default(field.defaultValue === true);
      break;

    default:
      baseType = z.string();
  }

  // Aplicar optional se não for obrigatório
  if (!isRequired && field.type !== FormFieldType.CHECKBOX) {
    baseType = baseType.optional().or(z.literal(''));
  }
  // NOTA: validação de required para strings será feita via refine() após transformações

  return baseType;
}

/**
 * Aplica regras de validação básicas (min, max, pattern, email)
 */
function applyValidationRules(zodType: z.ZodTypeAny, validation?: ValidationRule): z.ZodTypeAny {
  if (!validation) return zodType;

  // Min length/value
  if (validation.min !== undefined) {
    if (zodType instanceof z.ZodString) {
      zodType = zodType.min(validation.min, validation.message || `Mínimo ${validation.min} caracteres`);
    } else if (zodType instanceof z.ZodNumber) {
      zodType = zodType.min(validation.min, validation.message || `Valor mínimo ${validation.min}`);
    }
  }

  // Max length/value
  if (validation.max !== undefined) {
    if (zodType instanceof z.ZodString) {
      zodType = zodType.max(validation.max, validation.message || `Máximo ${validation.max} caracteres`);
    } else if (zodType instanceof z.ZodNumber) {
      zodType = zodType.max(validation.max, validation.message || `Valor máximo ${validation.max}`);
    }
  }

  // Pattern (regex)
  if (validation.pattern) {
    if (zodType instanceof z.ZodString) {
      zodType = zodType.regex(new RegExp(validation.pattern), validation.message || 'Formato inválido');
    }
  }

  // Email
  if (validation.email) {
    if (zodType instanceof z.ZodString) {
      zodType = zodType.email(validation.message || 'Email inválido');
    }
  }

  return zodType;
}

/**
 * Aplica validadores customizados do registry
 */
function applyCustomValidators(zodType: z.ZodTypeAny, fieldType: FormFieldType, validation?: ValidationRule): z.ZodTypeAny {
  // Validador customizado explícito
  if (validation?.custom) {
    const validator = getValidator(validation.custom);
    if (validator) {
      zodType = (zodType as z.ZodString).refine(
        (val: unknown) => validator(val, {}),
        validation.message || 'Valor inválido'
      );
    }
  }

  return zodType;
}

/**
 * Aplica validação progressiva para campos formatados (UX)
 * Não mostra erros enquanto usuário está digitando
 */
function applyProgressiveValidation(zodType: z.ZodTypeAny, fieldType: FormFieldType): z.ZodTypeAny {
  switch (fieldType) {
    case FormFieldType.CPF:
      zodType = (zodType as z.ZodString)
        .refine((val: string) => {
          const digits = val.replace(/\D/g, '');
          if (digits.length === 0 || digits.length < 11) return true; // Parcial = válido
          return digits.length === 11;
        }, 'CPF deve ter 11 dígitos')
        .refine((val: string) => {
          const digits = val.replace(/\D/g, '');
          if (digits.length !== 11) return true; // Se não tem 11, não validar algoritmo ainda
          return validateCPF(digits);
        }, 'CPF inválido');
      break;

    case FormFieldType.CNPJ:
      zodType = (zodType as z.ZodString)
        .refine((val: string) => {
          const digits = val.replace(/\D/g, '');
          if (digits.length === 0 || digits.length < 14) return true;
          return digits.length === 14;
        }, 'CNPJ deve ter 14 dígitos')
        .refine((val: string) => {
          const digits = val.replace(/\D/g, '');
          if (digits.length !== 14) return true;
          return validateCNPJ(digits);
        }, 'CNPJ inválido');
      break;

    case FormFieldType.PHONE:
      zodType = (zodType as z.ZodString)
        .refine((val: string) => {
          const digits = val.replace(/\D/g, '');
          if (digits.length === 0 || digits.length < 10) return true;
          return digits.length === 10 || digits.length === 11;
        }, 'Telefone deve ter 10 ou 11 dígitos')
        .refine((val: string) => {
          const digits = val.replace(/\D/g, '');
          if (digits.length < 10) return true;
          return validateTelefone(digits);
        }, 'Telefone inválido');
      break;

    case FormFieldType.CEP:
      zodType = (zodType as z.ZodString).refine((val: string) => {
        const digits = val.replace(/\D/g, '');
        if (digits.length === 0 || digits.length < 8) return true;
        return digits.length === 8;
      }, 'CEP deve ter 8 dígitos');
      break;

    case FormFieldType.DATE:
      zodType = (zodType as z.ZodString)
        .refine((val: string) => {
          if (!val || val.length < 10) return true; // Parcial = válido
          return /^\d{2}\/\d{2}\/\d{4}$/.test(val);
        }, 'Data deve estar no formato dd/mm/aaaa')
        .refine((val: string) => {
          if (!val || !/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return true;
          const [day, month, year] = val.split('/').map(Number);
          const date = new Date(year, month - 1, day);
          return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
        }, 'Data inválida');
      break;
  }

  return zodType;
}

/**
 * Aplica transformações apropriadas ao tipo de campo
 * NOTA: Validações de "required" devem ser feitas VIA REFINE após a transformação,
 * pois transformações acontecem antes de validações no Zod.
 */
function applyTransformations(zodType: z.ZodTypeAny, fieldType: FormFieldType): z.ZodTypeAny {
  switch (fieldType) {
    case FormFieldType.CPF:
      zodType = (zodType as z.ZodString).transform(parseCPF);
      break;

    case FormFieldType.CNPJ:
      zodType = (zodType as z.ZodString).transform(parseCNPJ);
      break;

    case FormFieldType.PHONE:
      zodType = (zodType as z.ZodString).transform(parseTelefone);
      break;

    case FormFieldType.CEP:
      zodType = (zodType as z.ZodString).transform(parseCEP);
      break;

    case FormFieldType.DATE:
      zodType = (zodType as z.ZodString).transform(parseData);
      break;

    case FormFieldType.TEXT:
    case FormFieldType.TEXTAREA:
      // Trim, mas NÃO transformar undefined/null em ''
      // Deixar isso para a validação required decidir
      zodType = (zodType as z.ZodString).transform((val: string) => val?.trim() ?? '');
      break;

    case FormFieldType.EMAIL:
      zodType = (zodType as z.ZodString).transform((val: string) => val?.toLowerCase().trim() ?? '');
      break;
  }

  return zodType;
}

/**
 * Aplica validação de required APÓS transformações.
 * Deve ser chamado depois de applyTransformations() para garantir que
 * strings vazias/trimmed sejam corretamente rejeitadas.
 */
function applyRequiredValidation(zodType: z.ZodTypeAny, field: FormFieldSchema): z.ZodTypeAny {
  const isRequired = field.validation?.required !== false;

  // Apenas aplicar para campos string que são obrigatórios
  if (!isRequired) return zodType;

  // Para campos de string (após transformação), validar que não está vazio
  const stringTypes = [
    FormFieldType.TEXT,
    FormFieldType.EMAIL,
    FormFieldType.TEXTAREA,
    FormFieldType.CPF,
    FormFieldType.CNPJ,
    FormFieldType.PHONE,
    FormFieldType.CEP,
    FormFieldType.DATE
  ];

  if (stringTypes.includes(field.type)) {
    // Após transform(), zodType é um ZodEffects que ainda pode usar refine()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zodType = (zodType as any).refine(
      (val: string) => {
        // val é o valor APÓS a transformação
        return val !== undefined && val !== null && val.length > 0;
      },
      `${field.label || 'Campo'} obrigatório`
    );
  }

  return zodType;
}

/**
 * Aplica limites de caracteres de TEXT_LIMITS automaticamente
 * Apenas para campos TEXTAREA que não possuem max explícito no JSON
 */
function applyTextLimits(zodType: z.ZodTypeAny, fieldType: FormFieldType, fieldId: string): z.ZodTypeAny {
  if (fieldType !== FormFieldType.TEXTAREA) return zodType;

  // Mapear fieldId para chave de TEXT_LIMITS (apenas para TEXTAREA fields)
  const limitMap: Record<string, keyof typeof TEXT_LIMITS> = {
    acidenteDescricao: 'acidenteDescricao',
    adoecimentoDescricao: 'adoecimentoDescricao',
    observacoes: 'observacoes',
  };

  const limitKey = limitMap[fieldId];
  if (limitKey && TEXT_LIMITS[limitKey]) {
    const limit = TEXT_LIMITS[limitKey];
    if (zodType instanceof z.ZodString) {
      zodType = zodType.max(limit, `Máximo ${limit} caracteres`);
    }
  }

  return zodType;
}

/**
 * Gera validação cross-field usando superRefine
 *
 * @returns Zod schema with cross-field validation applied (may be ZodEffects)
 */
function generateCrossFieldValidation(
  zodSchema: z.ZodTypeAny,
  validation: CrossFieldValidation
): z.ZodTypeAny {
  const validator = getCrossFieldValidator(validation.validator);

  if (!validator) {
    console.warn(`Cross-field validator não encontrado: ${validation.validator}`);
    return zodSchema;
  }

  // superRefine works on any Zod schema
  return (zodSchema as z.ZodObject<z.ZodRawShape>).superRefine((data, ctx) => {
    const isValid = validator(data, validation.params || {});
    if (!isValid) {
      // Adicionar erro no primeiro campo da lista
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validation.message,
        path: [validation.fields[0]],
      });
    }
  });
}