import { redirect } from 'next/navigation';

/**
 * Página raiz de Expedientes
 * Redireciona automaticamente para a visualização de Semana
 */
export default function ExpedientesPage() {
  redirect('/expedientes/semana');
}
