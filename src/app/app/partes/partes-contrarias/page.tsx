import { redirect } from 'next/navigation';

/**
 * Página de Partes Contrárias - Redirect
 * Redireciona para a página principal de partes com a tab de partes contrárias ativa
 */
export default function PartesContrariasPage() {
  redirect('/app/partes?tab=partes-contrarias');
}
