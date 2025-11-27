// Tipos para a Dashboard Sandbox
import { LucideIcon } from 'lucide-react';

// ============================================================================
// Tipos Base
// ============================================================================

export type WidgetSize = '1x1' | '1x2' | '2x1' | '2x2';
export type UserRole = 'user' | 'superadmin';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: Record<string, unknown>;
}

export type WidgetType =
  // Widgets de Usuário
  | 'processos-resumo'
  | 'audiencias-proximas'
  | 'pendentes-urgentes'
  | 'tarefas'
  | 'notas'
  | 'links'
  | 'produtividade'
  // Widgets de Superadmin
  | 'carga-usuarios'
  | 'metricas-escritorio'
  | 'status-capturas'
  | 'performance-advogados';

// ============================================================================
// Tipos para Métricas
// ============================================================================

export interface StatCardData {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  href?: string;
  description?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// ============================================================================
// Tipos para Processos
// ============================================================================

export interface ProcessoResumo {
  total: number;
  ativos: number;
  arquivados: number;
  porTRT: { trt: number; count: number }[];
  porGrau: { grau: string; count: number }[];
  porStatus: { status: string; count: number }[];
}

export interface ProcessoMock {
  id: number;
  numero_processo: string;
  trt: number;
  grau: 'primeiro_grau' | 'segundo_grau';
  polo_ativo: string;
  polo_passivo: string;
  status: 'ativo' | 'arquivado' | 'suspenso';
  responsavel_id: number | null;
  classe_judicial: string;
  created_at: string;
}

// ============================================================================
// Tipos para Audiências
// ============================================================================

export interface AudienciaMock {
  id: number;
  processo_id: number;
  numero_processo: string;
  trt: number;
  data_audiencia: string;
  hora_audiencia: string;
  tipo_audiencia: 'UNA' | 'INICIAL' | 'INSTRUÇÃO' | 'JULGAMENTO';
  modalidade: 'PRESENCIAL' | 'VIDEOCONFERENCIA' | 'HIBRIDA' | 'TELEPRESENCIAL';
  sala: string;
  url_virtual?: string;
  responsavel_id: number | null;
  polo_ativo: string;
  polo_passivo: string;
}

export interface AudienciasResumo {
  total: number;
  proximos7dias: number;
  proximos30dias: number;
  hoje: number;
  porModalidade: { modalidade: string; count: number }[];
  porTipo: { tipo: string; count: number }[];
}

// ============================================================================
// Tipos para Pendentes
// ============================================================================

export interface PendenteMock {
  id: number;
  processo_id: number;
  numero_processo: string;
  trt: number;
  tipo_expediente: string;
  data_prazo_legal: string;
  prazo_vencido: boolean;
  dias_restantes: number;
  responsavel_id: number | null;
  polo_ativo: string;
  polo_passivo: string;
}

export interface PendentesResumo {
  total: number;
  vencidos: number;
  venceHoje: number;
  venceAmanha: number;
  venceSemana: number;
  porUrgencia: { urgencia: string; count: number; color: string }[];
}

// ============================================================================
// Tipos para Tarefas (reutilizando estrutura existente)
// ============================================================================

export interface TarefaMock {
  id: number;
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  prioridade: number;
  data_vencimento?: string;
  created_at: string;
}

// ============================================================================
// Tipos para Notas (reutilizando estrutura existente)
// ============================================================================

export interface NotaMock {
  id: number;
  titulo?: string;
  conteudo: string;
  cor: string;
  fixada: boolean;
  created_at: string;
}

// ============================================================================
// Tipos para Links (reutilizando estrutura existente)
// ============================================================================

export interface LinkMock {
  id: number;
  titulo: string;
  url: string;
  icone?: string;
  ordem: number;
}

// ============================================================================
// Tipos para Produtividade
// ============================================================================

export interface ProdutividadeData {
  periodo: string;
  processosAtribuidos: number;
  audienciasRealizadas: number;
  pendentesResolvidos: number;
  tarefasConcluidas: number;
}

export interface ProdutividadeResumo {
  ultimoMes: ProdutividadeData[];
  totalProcessos: number;
  totalAudiencias: number;
  totalPendentes: number;
  mediaProcessosDia: number;
}

// ============================================================================
// Tipos para Superadmin
// ============================================================================

export interface UsuarioMock {
  id: number;
  nome_completo: string;
  nome_exibicao: string;
  email_corporativo: string;
  cargo?: string;
  is_super_admin: boolean;
  ativo: boolean;
  avatar_url?: string;
}

export interface CargaUsuario {
  usuario: UsuarioMock;
  processos: number;
  audiencias: number;
  pendentes: number;
  expedientes: number;
  total: number;
}

export interface MetricasEscritorio {
  totalProcessos: number;
  totalAudiencias: number;
  totalPendentes: number;
  totalUsuarios: number;
  processosAtivos: number;
  processosArquivados: number;
  valorAcordos: number;
  valorCondenacoes: number;
  comparativoMesAnterior: {
    processos: number;
    audiencias: number;
    pendentes: number;
  };
  tendencia: ChartDataPoint[];
}

export interface CapturaMock {
  id: number;
  tipo: 'acervo_geral' | 'arquivados' | 'audiencias' | 'pendentes' | 'timeline';
  status: 'sucesso' | 'erro' | 'em_andamento' | 'cancelado';
  advogado: string;
  trt: number;
  grau: string;
  inicio: string;
  fim?: string;
  processosCapturados?: number;
  erro?: string;
}

export interface StatusCapturas {
  ultimasCapturas: CapturaMock[];
  porStatus: { status: string; count: number; color: string }[];
  porTipo: { tipo: string; count: number }[];
  taxaSucesso: number;
}

export interface PerformanceAdvogado {
  usuario: UsuarioMock;
  processosAtivos: number;
  audienciasRealizadas: number;
  pendentesResolvidos: number;
  tempoMedioResolucao: number; // em dias
  score: number;
}

// ============================================================================
// Tipos para Configuração de Widget
// ============================================================================

export interface WidgetConfig {
  type: WidgetType;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultSize: WidgetSize;
  roles: UserRole[];
  category: 'metricas' | 'pessoal' | 'admin';
}
