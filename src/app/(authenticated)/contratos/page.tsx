import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { actionListarUsuarios } from '@/app/(authenticated)/usuarios';
import { ContratosContent } from './components/contratos-content';
import { actionContratosPulseStats } from './actions/contratos-actions';
import { actionListarSegmentos } from './actions/segmentos-actions';
import type { ContratosPulseStats } from './actions/types';
import type { SegmentoOption } from './hooks/use-segmentos';
import type { ClienteInfo } from './types';

export const metadata: Metadata = {
  title: 'Contratos',
  description: 'Pipeline de contratos com visualizacao de conversao e gestao de portfolio.',
};

/**
 * ContratosPage — Server Component
 *
 * Faz auth guard no servidor e pré-resolve os dados críticos (pulse stats e
 * segmentos) antes de entregar ao client. Isso elimina a classe de bug em que
 * Server Actions chamadas em `useEffect` recebem redirect 307 do proxy e
 * quebram o client RSC com "unexpected response from the server".
 */
export default async function ContratosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/app/login?redirectTo=/app/contratos');

  const [statsResult, segmentosResult, usuariosResult] = await Promise.all([
    actionContratosPulseStats(),
    actionListarSegmentos(),
    actionListarUsuarios({ ativo: true }),
  ]);

  const initialStats: ContratosPulseStats | null = statsResult.success
    ? statsResult.data
    : null;

  const initialSegmentos: SegmentoOption[] = segmentosResult.success
    ? segmentosResult.data.map((s) => ({ id: s.id, nome: s.nome, slug: s.slug }))
    : [];

  const initialUsuarios: ClienteInfo[] =
    usuariosResult.success && usuariosResult.data
      ? (usuariosResult.data.usuarios ?? []).map((u) => ({
          id: u.id,
          nome: u.nomeExibicao || u.nomeCompleto,
          avatarUrl: u.avatarUrl,
        }))
      : [];

  return (
    <ContratosContent
      initialStats={initialStats}
      initialSegmentos={initialSegmentos}
      initialUsuarios={initialUsuarios}
    />
  );
}
