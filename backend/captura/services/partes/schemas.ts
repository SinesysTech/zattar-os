import { z } from 'zod';

// Schema para representante PJE
// NOTA: Não validamos formato de email porque a API do PJE aceita emails mal formatados
// Muitos advogados cadastram emails inválidos (sem @, domínio incompleto, etc.)
export const RepresentantePJESchema = z.object({
  idPessoa: z.number().positive('ID pessoa deve ser positivo'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipoDocumento: z.enum(['CPF', 'CNPJ', 'OUTRO']),
  numeroDocumento: z.string().nullable(),
  numeroOAB: z.string().nullable(),
  ufOAB: z.string().length(2).nullable(),
  situacaoOAB: z.string().nullable(),
  tipo: z.string().nullable(),
  email: z.string().nullable(), // Aceita qualquer string - PJE não valida emails
  telefones: z.array(z.object({
    ddd: z.string().optional(),
    numero: z.string().optional(),
  })).optional(),
  dadosCompletos: z.record(z.unknown()).optional(),
});

// Schema para parte PJE
// NOTA: Não validamos formato de emails porque a API do PJE aceita emails mal formatados
export const PartePJESchema = z.object({
  idParte: z.number().positive('ID parte deve ser positivo'),
  idPessoa: z.number().positive('ID pessoa deve ser positivo'),
  nome: z.string().min(1, 'Nome da parte é obrigatório'),
  tipoParte: z.string().min(1, 'Tipo de parte é obrigatório'),
  polo: z.enum(['ATIVO', 'PASSIVO', 'OUTROS'], {
    errorMap: () => ({ message: 'Polo deve ser ATIVO, PASSIVO ou OUTROS' }),
  }),
  numeroDocumento: z.string().min(1, 'Número do documento é obrigatório'),
  tipoDocumento: z.enum(['CPF', 'CNPJ', 'OUTRO']),
  emails: z.array(z.string()).default([]), // Aceita qualquer string - PJE não valida emails
  telefones: z.array(z.object({
    ddd: z.string().optional(),
    numero: z.string().optional(),
  })).default([]),
  principal: z.boolean().default(false),
  representantes: z.array(RepresentantePJESchema).default([]),
  dadosCompletos: z.record(z.unknown()).optional(),
});

// Schema para resposta completa da API PJE
export const RespostaPJEPartesSchema = z.object({
  partes: z.array(PartePJESchema),
  // Adicionar outros campos da resposta PJE conforme necessário
});

// Função helper para validar com mensagens de erro amigáveis
export function validarPartePJE(parte: unknown): z.infer<typeof PartePJESchema> {
  try {
    return PartePJESchema.parse(parte);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const erros = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new Error(`Validação de parte PJE falhou: ${erros}`);
    }
    throw error;
  }
}

export function validarPartesArray(partes: unknown[]): z.infer<typeof PartePJESchema>[] {
  return partes.map((parte, index) => {
    try {
      return validarPartePJE(parte);
    } catch (error) {
      throw new Error(`Erro ao validar parte no índice ${index}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}