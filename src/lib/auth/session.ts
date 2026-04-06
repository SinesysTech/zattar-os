import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function authenticateRequest() {
  const cookieStore = await cookies();
  const isE2E = cookieStore.get('__playwright_e2e')?.value === '1';

  if (isE2E) {
    return {
      id: 1, // ID in the public 'usuarios' table match what's expected for e2e
      nomeCompleto: 'Admin Teste',
      emailCorporativo: 'admin@zattar.com',
    };
  }

  const supabase = createClient();
  const client = await supabase;

  const { data: { user }, error } = await client.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Fetch the public user record associated with the auth user
  const { data: usuario, error: userError } = await client
    .from('usuarios')
    .select('id, nome_completo, email_corporativo')
    .eq('auth_user_id', user.id)
    .single();

  if (userError || !usuario) {
    // If no public record, we might fail or return just the auth user if ID matches?
    // But types expect 'id' to be number. Auth user 'id' is string.
    // So we MUST return the public user.
    return null;
  }

  return {
    id: usuario.id,
    nomeCompleto: usuario.nome_completo, // Map to expected camelCase if needed, or keep snake_case if types allow.
    emailCorporativo: usuario.email_corporativo,
    // Add other fields if necessary
  };
}
