#!/usr/bin/env bash
# Sincroniza `src/lib/supabase/database.types.ts` com o schema remoto do
# projeto ZattarOS (Supabase).
#
# Motivação: já tivemos bug silencioso onde o código referenciava `termos_html`
# (coluna fantasma). O PostgREST retornava erro no select, a UI caía em tela
# branca. Tipos atualizados automaticamente pegam esse tipo de drift em PR.
#
# Modos:
#   --write  (default)  Regenera e sobrescreve o arquivo de types.
#   --check             Regenera em arquivo temporário e compara com o commit
#                       atual. Exit 0 se iguais; exit 1 se drift (imprime diff).
#
# Requisitos:
#   - SUPABASE_ACCESS_TOKEN exportado no ambiente (PAT de usuário Supabase com
#     acesso à org do ZattarOS). Sem o token, o script sai com código 0 e
#     warning — para não travar dev novo que ainda não configurou.
#
# Integração com pre-commit: chamado via `npm run db:types:check`; o hook em
# .husky/pre-commit só falha se houver drift e o token estiver disponível.

set -euo pipefail

PROJECT_ID="cxxdivtgeslrujpfpivs"
TYPES_FILE="src/lib/supabase/database.types.ts"
MODE="${1:---write}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "[db-types] SUPABASE_ACCESS_TOKEN não definido — skip."
  echo "[db-types] Para ativar: export SUPABASE_ACCESS_TOKEN=<PAT do Supabase>."
  exit 0
fi

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

echo "[db-types] Gerando types de $PROJECT_ID..."
if ! npx --yes supabase gen types typescript --project-id "$PROJECT_ID" > "$TMP_FILE" 2>/dev/null; then
  echo "[db-types] ERRO: supabase CLI falhou. Verifique o token e conexão." >&2
  exit 2
fi

if [[ ! -s "$TMP_FILE" ]]; then
  echo "[db-types] ERRO: saída do supabase CLI vazia." >&2
  exit 2
fi

case "$MODE" in
  --write)
    mv "$TMP_FILE" "$TYPES_FILE"
    trap - EXIT
    echo "[db-types] $TYPES_FILE atualizado."
    ;;
  --check)
    if diff -q "$TYPES_FILE" "$TMP_FILE" > /dev/null 2>&1; then
      echo "[db-types] OK — nenhum drift."
      exit 0
    fi
    echo "[db-types] DRIFT detectado em $TYPES_FILE." >&2
    echo "[db-types] Rode 'npm run db:types' para regenerar e commitar." >&2
    echo "[db-types] Diff resumido:" >&2
    diff -u "$TYPES_FILE" "$TMP_FILE" | head -40 >&2 || true
    exit 1
    ;;
  *)
    echo "[db-types] Modo desconhecido: $MODE (use --write ou --check)" >&2
    exit 2
    ;;
esac
