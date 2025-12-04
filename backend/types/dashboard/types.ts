/**
 * Tipos para Dashboard Personalizada
 *
 * Define interfaces para dados agregados exibidos na dashboard,
 * diferenciando visualizações de usuário comum e superadmin.
 */

// ============================================================================
// Tipos Compartilhados
// ============================================================================

export interface ProcessoResumo {
  total: number;
  ativos: number;
  arquivados: number;
  porGrau: {
    grau: string;
    count: number;
  }[];
  porTRT: {
    trt: string;
    count: number;
  }[];
}

export interface AudienciasResumo {
  total: number;
  hoje: number;
  amanha: number;
  proximos7dias: number;
  proximos30dias: number;
}

export interface ExpedientesResumo {
  total: number;
  vencidos: number;
  venceHoje: number;
  venceAmanha: number;
  proximos7dias: number;
  porTipo: {
    tipo: string;
    count: number;
  }[];
}

export interface ProdutividadeResumo {
  baixasHoje: number;
  baixasSemana: number;
  baixasMes: number;
  mediaDiaria: number;
  comparativoSemanaAnterior: number; // percentual
  porDia: {
    data: string; // YYYY-MM-DD
    baixas: number;
  }[];
}

// ============================================================================
// Tipos de Audiência para Lista
// ============================================================================

export interface AudienciaProxima {
  id: number;
  processo_id: number;
  numero_processo: string;
  data_audiencia: string;
  hora_audiencia: string | null;
  tipo_audiencia: string | null;
  local: string | null;
  sala: string | null;
  url_audiencia_virtual: string | null;
  responsavel_id: number | null;
  responsavel_nome: string | null;
  polo_ativo_nome: string | null;
  polo_passivo_nome: string | null;
}

// ============================================================================
// Tipos de Expediente para Lista
// ============================================================================

export interface ExpedienteUrgente {
  id: number;
  processo_id: number;
  numero_processo: string;
  tipo_expediente: string;
  prazo_fatal: string;
  status: string; // 'pendente' | 'em_andamento' | 'concluido' | 'vencido'
  dias_restantes: number; // negativo se vencido
  responsavel_id: number | null;
  responsavel_nome: string | null;
  origem: 'expedientes' | 'expedientes_manuais';
}

// ============================================================================
// Tipos para Dashboard de Usuário
// ============================================================================

export interface DashboardUsuarioData {
  role: 'user';
  usuario: {
    id: number;
    nome: string;
  };
  processos: ProcessoResumo;
  audiencias: AudienciasResumo;
  expedientes: ExpedientesResumo;
  produtividade: ProdutividadeResumo;
  proximasAudiencias: AudienciaProxima[];
  expedientesUrgentes: ExpedienteUrgente[];
  ultimaAtualizacao: string;
}

// ============================================================================
// Tipos para Dashboard de Admin
// ============================================================================

export interface MetricasEscritorio {
  totalProcessos: number;
  processosAtivos: number;
  processosAtivosUnicos: number; // Contagem por número de processo único
  totalAudiencias: number;
  audienciasMes: number;
  totalExpedientes: number;
  expedientesPendentes: number;
  expedientesVencidos: number;
  totalUsuarios: number;
  taxaResolucao: number; // percentual de expedientes resolvidos no prazo
  comparativoMesAnterior: {
    processos: number;
    audiencias: number;
    expedientes: number;
  };
  evolucaoMensal: {
    mes: string; // YYYY-MM
    processos: number;
    audiencias: number;
    expedientes: number;
  }[];
}

export interface CargaUsuario {
  usuario_id: number;
  usuario_nome: string;
  processosAtivos: number;
  expedientesPendentes: number;
  audienciasProximas: number;
  cargaTotal: number; // soma ponderada
}

export interface StatusCaptura {
  trt: string;
  grau: string;
  ultimaExecucao: string | null;
  status: 'sucesso' | 'erro' | 'pendente' | 'executando';
  mensagemErro: string | null;
  processosCapturados: number;
  audienciasCapturadas: number;
  expedientesCapturados: number;
}

export interface PerformanceAdvogado {
  usuario_id: number;
  usuario_nome: string;
  baixasSemana: number;
  baixasMes: number;
  taxaCumprimentoPrazo: number; // percentual
  expedientesVencidos: number;
}

export interface DashboardAdminData {
  role: 'admin';
  metricas: MetricasEscritorio;
  cargaUsuarios: CargaUsuario[];
  statusCapturas: StatusCaptura[];
  performanceAdvogados: PerformanceAdvogado[];
  proximasAudiencias: AudienciaProxima[];
  expedientesUrgentes: ExpedienteUrgente[];
  ultimaAtualizacao: string;
}

// ============================================================================
// Tipo União para Response da API
// ============================================================================

export type DashboardData = DashboardUsuarioData | DashboardAdminData;

// ============================================================================
// Parâmetros de Consulta
// ============================================================================

export interface DashboardQueryParams {
  usuarioId?: number;
  periodo?: '7dias' | '30dias' | '90dias';
  trt?: string;
}

// ============================================================================
// Cache Keys
// ============================================================================

export const DASHBOARD_CACHE_KEYS = {
  usuario: (userId: number) => `dashboard:user:${userId}`,
  admin: () => 'dashboard:admin',
  metricas: () => 'dashboard:metricas',
  capturas: () => 'dashboard:capturas',
} as const;

export const DASHBOARD_CACHE_TTL = {
  usuario: 300, // 5 minutos
  admin: 600, // 10 minutos
  metricas: 600, // 10 minutos
  capturas: 120, // 2 minutos (mais volátil)
} as const;
