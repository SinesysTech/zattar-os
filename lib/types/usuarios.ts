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

