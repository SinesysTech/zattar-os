import { createClient } from '@/lib/supabase/server';

/**
 * Retorna o usuário atual autenticado com seus dados e roles
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Buscar dados do usuário na tabela usuarios
  const { data: usuario, error: userError } = await supabase
    .from('usuarios')
    .select('id, nome_completo, nome_exibicao, email_corporativo, is_super_admin')
    .eq('auth_user_id', user.id)
    .single();

  if (userError || !usuario) {
    return null;
  }

  // Determinar roles baseado em is_super_admin
  const roles: string[] = [];
  if (usuario.is_super_admin) {
    roles.push('admin');
  }

  return {
    id: usuario.id,
    nomeCompleto: usuario.nome_completo,
    nomeExibicao: usuario.nome_exibicao,
    emailCorporativo: usuario.email_corporativo,
    roles,
  };
}

/**
 * Garante que o usuário está autenticado antes de prosseguir.
 * Retorna o identificador numérico do usuário (tabela usuarios).
 */
export async function requireAuth(_permissions: string[] = []) {
  const usuario = await getCurrentUser();

  if (!usuario) {
    throw new Error('Não autenticado');
  }

  return { user: { id: usuario.id, roles: usuario.roles } };
}

