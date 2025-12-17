# Deploy Guide - Sinesys

Este documento descreve o processo de build e deploy da aplicacao Sinesys.

## Visao Geral

O Sinesys utiliza:
- **Docker** para containerizacao (multi-stage build com Alpine Linux)
- **GitHub Actions** para CI/CD automatizado
- **Docker Hub** como registry de imagens
- **CapRover** como plataforma de deploy

## Arquitetura de Deploy

```
Developer Push → GitHub Actions → Docker Hub → CapRover → Producao
```

### Fluxo Detalhado

1. **Push para main/master** dispara o workflow
2. **Build Docker** com multi-stage (deps → builder → runner)
3. **Push para Docker Hub** com tags `latest` e `sha-xxxxx`
4. **Deploy automatico** via webhook do CapRover (se configurado)

## Configuracao de Secrets

### GitHub Secrets (Obrigatorios)

Configurar em: GitHub > Settings > Secrets and variables > Actions

| Secret | Descricao | Exemplo |
|--------|-----------|---------|
| `DOCKERHUB_USERNAME` | Username do Docker Hub | `sinesystec` |
| `DOCKERHUB_TOKEN` | Access Token do Docker Hub | `dckr_pat_xxx...` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key do Supabase | `eyJhbGciOi...` |

### GitHub Secrets (Opcionais - para deploy automatico)

| Secret | Descricao | Exemplo |
|--------|-----------|---------|
| `CAPROVER_SERVER` | URL do CapRover | `https://captain.seudominio.com` |
| `CAPROVER_APP_TOKEN` | Token do app no CapRover | `app-token-xxx` |

### Obtendo o Docker Hub Token

1. Acesse [hub.docker.com](https://hub.docker.com)
2. Va em Account Settings > Security
3. Clique em "New Access Token"
4. Selecione permissao "Read & Write"
5. Copie o token gerado

### Obtendo o CapRover App Token

1. Acesse o dashboard do CapRover
2. Va em Apps > sinesys > Deployment
3. Clique em "Enable App Token for Deployments"
4. Copie o token gerado

## Build Local

### Requisitos

- Docker 23.0+ (com BuildKit)
- ~4GB de RAM disponivel

### Comandos

```bash
# Build da imagem
docker build -t sinesys:local .

# Executar container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJxxx \
  sinesys:local

# Verificar tamanho da imagem
docker images sinesys:local

# Verificar health
curl http://localhost:3000/api/health
```

### Build com Variaveis de Ambiente

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJxxx \
  -t sinesys:local .
```

## Deploy Manual no CapRover

Se o deploy automatico nao estiver configurado:

1. Acesse o dashboard do CapRover
2. Va em Apps > sinesys > Deployment
3. Em "Deploy via ImageName", digite: `sinesystec/sinesys:latest`
4. Clique em "Deploy"

## GitHub Actions Workflows

### deploy.yml (Build e Deploy)

- **Trigger**: Push para main/master ou manual
- **Jobs**:
  - `build-and-push`: Build da imagem e push para Docker Hub
  - `deploy`: Deploy para CapRover (opcional)

### tests.yml (Testes)

- **Trigger**: Push ou PR para main/master/develop
- **Jobs**:
  - `quality`: Lint e Type Check
  - `unit-tests`: Testes unitarios
  - `integration-tests`: Testes de integracao
  - `e2e-tests`: Testes end-to-end

## Dockerfile - Otimizacoes

### Multi-Stage Build

1. **deps**: Instala dependencias com cache
2. **builder**: Compila a aplicacao Next.js
3. **runner**: Imagem final leve (~200-300MB)

### Alpine Linux

Usamos `node:24-alpine` por:
- Menor tamanho base (~50MB vs ~150MB slim)
- Menos vulnerabilidades
- Inicializacao mais rapida

### Cache Strategy

- **npm cache**: `/root/.npm` montado como cache
- **general cache**: `/root/.cache` montado como cache
- **Registry cache**: Layers armazenadas no Docker Hub

## Troubleshooting

### Build falha por falta de memoria

```bash
# Aumente a memoria do Docker
# Docker Desktop: Settings > Resources > Memory > 4GB+

# Ou reduza NODE_OPTIONS no Dockerfile
ENV NODE_OPTIONS="--max-old-space-size=2048"
```

### Container reiniciando (OOM)

1. Verifique logs: `docker logs <container_id>`
2. Procure por: "out of memory", "heap", "killed"
3. Monitore: `docker stats <container_id>`

### Build nao usa cache

1. Verifique se `.dockerignore` esta correto
2. Verifique ordem dos comandos no Dockerfile
3. Para registry cache, verifique permissoes no Docker Hub

### Deploy falha no CapRover

1. Verifique se a imagem foi publicada no Docker Hub
2. Verifique se o CAPROVER_APP_TOKEN esta correto
3. Verifique logs no CapRover dashboard

## Metricas Esperadas

| Metrica | Valor |
|---------|-------|
| Tamanho da imagem | < 300MB |
| Tempo de build (sem cache) | ~6-10 min |
| Tempo de build (com cache) | ~2-4 min |
| Tempo de inicializacao | ~10-15s |

## Comandos Uteis

```bash
# Ver tamanho das layers
docker history sinesys:local

# Remover imagens antigas
docker image prune -a

# Ver logs do container
docker logs -f <container_id>

# Entrar no container
docker exec -it <container_id> sh

# Ver uso de recursos
docker stats <container_id>
```

## Referencias

- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
- [CapRover Docs](https://caprover.com/docs/)
- [Docker BuildKit](https://docs.docker.com/build/buildkit/)
- [GitHub Actions Docker](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
