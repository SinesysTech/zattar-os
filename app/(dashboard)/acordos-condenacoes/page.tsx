import { redirect } from 'next/navigation';

/**
 * Página raiz de Obrigações
 * Redireciona automaticamente para a Lista
 */
export default function ObrigacoesPage() {
  redirect('/acordos-condenacoes/lista');
}
