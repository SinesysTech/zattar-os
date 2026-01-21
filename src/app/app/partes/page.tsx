import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Página de Partes
 *
 * Redireciona para a tab principal (Clientes)
 */
export default function PartesPage() {
  redirect('/app/partes/clientes');
}
