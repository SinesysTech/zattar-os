// Tipos para integração com API de clientes no frontend

import type { Cliente, ListarClientesParams } from '@/backend/clientes/services/persistence/cliente-persistence.service';

/**
 * Resposta da API de clientes (formato padrão)
 */
export interface ClientesApiResponse {
  success: boolean;
  data: {
    clientes: Cliente[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

/**
 * Parâmetros para buscar clientes (frontend)
 */
export interface BuscarClientesParams extends Partial<ListarClientesParams> {
  pagina?: number;
  limite?: number;
  busca?: string;
  tipoPessoa?: 'pf' | 'pj';
  ativo?: boolean;
}

/**
 * Estado de filtros da página de clientes
 */
export interface ClientesFilters {
  tipoPessoa?: 'pf' | 'pj';
  ativo?: boolean;
}

