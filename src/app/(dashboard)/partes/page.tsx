import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Página raiz de Partes
 * Redireciona automaticamente para a página de Clientes
 */
export default function PartesPage() {
  redirect('/partes/clientes');
}
