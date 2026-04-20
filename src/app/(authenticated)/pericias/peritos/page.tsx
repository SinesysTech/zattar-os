import type { Metadata } from 'next';
import { PeritosPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Perícias | Peritos',
  description: 'Vista focada de peritos — cadastro completo em Partes/Terceiros',
};

export const dynamic = 'force-dynamic';

export default function PeritosPage() {
  return <PeritosPageClient />;
}
