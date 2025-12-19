import { redirect } from 'next/navigation';

/**
 * Página de Clientes - Redirect
 * Redireciona para a página principal de partes com a tab de clientes ativa
 */
export default function ClientesPage() {
  redirect('/partes?tab=clientes');
}
