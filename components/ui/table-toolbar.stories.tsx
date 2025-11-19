import type { Meta, StoryObj } from '@storybook/react';
import { TableToolbar, type ComboboxOption } from './table-toolbar';
import { action } from '@storybook/addon-actions';

// Mock filter options for stories
const mockFilterOptions: ComboboxOption[] = [
  { value: 'status-active', label: 'Status: Ativo' },
  { value: 'status-inactive', label: 'Status: Inativo' },
  { value: 'priority-high', label: 'Prioridade: Alta' },
  { value: 'priority-low', label: 'Prioridade: Baixa' },
  { value: 'date-today', label: 'Data: Hoje' },
  { value: 'date-week', label: 'Data: Esta semana' },
  { value: 'category-work', label: 'Categoria: Trabalho' },
  { value: 'category-personal', label: 'Categoria: Pessoal' },
];

const meta: Meta<typeof TableToolbar> = {
  title: 'UI/TableToolbar',
  component: TableToolbar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Componente reutilizável para barras de ferramentas acima de tabelas, integrando busca, filtros e ações.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    searchValue: {
      control: 'text',
      description: 'Valor atual do campo de busca',
    },
    onSearchChange: {
      action: 'searchChanged',
      description: 'Callback chamado quando o valor da busca muda',
    },
    isSearching: {
      control: 'boolean',
      description: 'Indica se está em estado de busca (mostra spinner)',
    },
    searchPlaceholder: {
      control: 'text',
      description: 'Placeholder do campo de busca',
    },
    filterOptions: {
      control: 'object',
      description: 'Opções disponíveis para filtros',
    },
    selectedFilters: {
      control: 'object',
      description: 'IDs dos filtros selecionados',
    },
    onFiltersChange: {
      action: 'filtersChanged',
      description: 'Callback chamado quando os filtros selecionados mudam',
    },
    onNewClick: {
      action: 'newClicked',
      description: 'Callback chamado quando o botão de novo é clicado',
    },
    newButtonTooltip: {
      control: 'text',
      description: 'Texto do tooltip do botão de novo',
    },
    className: {
      control: 'text',
      description: 'Classes CSS adicionais',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableToolbar>;

export const Basic: Story = {
  args: {
    searchValue: '',
    onSearchChange: action('searchChanged'),
    isSearching: false,
    searchPlaceholder: 'Buscar registros...',
    filterOptions: mockFilterOptions.slice(0, 4),
    selectedFilters: [],
    onFiltersChange: action('filtersChanged'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemplo básico do TableToolbar com campo de busca e opções de filtro disponíveis.',
      },
    },
  },
};

export const WithNewButton: Story = {
  args: {
    searchValue: '',
    onSearchChange: action('searchChanged'),
    isSearching: false,
    searchPlaceholder: 'Buscar registros...',
    filterOptions: mockFilterOptions.slice(0, 4),
    selectedFilters: [],
    onFiltersChange: action('filtersChanged'),
    onNewClick: action('newClicked'),
    newButtonTooltip: 'Criar novo registro',
  },
  parameters: {
    docs: {
      description: {
        story: 'TableToolbar com botão de novo registro habilitado, incluindo tooltip.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    searchValue: 'pesquisa em andamento',
    onSearchChange: action('searchChanged'),
    isSearching: true,
    searchPlaceholder: 'Buscar registros...',
    filterOptions: mockFilterOptions.slice(0, 4),
    selectedFilters: ['status-active', 'priority-high'],
    onFiltersChange: action('filtersChanged'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstra o estado de carregamento com spinner ativo durante a busca.',
      },
    },
  },
};

export const ManyFilters: Story = {
  args: {
    searchValue: '',
    onSearchChange: action('searchChanged'),
    isSearching: false,
    searchPlaceholder: 'Buscar registros...',
    filterOptions: mockFilterOptions,
    selectedFilters: ['status-active', 'priority-high', 'date-today', 'category-work'],
    onFiltersChange: action('filtersChanged'),
    onNewClick: action('newClicked'),
    newButtonTooltip: 'Novo item',
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemplo com múltiplos filtros selecionados, mostrando o badge com contador.',
      },
    },
  },
};

export const NoFilters: Story = {
  args: {
    searchValue: '',
    onSearchChange: action('searchChanged'),
    isSearching: false,
    searchPlaceholder: 'Buscar registros...',
    filterOptions: [],
    selectedFilters: [],
    onFiltersChange: action('filtersChanged'),
  },
  parameters: {
    docs: {
      description: {
        story: 'TableToolbar sem opções de filtro disponíveis.',
      },
    },
  },
};

export const CustomPlaceholder: Story = {
  args: {
    searchValue: '',
    onSearchChange: action('searchChanged'),
    isSearching: false,
    searchPlaceholder: 'Digite o nome, email ou telefone para buscar...',
    filterOptions: mockFilterOptions.slice(0, 4),
    selectedFilters: ['status-active'],
    onFiltersChange: action('filtersChanged'),
    onNewClick: action('newClicked'),
    newButtonTooltip: 'Adicionar contato',
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemplo com placeholder customizado para o campo de busca.',
      },
    },
  },
};