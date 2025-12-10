/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';

import { validateCPF } from '@/core/app/_lib/assinatura-digital/validators/cpf.validator';
import { validateCNPJ } from '@/core/app/_lib/assinatura-digital/validators/cnpj.validator';
import { validateTelefone } from '@/core/app/_lib/assinatura-digital/validators/telefone.validator';

export interface AssinaturaMetrics {
  pontos: number;
  largura: number;
  altura: number;
  tempoDesenho: number;
  tracos: number;
}

export interface DateValidationContext {
  dataInicio?: string;
  dataBloqueio?: string;
  dataRescisao?: string;
  situacao?: 'V' | 'F';
  tipoValidacao: 'apps' | 'trabalhista';
}

export interface ConsistencyValidationData {
  cpf: string;
  email: string;
  telefone: string;
  nomeCompleto: string;
}

interface SimpleValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Valida qualidade básica da assinatura (apenas formato e presença).
 *
 * IMPORTANTE: Esta função NÃO valida complexidade da assinatura.
 * Restrições de pontos, dimensões, tempo e traços foram removidas
 * para melhorar a experiência do usuário.
 *
 * Validações mantidas:
 * - Assinatura não vazia
 * - Formato base64 válido (data:image/*)
 *
 * @param base64Data - String base64 da assinatura
 * @param metrics - (Ignorado) Métricas da assinatura mantidas para compatibilidade
 * @returns Objeto com flag valid e array de issues
 */
export function validateSignatureQuality(
  base64Data: string,
  metrics?: AssinaturaMetrics,
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Validação 1: Assinatura obrigatória
  if (!base64Data) {
    issues.push('Assinatura obrigatoria');
    return { valid: false, issues };
  }

  // Validação 2: Formato base64 válido
  if (!base64Data.startsWith('data:image/')) {
    issues.push('Formato de assinatura invalido');
    return { valid: false, issues };
  }

  // Métricas são ignoradas (mantidas apenas para compatibilidade de API)
  // Não validamos mais: pontos, largura, altura, tempo, traços

  return { valid: issues.length === 0, issues };
}

/**
 * Valida qualidade de foto capturada durante a assinatura.
 *
 * @param base64Data - String base64 da foto (ou null/undefined se não fornecida)
 * @param required - Se true, foto ausente é erro; se false, foto ausente é válido
 * @returns Objeto com flag valid e array de issues
 *
 * Quando required=false (foto opcional):
 * - Foto ausente: válido (retorna { valid: true, issues: [] })
 * - Foto presente: valida formato, tamanho, etc.
 *
 * Quando required=true (foto obrigatória):
 * - Foto ausente: inválido (retorna erro 'Foto obrigatoria')
 * - Foto presente: valida formato, tamanho, etc.
 */
export function validatePhotoQuality(
  base64Data: string | undefined | null,
  required: boolean = true
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Se foto não é obrigatória e não foi fornecida, é válido
  if (!required && (!base64Data || base64Data.trim() === '')) {
    return { valid: true, issues: [] };
  }

  // Se foto é obrigatória ou foi fornecida, validar
  if (!base64Data || base64Data.trim() === '') {
    if (required) {
      issues.push('Foto obrigatoria');
      return { valid: false, issues };
    }
  }

  // Se chegou aqui, foto foi fornecida - validar qualidade
  if (base64Data) {
    if (!base64Data.startsWith('data:image/')) {
      issues.push('Formato de foto invalido');
      return { valid: false, issues };
    }

    const base64Content = base64Data.split(',')[1];
    if (!base64Content || base64Content.length < 1000) {
      issues.push('Foto com baixa qualidade ou muito pequena');
    }

    // Calculate actual size in MB (matching backend logic)
    // Base64 is ~33% larger than binary, so: sizeInBytes = (base64.length * 3) / 4
    const sizeInBytes = (base64Content.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    if (sizeInMB > 2) {
      issues.push('Foto muito grande, reduza a resolucao');
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Valida dados de geolocalização capturados durante a assinatura.
 *
 * Regras de validação:
 * - Se latitude e longitude forem null/undefined, considera válido (geolocalização opcional não fornecida)
 * - Se apenas um dos campos estiver presente, retorna erro (devem estar sempre juntos)
 * - Latitude deve estar entre -90 e 90 graus
 * - Longitude deve estar entre -180 e 180 graus
 * - Accuracy (se presente) deve ser número positivo
 * - Timestamp (se presente) deve estar em formato ISO 8601 válido
 * - Warnings adicionais: accuracy > 10km, timestamp futuro
 *
 * @param latitude - Coordenada de latitude GPS (-90 a 90)
 * @param longitude - Coordenada de longitude GPS (-180 a 180)
 * @param accuracy - Precisão da geolocalização em metros (opcional)
 * @param timestamp - Timestamp ISO 8601 da captura (opcional)
 * @returns Objeto com flag valid e array de issues
 */
export function validateGeolocation(
  latitude?: number | null,
  longitude?: number | null,
  accuracy?: number | null,
  timestamp?: string | null
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Se ambos forem null/undefined, geolocalização não foi fornecida (válido)
  if ((latitude === null || latitude === undefined) && (longitude === null || longitude === undefined)) {
    return { valid: true, issues: [] };
  }

  // Se apenas um dos dois estiver presente, erro
  if ((latitude === null || latitude === undefined) && longitude !== null && longitude !== undefined) {
    issues.push('Latitude e longitude devem ser fornecidas juntas');
    return { valid: false, issues };
  }

  if ((longitude === null || longitude === undefined) && latitude !== null && latitude !== undefined) {
    issues.push('Latitude e longitude devem ser fornecidas juntas');
    return { valid: false, issues };
  }

  // Validar latitude (-90 a 90)
  if (latitude !== null && latitude !== undefined) {
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      issues.push('Latitude deve estar entre -90 e 90 graus');
    }
  }

  // Validar longitude (-180 a 180)
  if (longitude !== null && longitude !== undefined) {
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      issues.push('Longitude deve estar entre -180 e 180 graus');
    }
  }

  // Validar accuracy (se presente)
  if (accuracy !== null && accuracy !== undefined) {
    if (typeof accuracy !== 'number' || accuracy <= 0) {
      issues.push('Precisao da geolocalizacao deve ser um numero positivo');
    }
    // Nota: Accuracy > 10km é um warning, mas não invalida a geolocalização.
    // O frontend pode exibir alerta visual sem bloquear o avanço.
  }

  // Validar timestamp (se presente)
  if (timestamp) {
    // Regex para ISO 8601 com timezone: YYYY-MM-DDTHH:mm:ss.sssZ ou com offset (+/-HH:mm)
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(Z|[+\-]\d{2}:?\d{2})$/;
    if (!isoRegex.test(timestamp)) {
      issues.push('Timestamp da geolocalizacao em formato invalido');
    } else {
      // Validar se não é futuro
      const timestampDate = new Date(timestamp);
      const now = new Date();
      if (timestampDate > now) {
        issues.push('Timestamp da geolocalizacao nao pode ser futuro');
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

export function validateBusinessDates(context: DateValidationContext): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!context.dataInicio) {
    issues.push('Data de inicio obrigatoria');
    return { valid: false, issues };
  }

  const dataInicio = parseBusinessDate(context.dataInicio);
  if (!dataInicio) {
    issues.push('Data de inicio invalida');
    return { valid: false, issues };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (dataInicio > hoje) {
    issues.push('Data de inicio nao pode ser futura');
  }

  if (context.tipoValidacao === 'apps' && context.situacao === 'F') {
    if (!context.dataBloqueio) {
      issues.push('Data de bloqueio obrigatoria quando situacao for Bloqueado');
    } else {
      const dataBloqueio = parseBusinessDate(context.dataBloqueio);
      if (!dataBloqueio) {
        issues.push('Data de bloqueio invalida');
      } else if (dataBloqueio < dataInicio) {
        issues.push('Data de bloqueio deve ser igual ou posterior a data de inicio');
      }
    }
  }

  if (context.tipoValidacao === 'trabalhista' && context.dataRescisao) {
    const dataRescisao = parseBusinessDate(context.dataRescisao);
    if (!dataRescisao) {
      issues.push('Data de rescisao invalida');
    } else if (dataRescisao < dataInicio) {
      issues.push('Data de rescisao deve ser igual ou posterior a data de inicio');
    }
  }

  const dataMinima = new Date();
  dataMinima.setFullYear(dataMinima.getFullYear() - 10);
  dataMinima.setHours(0, 0, 0, 0);

  if (dataInicio < dataMinima) {
    issues.push('Data de inicio muito antiga, confirme o valor informado');
  }

  return { valid: issues.length === 0, issues };
}

export function getFieldSpecificDateError(issues: string[], fieldName: 'inicio' | 'bloqueio' | 'rescisao'): string | null {
  // Mapeamento de campos para palavras-chave nas mensagens de erro
  const fieldKeywords = {
    inicio: ['inicio'],
    bloqueio: ['bloqueio'],
    rescisao: ['rescis']
  };

  // Para campo início, retorna qualquer erro que mencione 'início', exceto erros específicos de bloqueio/rescisão
  if (fieldName === 'inicio') {
    const inicioErrors = issues.filter(issue =>
      fieldKeywords.inicio.some(keyword => issue.toLowerCase().includes(keyword.toLowerCase())) &&
      !fieldKeywords.bloqueio.some(keyword => issue.toLowerCase().includes(keyword.toLowerCase())) &&
      !fieldKeywords.rescisao.some(keyword => issue.toLowerCase().includes(keyword.toLowerCase()))
    );
    return inicioErrors.length > 0 ? inicioErrors[0] : null;
  }

  // Para campos bloqueio e rescisão, retorna apenas erros específicos desses campos
  const fieldErrors = issues.filter(issue =>
    fieldKeywords[fieldName].some(keyword => issue.toLowerCase().includes(keyword.toLowerCase()))
  );
  return fieldErrors.length > 0 ? fieldErrors[0] : null;
}

function parseBusinessDate(dateStr: string): Date | null {
  if (!dateStr) {
    return null;
  }

  let date: Date;

  // Formato dd/mm/aaaa
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/').map(Number);
    date = new Date(year, month - 1, day);
    
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
  }
  // Formato ISO YYYY-MM-DD
  else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    date = new Date(year, month - 1, day);
    
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
  }
  // Formato inválido
  else {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

export const TEXT_LIMITS = {
  acidenteDescricao: 1000,
  adoecimentoDescricao: 1000,
  observacoes: 500,
  nomeEmpresa: 200,
  logradouro: 100,
  complemento: 50,
  bairro: 50,
  cidade: 50,
} as const;

export function validateTextLength(text: string, field: keyof typeof TEXT_LIMITS): SimpleValidationResult {
  const limit = TEXT_LIMITS[field];
  const length = text?.length ?? 0;

  if (length > limit) {
    return {
      valid: false,
      message: `Maximo ${limit} caracteres (atual: ${length})`,
    };
  }

  return { valid: true };
}

export function validateCPFDigits(cpf: string): SimpleValidationResult {
  const cleaned = cpf?.replace(/\D/g, '') ?? '';

  if (!cleaned) {
    return { valid: false, message: 'CPF obrigatorio' };
  }

  if (cleaned.length !== 11) {
    return { valid: false, message: 'CPF deve conter 11 digitos' };
  }

  if (!validateCPF(cleaned)) {
    return { valid: false, message: 'CPF invalido' };
  }

  return { valid: true };
}

export function validateCNPJDigits(cnpj: string): SimpleValidationResult {
  const cleaned = cnpj?.replace(/\D/g, '') ?? '';

  if (!cleaned) {
    return { valid: false, message: 'CNPJ obrigatorio' };
  }

  if (cleaned.length !== 14) {
    return { valid: false, message: 'CNPJ deve conter 14 digitos' };
  }

  if (!validateCNPJ(cleaned)) {
    return { valid: false, message: 'CNPJ invalido' };
  }

  return { valid: true };
}

export function validateBrazilianPhone(telefone: string): SimpleValidationResult {
  if (!telefone) {
    return { valid: false, message: 'Telefone obrigatorio' };
  }

  if (!validateTelefone(telefone)) {
    return { valid: false, message: 'Telefone invalido' };
  }

  return { valid: true };
}

const EMAIL_REGEX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

export function validateEmail(email: string): SimpleValidationResult {
  const trimmed = email?.trim() ?? '';

  if (!trimmed) {
    return { valid: false, message: 'Email obrigatorio' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'Email invalido' };
  }

  return { valid: true };
}

export function validateCEP(cep: string): SimpleValidationResult {
  const cleaned = cep?.replace(/\D/g, '') ?? '';

  if (!cleaned) {
    return { valid: false, message: 'CEP obrigatorio' };
  }

  if (!/^\d{8}$/.test(cleaned)) {
    return { valid: false, message: 'CEP deve conter 8 digitos' };
  }

  return { valid: true };
}

export function validateBirthDate(value: string | Date): SimpleValidationResult {
  const date = typeof value === 'string' ? new Date(value) : value;

  if (!date || Number.isNaN(date.getTime())) {
    return { valid: false, message: 'Data de nascimento invalida' };
  }

  const today = new Date();
  const minAge = 16;
  const maxAge = 120;

  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  if (age < minAge) {
    return { valid: false, message: `Idade minima de ${minAge} anos` };
  }

  if (age > maxAge) {
    return { valid: false, message: `Idade maxima de ${maxAge} anos` };
  }

  return { valid: true };
}

/**
 * Valida consistência de dados pessoais básicos.
 *
 * NOTA: Na arquitetura agnóstica, não validamos segmentoId ou formularioId
 * pois são dinâmicos e validados pelas APIs. Esta função valida apenas
 * dados pessoais genéricos reutilizáveis em qualquer domínio.
 */
export function validateDataConsistency(data: ConsistencyValidationData): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  const cpfValidation = validateCPFDigits(data.cpf);
  if (!cpfValidation.valid) {
    issues.push(cpfValidation.message ?? 'CPF invalido');
  }

  if (!data.nomeCompleto || data.nomeCompleto.trim().length < 3) {
    issues.push('Nome completo obrigatorio');
  }

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    issues.push(emailValidation.message ?? 'Email invalido');
  }

  const telefoneValidation = validateBrazilianPhone(data.telefone);
  if (!telefoneValidation.valid) {
    issues.push(telefoneValidation.message ?? 'Telefone invalido');
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Schema Zod para validação de assinatura digital.
 *
 * NOTA: foto_base64 é opcional neste schema. A obrigatoriedade da foto
 * será validada pelo frontend baseado na configuração foto_necessaria do template.
 * Se presente, a qualidade será validada pelo refine.
 *
 * IMPORTANTE: Validação de assinatura foi simplificada - não valida mais
 * complexidade (pontos, dimensões, tempo, traços), apenas formato e presença.
 */
export const assinaturaValidationSchema = z.object({
  assinatura_base64: z
    .string()
    .min(1, 'Assinatura obrigatoria')
    .refine((value) => validateSignatureQuality(value).valid, 'Formato de assinatura invalido'),
  foto_base64: z
    .string()
    .optional()
    .refine(
      (value) => !value || validatePhotoQuality(value, false).valid,
      'Foto nao atende aos criterios minimos'
    ),
  termos_aceitos: z.boolean().refine((value) => value === true, 'Aceite dos termos obrigatorio'),
});

export type AssinaturaValidationSchema = z.infer<typeof assinaturaValidationSchema>;
