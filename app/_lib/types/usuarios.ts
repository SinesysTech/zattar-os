// Tipos TypeScript para usuários no front-end

import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

/**
 * Filtros para listagem de usuários
 */
export interface UsuariosFilters {
  ativo?: boolean;
  oab?: string;
  ufOab?: string;
}

/**
 * Parâmetros para buscar usuários
 */
export interface UsuariosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ativo?: boolean;
  oab?: string;
  ufOab?: string;
}

/**
 * Tipo de visualização
 */
export type ViewMode = 'cards' | 'table';

/**
 * Re-exportação do tipo Usuario do backend
 */
export type { Usuario };

/**
 * Estrutura de uma permissão individual
 */
export interface Permissao {
  recurso: string;
  operacao: string;
  permitido: boolean;
}

/**
 * Estrutura da matriz de permissões por recurso
 */
export interface PermissaoMatriz {
  recurso: string;
  operacoes: {
    [operacao: string]: boolean;
  };
}

/**
 * Dados completos do usuário com permissões
 */
export interface UsuarioDetalhado extends Usuario {
  permissoes: Permissao[];
}

/**
 * Estado de salvamento de permissões
 */
export interface PermissoesSaveState {
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  hasChanges: boolean;
}

