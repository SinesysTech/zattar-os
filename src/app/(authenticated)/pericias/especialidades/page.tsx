import type { Metadata } from 'next';
import { EspecialidadesPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Perícias | Especialidades',
  description: 'Catálogo de especialidades de perícia sincronizado do PJE',
};

export const dynamic = 'force-dynamic';

export default function EspecialidadesPericiaPage() {
  return <EspecialidadesPageClient />;
}
