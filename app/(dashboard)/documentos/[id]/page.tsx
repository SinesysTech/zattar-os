/**
 * Página do editor de documentos
 * /documentos/[id]
 */

import { Metadata } from 'next';
import { ClientLoader } from './client-loader';

export const metadata: Metadata = {
  title: 'Documentos | Sinesys',
  description: 'Gerencie seus documentos',
};

export default function Page() {
  return <ClientLoader />;
}
