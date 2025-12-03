/**
 * Validator Registry - Registry centralizado de validadores e transformadores
 *
 * Este módulo mapeia nomes de validadores (strings no JSON) para funções reais
 * de validação e transformação. Usado pelo gerador de schemas Zod.
 *
 * Extensível via registerValidator/registerTransformer para validadores customizados.
 *
 * @example
 * ```typescript
 * const validator = getValidator('validateCPF');
 * if (validator && !validator(cpf)) {
 *   // CPF inválido
 * }
 * ```
 */

import { validateCPF } from '@/lib/assinatura-digital/validators/cpf.validator';
import { validateCNPJ } from '@/lib/assinatura-digital/validators/cnpj.validator';
import { validateTelefone } from '@/lib/assinatura-digital/validators/telefone.validator';
import {
  validateCEP,
  validateEmail,
  validateBirthDate,
  validateCPFDigits,
  validateCNPJDigits,
  validateBrazilianPhone,
  validateBusinessDates,
  TEXT_LIMITS
} from '@/lib/assinatura-digital/validations/business.validations';
import {
  parseData,
  parseCPF,
  parseCNPJ,
  parseCPFCNPJ,
  parseTelefone,
  parseCEP,
  formatCPF,
  formatCNPJ,
  formatTelefone,
  formatCEP,
  formatData,
  convertToISO
} from '@/lib/assinatura-digital/formatters';

/**
 * Tipo para funções validadoras
 * @param value - Valor a ser validado
 * @param params - Parâmetros opcionais para validação
 * @returns true se válido, false caso contrário
 */
export type ValidatorFunction = (value: unknown, params?: Record<string, unknown>) => boolean;

/**
 * Tipo para funções transformadoras
 * @param value - Valor a ser transformado
 * @returns Valor transformado
 */
export type TransformerFunction = (value: unknown) => unknown;

/**
 * Registry de validadores disponíveis
 * Mapeia strings (nomes no JSON) para funções de validação
 */
export const VALIDATOR_REGISTRY: Record<string, ValidatorFunction> = {
  // Validadores de lib/validators/
  validateCPF: (value) => validateCPF(String(value)),
  validateCNPJ: (value) => validateCNPJ(String(value)),
  validateTelefone: (value) => validateTelefone(String(value)),

  // Validadores de lib/validations/business.validations.ts
  validateCEP: (value) => validateCEP(String(value)).valid,
  validateEmail: (value) => validateEmail(String(value)).valid,
  validateBirthDate: (value) => validateBirthDate(String(value)).valid,
  validateCPFDigits: (value) => validateCPFDigits(String(value)).valid,
  validateCNPJDigits: (value) => validateCNPJDigits(String(value)).valid,
  validateBrazilianPhone: (value) => validateBrazilianPhone(String(value)).valid,

  // Validador de CPF ou CNPJ (aceita ambos)
  validateCPFOrCNPJ: (value) => {
    const str = String(value || '');
    const digits = str.replace(/\D/g, '');
    if (digits.length === 0) return true; // Vazio = válido (campo opcional)
    if (digits.length < 11) return true; // Parcial = válido (não validar ainda)
    if (digits.length === 11) return validateCPF(digits);
    if (digits.length < 14) return true; // Parcial CNPJ = válido
    if (digits.length === 14) return validateCNPJ(digits);
    return false; // Mais de 14 dígitos = inválido
  },

  // Validadores de data
  validateDate: (value) => {
    const dateStr = String(value);
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  },

  validateDateNotFuture: (value) => {
    const dateStr = String(value);
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return true; // Se inválido, deixar outro validador pegar
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  },

  // Validador de texto length (usa params)
  validateTextLength: (value, params) => {
    const text = String(value || '');
    const maxLength = params?.maxLength as number;
    if (!maxLength) return true;
    return text.length <= maxLength;
  },
};

/**
 * Registry de transformadores disponíveis
 * Mapeia strings (nomes no JSON) para funções de transformação
 */
export const TRANSFORMER_REGISTRY: Record<string, TransformerFunction> = {
  // Transformadores de lib/formatters/
  parseData: (value) => parseData(String(value)),
  parseCPF: (value) => parseCPF(String(value)),
  parseCNPJ: (value) => parseCNPJ(String(value)),
  parseCPFCNPJ: (value) => parseCPFCNPJ(String(value)),
  parseTelefone: (value) => parseTelefone(String(value)),
  parseCEP: (value) => parseCEP(String(value)),
  formatCPF: (value) => formatCPF(String(value)),
  formatCNPJ: (value) => formatCNPJ(String(value)),
  formatTelefone: (value) => formatTelefone(String(value)),
  formatCEP: (value) => formatCEP(String(value)),
  formatData: (value) => formatData(String(value)),
  convertToISO: (value) => convertToISO(String(value)),

  // Transformadores especiais
  toLowerCase: (value) => String(value).toLowerCase(),
  toUpperCase: (value) => String(value).toUpperCase(),
  trim: (value) => String(value).trim(),
  removeNonDigits: (value) => String(value).replace(/\D/g, ''),
};

