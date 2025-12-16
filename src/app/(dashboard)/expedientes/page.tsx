import { redirect } from 'next/navigation';

/**
 * Página raiz de Expedientes
 * Redireciona automaticamente para a visualização de Lista
 */
export default function ExpedientesPage() {
  redirect('/expedientes/lista');
}
