export interface Tarefa {
  id: number;
  usuario_id: number;
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  prioridade: number;
  data_prevista?: string;
  created_at: string;
  updated_at: string;
}

export interface Nota {
  id: number;
  usuario_id: number;
  titulo: string;
  conteudo?: string;
  etiquetas: string[];
  created_at: string;
  updated_at: string;
}

export interface LayoutPainel {
  id: number;
  usuario_id: number;
  configuracao_layout: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LinkPersonalizado {
  id: number;
  usuario_id: number;
  titulo: string;
  url: string;
  icone?: string;
  ordem: number;
  created_at: string;
}

export interface DashboardWidget {
  id: string;
  type: 'tarefas' | 'notas' | 'links' | 'custom';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: unknown;
}

export interface CreateTarefaData {
  titulo: string;
  descricao?: string;
  status?: 'pendente' | 'em_andamento' | 'concluida';
  prioridade?: number;
  data_prevista?: string;
}

export type UpdateTarefaData = Partial<CreateTarefaData>;

export interface CreateNotaData {
  titulo: string;
  conteudo?: string;
  etiquetas?: string[];
}

export type UpdateNotaData = Partial<CreateNotaData>;

export interface CreateLinkData {
  titulo: string;
  url: string;
  icone?: string;
  ordem?: number;
}

export type UpdateLinkData = Partial<CreateLinkData>;
