import { PericiasClient } from '@/app/(authenticated)/pericias/components/pericias-client';

export const dynamic = 'force-dynamic';

/**
 * Página raiz de Perícias — default view é "quadro" (Missão).
 */
export default function PericiasPage() {
  return <PericiasClient initialView="quadro" />;
}


