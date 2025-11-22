/**
 * Página de Detalhes do Usuário
 *
 * Rota: /usuarios/[id]
 *
 * Exibe informações completas do usuário incluindo dados pessoais,
 * cargo e matriz de permissões (quando autorizado).
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UsuarioDetalhes } from './usuario-detalhes';

interface UsuarioPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: UsuarioPageProps): Promise<Metadata> {
  const { id } = await params;

  // Validar ID
  const usuarioId = parseInt(id);
  if (isNaN(usuarioId)) {
    return {
      title: 'Usuário não encontrado',
    };
  }

  return {
    title: `Usuário - Sinesys`,
    description: 'Visualização detalhada do usuário com permissões',
  };
}

export default async function UsuarioPage({ params }: UsuarioPageProps) {
  const { id } = await params;

  // Validar ID
  const usuarioId = parseInt(id);
  if (isNaN(usuarioId)) {
    notFound();
  }

  return <UsuarioDetalhes id={usuarioId} />;
}
