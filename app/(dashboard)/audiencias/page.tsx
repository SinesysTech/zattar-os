import { redirect } from 'next/navigation';

/**
 * Página raiz de Audiências
 * Redireciona automaticamente para a visualização de Semana
 */
export default function AudienciasPage() {
  redirect('/audiencias/semana');
}