/**
 * Tipo para funções validadoras cross-field
 * @param data - Contexto completo do formulário
 * @param params - Parâmetros opcionais para validação
 * @returns true se válido, false caso contrário
 */
export type CrossFieldValidatorFunction = (
  data: Record<string, unknown>,
  params?: Record<string, unknown>
) => boolean;

/**
 * Registry de validadores cross-field
 * Validam múltiplos campos juntos com contexto completo do formulário
 */
export const CROSS_FIELD_VALIDATOR_REGISTRY: Record<string, CrossFieldValidatorFunction> = {
  /**
   * Valida que endDate >= startDate (ou > se allowEqual false)
   */
  validateDateRange: (data: Record<string, unknown>, params?: Record<string, unknown>) => {
    if (!params) return true; // Se não houver params, não validar
    const { startField, endField, allowEqual } = params as { startField: string; endField: string; allowEqual?: boolean };
    const startDate = data[startField] as string;
    const endDate = data[endField] as string;
    if (!startDate || !endDate) return true; // Se algum vazio, não validar

    // Converter dd/mm/aaaa ou ISO para Date
    const parseDate = (dateStr: string): Date | null => {
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
      } else if (dateStr.includes('-')) {
        return new Date(dateStr);
      }
      return null;
    };

    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!start || !end) return true; // Se inválido, deixar outro validador pegar

    return allowEqual ? end >= start : end > start;
  },

  /**
   * Valida datas de negócio (apps/trabalhista) usando business.validations
   */
  validateBusinessDates: (data: Record<string, unknown>, params?: Record<string, unknown>) => {
    if (!params) return true; // Se não houver params, não validar
    const { tipoValidacao } = params as { tipoValidacao: 'apps' | 'trabalhista' };
    const context = {
      dataInicio: data.dataInicio as string,
      dataBloqueio: data.dataBloqueio as string,
      dataRescisao: data.dataRescisao as string,
      situacao: data.situacao as 'V' | 'F',
      tipoValidacao: tipoValidacao,
    };
    return validateBusinessDates(context).valid;
  },

  /**
   * Valida que dataBloqueio é obrigatória quando situacao='F'
   */
  validateDateBloqueioRequired: (data: Record<string, unknown>) => {
    const situacao = data.situacao as string;
    const dataBloqueio = data.dataBloqueio as string;
    if (situacao === 'F') {
      return !!dataBloqueio && dataBloqueio.trim() !== '';
    }
    return true;
  },

  /**
   * Valida campo condicional obrigatório
   * Ex: se acidenteTrabalho=true, acidenteDescricao deve estar preenchido
   */
  validateConditionalRequired: (
    data: Record<string, unknown>,
    params?: Record<string, unknown>
  ) => {
    if (!params) return true; // Se não houver params, não validar
    const { conditionField, conditionValue: expectedValue, requiredField } = params as { conditionField: string; conditionValue: unknown; requiredField: string };
    const conditionValue = data[conditionField];
    const requiredValue = data[requiredField];

    // Se condição não é atendida, não validar
    if (conditionValue !== expectedValue) return true;

    // Condição atendida, campo deve estar preenchido
    if (typeof requiredValue === 'string') {
      return requiredValue.trim() !== '';
    }
    return !!requiredValue;
  },
};

/**
 * Retorna um validador do registry
 * @param name - Nome do validador
 * @returns Função validadora ou undefined se não encontrada
 */
export function getValidator(name: string): ValidatorFunction | undefined {
  return VALIDATOR_REGISTRY[name];
}

/**
 * Retorna um transformador do registry
 * @param name - Nome do transformador
 * @returns Função transformadora ou undefined se não encontrada
 */
export function getTransformer(name: string): TransformerFunction | undefined {
  return TRANSFORMER_REGISTRY[name];
}

/**
 * Retorna um validador cross-field do registry
 * @param name - Nome do validador cross-field
 * @returns Função validadora ou undefined se não encontrada
 */
export function getCrossFieldValidator(name: string): CrossFieldValidatorFunction | undefined {
  return CROSS_FIELD_VALIDATOR_REGISTRY[name];
}

/**
 * Registra um validador customizado em runtime
 * @param name - Nome do validador
 * @param validator - Função validadora
 */
export function registerValidator(name: string, validator: ValidatorFunction): void {
  VALIDATOR_REGISTRY[name] = validator;
}

/**
 * Registra um transformador customizado em runtime
 * @param name - Nome do transformador
 * @param transformer - Função transformadora
 */
export function registerTransformer(name: string, transformer: TransformerFunction): void {
  TRANSFORMER_REGISTRY[name] = transformer;
}

/**
 * Registra um validador cross-field customizado em runtime
 * @param name - Nome do validador
 * @param validator - Função validadora
 */
export function registerCrossFieldValidator(name: string, validator: CrossFieldValidatorFunction): void {
  CROSS_FIELD_VALIDATOR_REGISTRY[name] = validator;
}