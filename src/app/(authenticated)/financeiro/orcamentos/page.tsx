import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OrcamentosClientPage from './client-page';

export const dynamic = 'force-dynamic';

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  return data?.id ? String(data.id) : null;
}

export default async function Page() {
  const usuarioId = await getCurrentUserId();

  if (!usuarioId) {
    redirect('/app/login');
  }

  return <OrcamentosClientPage usuarioId={usuarioId} />;
}
