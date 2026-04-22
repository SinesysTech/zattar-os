import { z } from 'zod';

export const dadosBancariosSchema = z
  .object({
    bancoCodigo: z.string().min(1).max(10),
    bancoNome: z.string().min(1).max(100),
    agencia: z.string().min(1).max(10),
    agenciaDigito: z.string().max(2).optional().nullable(),
    conta: z.string().min(1).max(20),
    contaDigito: z.string().max(2).optional().nullable(),
    tipoConta: z.enum(['corrente', 'poupanca', 'pagamento']),
    chavePix: z.string().max(100).optional().nullable(),
    tipoChavePix: z
      .enum(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'])
      .optional()
      .nullable(),
    titularCpf: z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos'),
    titularNome: z.string().min(3).max(200),
  })
  .refine((d) => (d.chavePix ? !!d.tipoChavePix : true), {
    message: 'Tipo da chave PIX é obrigatório quando a chave é informada',
    path: ['tipoChavePix'],
  });

export const criarLinkPrestacaoContasSchema = z.object({
  parcelaId: z.number().int().positive(),
});

export const confirmarCpfSchema = z.object({
  token: z.string().uuid(),
  cpf: z.string().regex(/^\d{11}$/),
});

export const finalizarPrestacaoContasSchema = z.object({
  token: z.string().uuid(),
  cpfConfirmado: z.string().regex(/^\d{11}$/),
  dadosBancarios: dadosBancariosSchema,
  assinaturaBase64: z.string().min(1),
  termosAceiteVersao: z.string().default('v1.0-MP2200-2'),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  geolocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
    })
    .optional()
    .nullable(),
  dispositivoFingerprint: z.record(z.unknown()).optional().nullable(),
});

export type CriarLinkPrestacaoContasInput = z.infer<typeof criarLinkPrestacaoContasSchema>;
export type ConfirmarCpfInput = z.infer<typeof confirmarCpfSchema>;
export type FinalizarPrestacaoContasInput = z.infer<typeof finalizarPrestacaoContasSchema>;
export type DadosBancariosFormData = z.infer<typeof dadosBancariosSchema>;
