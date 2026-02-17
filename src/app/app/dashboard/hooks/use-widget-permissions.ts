'use client';

/**
 * Hook para verificar permissões de visualização de widgets no dashboard
 *
 * Retorna flags booleanas indicando quais widgets o usuário pode visualizar
 * baseado em suas permissões granulares no sistema.
 */

import { useMemo } from 'react';
import { usePermissoes } from '@/providers/user-provider';

export interface WidgetPermissions {
  podeVerProcessos: boolean;
  podeVerAudiencias: boolean;
  podeVerExpedientes: boolean;
  podeVerFinanceiro: boolean;
  podeVerRH: boolean;
  podeVerCaptura: boolean;
  isLoading: boolean;
  temAlgumaPermissao: boolean;
}

/**
 * Hook que retorna as permissões de visualização de widgets do dashboard
 *
 * @example
 * const { podeVerProcessos, podeVerFinanceiro, isLoading } = useWidgetPermissions();
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <>
 *     {podeVerProcessos && <WidgetProcessos />}
 *     {podeVerFinanceiro && <WidgetFinanceiro />}
 *   </>
 * );
 */
export function useWidgetPermissions(): WidgetPermissions {
  const { data, isLoading, temPermissao } = usePermissoes();

  const permissions = useMemo(() => {
    // Se é superadmin, tem acesso a tudo
    if (data?.isSuperAdmin) {
      return {
        podeVerProcessos: true,
        podeVerAudiencias: true,
        podeVerExpedientes: true,
        podeVerFinanceiro: true,
        podeVerRH: true,
        podeVerCaptura: true,
        isLoading: false,
        temAlgumaPermissao: true,
      };
    }

    // Verificar cada permissão individualmente
    const podeVerProcessos = temPermissao('processos', 'read');
    const podeVerAudiencias = temPermissao('audiencias', 'read');
    const podeVerExpedientes = temPermissao('expedientes', 'read');
    const podeVerFinanceiro = temPermissao('financeiro', 'read');
    const podeVerRH = temPermissao('rh', 'read');
    const podeVerCaptura = temPermissao('captura', 'read');

    const temAlgumaPermissao =
      podeVerProcessos ||
      podeVerAudiencias ||
      podeVerExpedientes ||
      podeVerFinanceiro ||
      podeVerRH ||
      podeVerCaptura;

    return {
      podeVerProcessos,
      podeVerAudiencias,
      podeVerExpedientes,
      podeVerFinanceiro,
      podeVerRH,
      podeVerCaptura,
      isLoading,
      temAlgumaPermissao,
    };
  }, [data?.isSuperAdmin, temPermissao, isLoading]);

  return permissions;
}
