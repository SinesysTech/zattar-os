import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Página raiz de Obrigações
 * Redireciona automaticamente para a Lista
 */
export default function ObrigacoesPage() {
  redirect('/acordos-condenacoes/lista');
}
