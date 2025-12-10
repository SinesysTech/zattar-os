import { create } from 'zustand';
import { 
  Tarefa, Nota, LayoutPainel, LinkPersonalizado, DashboardWidget,
  getTarefas, createTarefa, updateTarefa, deleteTarefa,
  getNotas, createNota, updateNota, deleteNota,
  getLayoutPainel, createLayoutPainel, updateLayoutPainel,
  getLinksPersonalizados, createLinkPersonalizado, updateLinkPersonalizado, deleteLinkPersonalizado
} from '../../api/dashboard-api';

interface DashboardState {
  tarefas: Tarefa[];
  notas: Nota[];
  layoutPainel: LayoutPainel | null;
  linksPersonalizados: LinkPersonalizado[];
  widgets: DashboardWidget[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadDashboardData: () => Promise<void>;
  createTarefa: (data: CreateTarefaData) => Promise<void>;
  updateTarefa: (id: number, data: UpdateTarefaData) => Promise<void>;
  deleteTarefa: (id: number) => Promise<void>;
  createNota: (data: CreateNotaData) => Promise<void>;
  updateNota: (id: number, data: UpdateNotaData) => Promise<void>;
  deleteNota: (id: number) => Promise<void>;
  createLink: (data: CreateLinkData) => Promise<void>;
  updateLink: (id: number, data: UpdateLinkData) => Promise<void>;
  deleteLink: (id: number) => Promise<void>;
  updateLayout: (config: Record<string, unknown>) => Promise<void>;
  updateWidgets: (widgets: DashboardWidget[]) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  tarefas: [],
  notas: [],
  layoutPainel: null,
  linksPersonalizados: [],
  widgets: [],
  isLoading: false,
  error: null,

  loadDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [tarefas, notas, layoutPainel, linksPersonalizados] = await Promise.all([
        getTarefas(),
        getNotas(),
        getLayoutPainel(),
        getLinksPersonalizados()
      ]);

      set({
        tarefas,
        notas,
        layoutPainel,
        linksPersonalizados,
        isLoading: false
      });

      // Initialize widgets from layout if exists
      if (layoutPainel?.configuracao_layout?.widgets) {
        set({ widgets: layoutPainel.configuracao_layout.widgets });
      } else {
        // Create default widgets
        const defaultWidgets: DashboardWidget[] = [
          {
            id: 'tarefas-widget',
            type: 'tarefas',
            title: 'Minhas Tarefas',
            position: { x: 0, y: 0 },
            size: { width: 6, height: 4 }
          },
          {
            id: 'notas-widget',
            type: 'notas',
            title: 'Notas Rápidas',
            position: { x: 6, y: 0 },
            size: { width: 6, height: 4 }
          },
          {
            id: 'links-widget',
            type: 'links',
            title: 'Links Úteis',
            position: { x: 0, y: 4 },
            size: { width: 12, height: 2 }
          }
        ];
        set({ widgets: defaultWidgets });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar dados do dashboard',
        isLoading: false 
      });
    }
  },

  createTarefa: async (data: CreateTarefaData) => {
    try {
      const newTarefa = await createTarefa(data);
      set(state => ({ tarefas: [newTarefa, ...state.tarefas] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao criar tarefa' });
    }
  },

  updateTarefa: async (id: number, data: UpdateTarefaData) => {
    try {
      const updatedTarefa = await updateTarefa(id, data);
      set(state => ({
        tarefas: state.tarefas.map(t => t.id === id ? updatedTarefa : t)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar tarefa' });
    }
  },

  deleteTarefa: async (id) => {
    try {
      await deleteTarefa(id);
      set(state => ({
        tarefas: state.tarefas.filter(t => t.id !== id)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao deletar tarefa' });
    }
  },

  createNota: async (data: CreateNotaData) => {
    try {
      const newNota = await createNota(data);
      set(state => ({ notas: [newNota, ...state.notas] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao criar nota' });
    }
  },

  updateNota: async (id: number, data: UpdateNotaData) => {
    try {
      const updatedNota = await updateNota(id, data);
      set(state => ({
        notas: state.notas.map(n => n.id === id ? updatedNota : n)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar nota' });
    }
  },

  deleteNota: async (id) => {
    try {
      await deleteNota(id);
      set(state => ({
        notas: state.notas.filter(n => n.id !== id)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao deletar nota' });
    }
  },

  createLink: async (data: CreateLinkData) => {
    try {
      const newLink = await createLinkPersonalizado(data);
      set(state => ({ 
        linksPersonalizados: [...state.linksPersonalizados, newLink].sort((a, b) => a.ordem - b.ordem)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao criar link' });
    }
  },

  updateLink: async (id: number, data: UpdateLinkData) => {
    try {
      const updatedLink = await updateLinkPersonalizado(id, data);
      set(state => ({
        linksPersonalizados: state.linksPersonalizados.map(l => l.id === id ? updatedLink : l).sort((a, b) => a.ordem - b.ordem)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar link' });
    }
  },

  deleteLink: async (id) => {
    try {
      await deleteLinkPersonalizado(id);
      set(state => ({
        linksPersonalizados: state.linksPersonalizados.filter(l => l.id !== id)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao deletar link' });
    }
  },

  updateLayout: async (config: Record<string, unknown>) => {
    try {
      const { layoutPainel } = get();
      let updatedLayout: LayoutPainel;
      
      if (layoutPainel) {
        updatedLayout = await updateLayoutPainel(layoutPainel.id, config);
      } else {
        updatedLayout = await createLayoutPainel(config);
      }
      
      set({ layoutPainel: updatedLayout });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar layout' });
    }
  },

  updateWidgets: (widgets) => {
    set({ widgets });
    // Save to layout
    const { layoutPainel } = get();
    if (layoutPainel) {
      get().updateLayout({ ...layoutPainel.configuracao_layout, widgets });
    }
  }
}));
