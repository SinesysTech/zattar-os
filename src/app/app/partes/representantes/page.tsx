import { redirect } from 'next/navigation';

/**
 * Página de Representantes - Redirect
 * Redireciona para a página principal de partes com a tab de representantes ativa
 */
export default function RepresentantesPage() {
  redirect('/partes?tab=representantes');
}
