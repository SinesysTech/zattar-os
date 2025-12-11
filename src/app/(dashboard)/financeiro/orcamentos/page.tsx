import { redirect } from 'next/navigation';
import { getSupabase } from '@/app/_lib/supabase';
import OrcamentosClientPage from './client-page';

async function getCurrentUserId(): Promise<string | null> {
  const { supabase } = getSupabase();
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
    redirect('/login');
  }

  return <OrcamentosClientPage usuarioId={usuarioId} />;
}
