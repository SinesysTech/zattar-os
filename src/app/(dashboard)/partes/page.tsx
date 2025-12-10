import { redirect } from 'next/navigation';

/**
 * Página raiz de Partes
 * Redireciona automaticamente para a página de Clientes
 */
export default function PartesPage() {
  redirect('/partes/clientes');
}
