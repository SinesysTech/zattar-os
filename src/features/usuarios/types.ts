
// Tipos baseados na estrutura do banco e frontend

export type GeneroUsuario = 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_informar';

export interface Endereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  cep?: string;
}

export interface UsuarioDados {
  nomeCompleto: string;
  nomeExibicao: string;
  cpf: string;
  rg?: string | null;
  dataNascimento?: string | null; // ISO date string (YYYY-MM-DD)
  genero?: GeneroUsuario | null;
  oab?: string | null;
  ufOab?: string | null;
  emailPessoal?: string | null;
  emailCorporativo: string;
  telefone?: string | null;
  ramal?: string | null;
  endereco?: Endereco | null;
  authUserId?: string | null; // UUID do Supabase Auth
  cargoId?: number | null;
  isSuperAdmin?: boolean;
  ativo?: boolean;
}

export interface Usuario {
  id: number;
  authUserId: string | null;
  nomeCompleto: string;
  nomeExibicao: string;
  cpf: string;
  rg: string | null;
  dataNascimento: string | null;
  genero: GeneroUsuario | null;
  oab: string | null;
  ufOab: string | null;
  emailPessoal: string | null;
  emailCorporativo: string;
  telefone: string | null;
  ramal: string | null;
  endereco: Endereco | null;
  cargoId: number | null;
  cargo?: {
    id: number;
    nome: string;
    descricao: string | null;
  } | null;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListarUsuariosParams {
  pagina?: number;
  limite?: number;
  busca?: string; // Busca em nome_completo, nome_exibicao, cpf, email_corporativo
  ativo?: boolean;
  oab?: string;
  ufOab?: string;
  cargoId?: number | null;
  isSuperAdmin?: boolean;
}

export interface UsuariosFilters {
  ativo?: boolean;
  oab?: string;
  ufOab?: string;
}

export interface ListarUsuariosResult {
  usuarios: Usuario[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// Visualização (frontend types)
export type ViewMode = 'cards' | 'table';

// Permissões
export interface Permissao {
  recurso: string;
  operacao: string;
  permitido: boolean;
}

export interface PermissaoMatriz {
  recurso: string;
  operacoes: {
    [operacao: string]: boolean;
  };
}

export interface UsuarioDetalhado extends Usuario {
  permissoes: Permissao[];
}

export interface PermissoesSaveState {
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  hasChanges: boolean;
}

export interface OperacaoUsuarioResult {
  sucesso: boolean;
  usuario?: Usuario;
  erro?: string;
  data?: any;
  itensDesatribuidos?: any;
}
