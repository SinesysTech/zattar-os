import { createClient } from "@/lib/supabase/server"
import { AuthenticatedLayoutClient } from "./layout-client"
import { resolveAvatarUrl } from "@/lib/avatar-url"
import { listarPermissoesUsuario } from "@/app/(authenticated)/usuarios/repository"
import type { UserData } from "@/providers/user-provider"

function isDynamicServerUsageError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const maybeDigest = (error as { digest?: unknown }).digest
  return maybeDigest === "DYNAMIC_SERVER_USAGE"
}

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  let initialUser: UserData | null = null;
  let initialPermissoes: Awaited<ReturnType<typeof listarPermissoesUsuario>> = [];
  
  try {
     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();
     
     if (user) {
        // Fetch user basic data server-side
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('id, auth_user_id, nome_completo, nome_exibicao, email_corporativo, email_pessoal, avatar_url, is_super_admin')
          .eq('auth_user_id', user.id)
          .single();
          
        if (usuario) {
          initialUser = {
            id: usuario.id,
            authUserId: usuario.auth_user_id,
            nomeCompleto: usuario.nome_completo,
            nomeExibicao: usuario.nome_exibicao,
            emailCorporativo: usuario.email_corporativo,
            emailPessoal: usuario.email_pessoal,
            avatarUrl: resolveAvatarUrl(usuario.avatar_url),
            isSuperAdmin: usuario.is_super_admin || false,
          };
          
          initialPermissoes = await listarPermissoesUsuario(usuario.id);
        }
     }
    } catch (e) {
      // During static generation, cookies()-based auth prefetch is expected to be skipped.
      if (!isDynamicServerUsageError(e)) {
       console.error("[Layout] Erro ao pré-buscar usuário:", e);
      }
  }

  return (
    <AuthenticatedLayoutClient initialUser={initialUser} initialPermissoes={initialPermissoes}>
      {children}
    </AuthenticatedLayoutClient>
  )
}
