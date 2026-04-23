/**
 * Normaliza o objeto `criador` retornado pelo Supabase/repository de documentos.
 *
 * Motivação: o repository faz `data as unknown as ArquivoComUsuario[]` sem mapear
 * snake_case → camelCase. Então na prática o shape em runtime pode ser:
 *   { id, nome_completo, nome_exibicao, avatar_url }    (arquivos/documentos)
 * ou
 *   { id, nomeCompleto, nomeExibicao, avatarUrl }       (pastas, já mapeado)
 *
 * Este helper aceita ambos e devolve sempre o mesmo shape, garantindo que a UI
 * exiba nome + avatar corretamente independente da origem.
 */

import { resolveAvatarUrl } from "@/lib/avatar-url";

export interface CriadorRaw {
  id?: number | null;
  // camelCase (shape "oficial" do tipo DocumentoComUsuario / ArquivoComUsuario)
  nomeCompleto?: string | null;
  nomeExibicao?: string | null;
  avatarUrl?: string | null;
  // snake_case (shape de runtime vindo direto do Supabase)
  nome_completo?: string | null;
  nome_exibicao?: string | null;
  avatar_url?: string | null;
}

export interface CriadorNormalizado {
  id: number | null;
  nome: string;
  nomeCompleto: string | null;
  avatarUrl: string | null;
}

export function normalizeCriador(criador: CriadorRaw | null | undefined): CriadorNormalizado {
  if (!criador) {
    return { id: null, nome: 'Desconhecido', nomeCompleto: null, avatarUrl: null };
  }

  const nomeExibicao = criador.nomeExibicao ?? criador.nome_exibicao ?? null;
  const nomeCompleto = criador.nomeCompleto ?? criador.nome_completo ?? null;
  const avatarUrl = resolveAvatarUrl(criador.avatarUrl ?? criador.avatar_url);

  const nome = nomeExibicao || nomeCompleto || 'Desconhecido';

  return {
    id: criador.id ?? null,
    nome,
    nomeCompleto,
    avatarUrl,
  };
}
