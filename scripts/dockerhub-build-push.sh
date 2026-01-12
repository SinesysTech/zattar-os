#!/usr/bin/env bash
set -euo pipefail

# Build + push da imagem para o Docker Hub (usa buildx).
# Requisitos:
# - Docker Desktop/Engine rodando (docker server acessível)
# - `docker login` já realizado
# - Variáveis obrigatórias do build do Next.js:
#   - NEXT_PUBLIC_SUPABASE_URL
#   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

DOCKER_IMAGE="${DOCKER_IMAGE:-sinesystec/sinesys}"
PLATFORM="${PLATFORM:-linux/amd64}"
TAG_SHA="${TAG_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Error: env var $name is not set" >&2
    exit 1
  fi
}

# Verifica daemon
if ! docker version >/dev/null 2>&1; then
  echo "Error: Docker daemon não está acessível. Abra o Docker Desktop e tente novamente." >&2
  echo "Dica: rode 'docker version' e confirme que aparece a seção 'Server'." >&2
  exit 1
fi

require_env NEXT_PUBLIC_SUPABASE_URL
require_env NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

# Garante que buildx está pronto
if ! docker buildx inspect >/dev/null 2>&1; then
  docker buildx create --use >/dev/null
fi

echo "Building and pushing: ${DOCKER_IMAGE}:latest and ${DOCKER_IMAGE}:${TAG_SHA} (platform=${PLATFORM})"

docker buildx build \
  --platform "${PLATFORM}" \
  --push \
  -t "${DOCKER_IMAGE}:latest" \
  -t "${DOCKER_IMAGE}:${TAG_SHA}" \
  --build-arg "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}" \
  --build-arg "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY}" \
  .

echo "OK: push concluído no Docker Hub."
