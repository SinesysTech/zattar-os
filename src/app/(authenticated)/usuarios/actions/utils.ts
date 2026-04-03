
'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service-client';
import { checkPermission } from '@/lib/auth/authorization';

export async function requireAuth(permissions: string[] = []): Promise<{ userId: number }> {
  // 1. Authenticate user
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Não autorizado. Por favor faça login.');
  }

  // 2. Get user numeric ID
  const dbClient = createServiceClient();
  const { data: userData, error: userError } = await dbClient
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('ativo', true)
    .limit(1)
    .maybeSingle();

  if (userError || !userData) {
    throw new Error('Usuário não encontrado ou inativo.');
  }

  const userId = userData.id;

  // 3. Check permissions
  for (const perm of permissions) {
    const parts = perm.split(':');
    const recurso = parts[0];
    const operacao = parts[1];

    // Suportar formato recurso:operacao e apenas "recurso" se recurso.visualizar for o padrão?
    // O legacy usa recurso, operacao.
    if (!recurso || !operacao) continue;

    const hasPermission = await checkPermission(userId, recurso, operacao);
    if (!hasPermission) {
      throw new Error(`Permissão negada: ${recurso}.${operacao}`);
    }
  }

  return { userId };
}
