import { redirect } from 'next/navigation';

/**
 * Página raiz de Captura
 * Redireciona automaticamente para o Histórico
 */
export default function CapturaPage() {
  redirect('/captura/historico');
}
