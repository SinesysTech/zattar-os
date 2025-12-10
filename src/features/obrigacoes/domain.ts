
import { z } from 'zod';

// Constantes
export const TIPO_LABELS = {
  acordo: 'Acordo',
  condenacao: 'Condenação',
  custas_processuais: 'Custas Processuais',
} as const;

export const DIRECAO_LABELS = {
  recebimento: 'Recebimento',
  pagamento: 'Pagamento',
} as const;

export const STATUS_LABELS = {
  pendente: 'Pendente',
  pago_parcial: 'Pago Parcial',
  pago_total: 'Pago Total',
  atrasado: 'Atrasado',
} as const;

export const FORMA_PAGAMENTO_LABELS = {
  transferencia_direta: 'Transferência Direta',
  deposito_judicial: 'Depósito Judicial',
  deposito_recursal: 'Depósito Recursal',
} as const;

export const PERCENTUAL_ESCRITORIO_PADRAO = 30;
export const INTERVALO_PARCELAS_PADRAO = 30;

// Schemas Zod

export const acordoCondenacaoSchema = z.object({
  id: z.number(),
  processoId: z.number(),
  tipo: z.enum(['acordo', 'condenacao', 'custas_processuais']),
  direcao: z.enum(['recebimento', 'pagamento']),
  valorTotal: z.number().positive(),
  dataVencimentoPrimeiraParcela: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  status: z.enum(['pendente', 'pago_parcial', 'pago_total', 'atrasado']),
  numeroParcelas: z.number().int().positive(),
  formaDistribuicao: z.enum(['integral', 'dividido']).nullable(),
  percentualEscritorio: z.number().min(0).max(100),
  percentualCliente: z.number().min(0).max(100),
  honorariosSucumbenciaisTotal: z.number().min(0),
});

export const parcelaSchema = z.object({
  id: z.number(),
  acordoCondenacaoId: z.number(),
  numeroParcela: z.number(),
  valorBrutoCreditoPrincipal: z.number(),
  honorariosContratuais: z.number(),
  honorariosSucumbenciais: z.number(),
  valorRepasseCliente: z.number().nullable(),
  dataVencimento: z.string(),
  status: z.enum(['pendente', 'recebida', 'paga', 'atrasada', 'cancelada']),
  formaPagamento: z.enum(['transferencia_direta', 'deposito_judicial', 'deposito_recursal']).nullable(),
  statusRepasse: z.enum(['nao_aplicavel', 'pendente_declaracao', 'pendente_transferencia', 'repassado']),
});

export const criarAcordoComParcelasSchema = z.object({
  processoId: z.number({ required_error: 'Processo é obrigatório' }),
  tipo: z.enum(['acordo', 'condenacao', 'custas_processuais']),
  direcao: z.enum(['recebimento', 'pagamento']),
  valorTotal: z.number().positive('Valor deve ser positivo'),
  dataVencimentoPrimeiraParcela: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  numeroParcelas: z.number().int().positive('Número de parcelas deve ser positivo'),
  formaDistribuicao: z.enum(['integral', 'dividido']).nullable().optional(),
  percentualEscritorio: z.number().min(0).max(100).optional(),
  honorariosSucumbenciaisTotal: z.number().min(0).optional(),
  formaPagamentoPadrao: z.enum(['transferencia_direta', 'deposito_judicial', 'deposito_recursal']),
  intervaloEntreParcelas: z.number().int().positive().optional().default(30),
}).refine((data) => {
  // Validação condicional de formaDistribuicao
  if (data.direcao === 'recebimento' && data.tipo !== 'custas_processuais') {
    return !!data.formaDistribuicao;
  }
  return true;
}, {
  message: 'Forma de distribuição é obrigatória para recebimentos',
  path: ['formaDistribuicao'],
}).refine((data) => {
  // Custas processuais
  if (data.tipo === 'custas_processuais') {
    return data.direcao === 'pagamento' && data.numeroParcelas === 1;
  }
  return true;
}, {
  message: 'Custas processuais devem ser pagamento e parcela única',
  path: ['tipo'],
});

export const atualizarAcordoSchema = z.object({
  valorTotal: z.number().positive().optional(),
  dataVencimentoPrimeiraParcela: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  percentualEscritorio: z.number().min(0).max(100).optional(),
  honorariosSucumbenciaisTotal: z.number().min(0).optional(),
  formaDistribuicao: z.enum(['integral', 'dividido']).nullable().optional(),
  status: z.enum(['pendente', 'pago_parcial', 'pago_total', 'atrasado']).optional(),
});

export const marcarParcelaRecebidaSchema = z.object({
  dataRecebimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valorRecebido: z.number().positive().optional(),
});
