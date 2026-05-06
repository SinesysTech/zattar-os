import "server-only"

import { createClient } from "@/lib/supabase/server"
import { resolveAvatarUrl } from "@/lib/avatar-url"
import {
  listarPermissoesUsuario,
  type Permissao,
} from "@/app/(authenticated)/usuarios/repository"
import type { UserData } from "@/providers/user-provider"

export interface AuthenticatedUserContext {
  initialUser: UserData | null
  initialPermissoes: Permissao[]
}

function isDynamicServerUsageError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const maybeDigest = (error as { digest?: unknown }).digest
  return maybeDigest === "DYNAMIC_SERVER_USAGE"
}

export async function fetchAuthenticatedUserContext(): Promise<AuthenticatedUserContext> {
  let initialUser: UserData | null = null
  let initialPermissoes: Permissao[] = []

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: usuario } = await supabase
        .from("usuarios")
        .select(
          "id, auth_user_id, nome_completo, nome_exibicao, email_corporativo, email_pessoal, avatar_url, is_super_admin"
        )
        .eq("auth_user_id", user.id)
        .single()

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
        }

        initialPermissoes = await listarPermissoesUsuario(usuario.id)
      }
    }
  } catch (error) {
    if (!isDynamicServerUsageError(error)) {
      console.error("[fetchAuthenticatedUserContext] Erro:", error)
    }
  }

  return { initialUser, initialPermissoes }
}
