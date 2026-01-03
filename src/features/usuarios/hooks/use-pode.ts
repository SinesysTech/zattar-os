'use client';

import { useMinhasPermissoes } from './use-minhas-permissoes';

/**
 * Hook simplificado para verificar se o usuário tem permissão para uma operação
 *
 * @param recurso - Nome do recurso (ex: 'processos', 'usuarios')
 * @param operacao - Operação desejada (ex: 'criar', 'editar', 'visualizar', 'excluir')
 * @returns boolean indicando se o usuário tem a permissão
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const podeCriar = usePode('processos', 'criar');
 *
 *   return (
 *     <div>
 *       {podeCriar && <button>Criar Processo</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePode(recurso: string, operacao: string): boolean {
  const { data, isLoading } = useMinhasPermissoes();

  // Durante o carregamento, retorna false (sem permissão)
  // Isso evita que elementos protegidos apareçam brevemente durante o loading
  if (isLoading || !data) {
    return false;
  }

  // Super admin tem todas as permissões
  if (data.isSuperAdmin) {
    return true;
  }

  // Verifica se o usuário tem a permissão específica
  return data.permissoes.some(
    (p) => p.recurso === recurso && p.operacao === operacao && p.permitido
  );
}
