/**
 * Schemas Zod para validação de dados do Dashboard
 */

import { z } from 'zod';

// ============================================================================
// Schemas de Query Params
// ============================================================================

export const dashboardQuerySchema = z.object({
  usuarioId: z.number().optional(),
  periodo: z.enum(['7dias', '30dias', '90dias']).optional(),
  trt: z.string().optional(),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;

// ============================================================================
// Schemas de Validação de Resposta
// ============================================================================

export const processoResumoSchema = z.object({
  total: z.number(),
  ativos: z.number(),
  arquivados: z.number(),
  porGrau: z.array(z.object({
    grau: z.string(),
    count: z.number(),
  })),
  porTRT: z.array(z.object({
    trt: z.string(),
    count: z.number(),
  })),
});

export const audienciasResumoSchema = z.object({
  total: z.number(),
  hoje: z.number(),
  amanha: z.number(),
  proximos7dias: z.number(),
  proximos30dias: z.number(),
});

export const expedientesResumoSchema = z.object({
  total: z.number(),
  vencidos: z.number(),
  venceHoje: z.number(),
  venceAmanha: z.number(),
  proximos7dias: z.number(),
  porTipo: z.array(z.object({
    tipo: z.string(),
    count: z.number(),
  })),
});

export const produtividadeResumoSchema = z.object({
  baixasHoje: z.number(),
  baixasSemana: z.number(),
  baixasMes: z.number(),
  mediaDiaria: z.number(),
  comparativoSemanaAnterior: z.number(),
  porDia: z.array(z.object({
    data: z.string(),
    baixas: z.number(),
  })),
});

export const audienciaProximaSchema = z.object({
  id: z.number(),
  processo_id: z.number(),
  numero_processo: z.string(),
  data_audiencia: z.string(),
  hora_audiencia: z.string().nullable(),
  tipo_audiencia: z.string().nullable(),
  local: z.string().nullable(),
  sala: z.string().nullable(),
  url_audiencia_virtual: z.string().nullable(),
  responsavel_id: z.number().nullable(),
  responsavel_nome: z.string().nullable(),
  polo_ativo_nome: z.string().nullable(),
  polo_passivo_nome: z.string().nullable(),
});

export const expedienteUrgenteSchema = z.object({
  id: z.number(),
  processo_id: z.number(),
  numero_processo: z.string(),
  tipo_expediente: z.string(),
  prazo_fatal: z.string(),
  status: z.string(),
  dias_restantes: z.number(),
  responsavel_id: z.number().nullable(),
  responsavel_nome: z.string().nullable(),
  origem: z.enum(['expedientes', 'expedientes_manuais']),
});

export const dashboardUsuarioDataSchema = z.object({
  role: z.literal('user'),
  usuario: z.object({
    id: z.number(),
    nome: z.string(),
  }),
  processos: processoResumoSchema,
  audiencias: audienciasResumoSchema,
  expedientes: expedientesResumoSchema,
  produtividade: produtividadeResumoSchema,
  proximasAudiencias: z.array(audienciaProximaSchema),
  expedientesUrgentes: z.array(expedienteUrgenteSchema),
  ultimaAtualizacao: z.string(),
});

export const metricasEscritorioSchema = z.object({
  totalProcessos: z.number(),
  processosAtivos: z.number(),
  processosAtivosUnicos: z.number(),
  totalAudiencias: z.number(),
  audienciasMes: z.number(),
  totalExpedientes: z.number(),
  expedientesPendentes: z.number(),
  expedientesVencidos: z.number(),
  totalUsuarios: z.number(),
  taxaResolucao: z.number(),
  comparativoMesAnterior: z.object({
    processos: z.number(),
    audiencias: z.number(),
    expedientes: z.number(),
  }),
  evolucaoMensal: z.array(z.object({
    mes: z.string(),
    processos: z.number(),
    audiencias: z.number(),
    expedientes: z.number(),
  })),
});

export const cargaUsuarioSchema = z.object({
  usuario_id: z.number(),
  usuario_nome: z.string(),
  processosAtivos: z.number(),
  expedientesPendentes: z.number(),
  audienciasProximas: z.number(),
  cargaTotal: z.number(),
});

export const statusCapturaSchema = z.object({
  trt: z.string(),
  grau: z.string(),
  ultimaExecucao: z.string().nullable(),
  status: z.enum(['sucesso', 'erro', 'pendente', 'executando']),
  mensagemErro: z.string().nullable(),
  processosCapturados: z.number(),
  audienciasCapturadas: z.number(),
  expedientesCapturados: z.number(),
});

export const performanceAdvogadoSchema = z.object({
  usuario_id: z.number(),
  usuario_nome: z.string(),
  baixasSemana: z.number(),
  baixasMes: z.number(),
  taxaCumprimentoPrazo: z.number(),
  expedientesVencidos: z.number(),
});

export const dashboardAdminDataSchema = z.object({
  role: z.literal('admin'),
  metricas: metricasEscritorioSchema,
  cargaUsuarios: z.array(cargaUsuarioSchema),
  statusCapturas: z.array(statusCapturaSchema),
  performanceAdvogados: z.array(performanceAdvogadoSchema),
  proximasAudiencias: z.array(audienciaProximaSchema),
  expedientesUrgentes: z.array(expedienteUrgenteSchema),
  ultimaAtualizacao: z.string(),
});

export const dashboardDataSchema = z.discriminatedUnion('role', [
  dashboardUsuarioDataSchema,
  dashboardAdminDataSchema,
]);
