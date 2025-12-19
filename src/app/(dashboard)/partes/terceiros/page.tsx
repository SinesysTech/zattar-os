import { redirect } from 'next/navigation';

/**
 * Página de Terceiros - Redirect
 * Redireciona para a página principal de partes com a tab de terceiros ativa
 */
export default function TerceirosPage() {
  redirect('/partes?tab=terceiros');
}
