# Deploy no Cloudron

Guia completo para build e deploy do Zattar OS na plataforma [Cloudron](https://www.cloudron.io/).

## Arquivos do Projeto

```
projeto/
  CloudronManifest.json         -> Manifesto do app (addons, portas, metadata)
  Dockerfile.cloudron           -> Dockerfile multi-stage (deps -> build -> runtime)
  .env.production               -> Variaveis NEXT_PUBLIC_* (lidas pelo Next.js no build)
  .env.local                    -> Variaveis de runtime (secrets, API keys)
  scripts/
    cloudron-deploy.sh          -> Deploy via Build Service remoto do Cloudron
    cloudron-deploy-local.sh    -> Deploy via Docker build local + push para registry
  cloudron/
    start.sh                    -> Script de inicializacao (mapeia env vars, inicia Node)
    supervisor/
      node.conf                 -> Config do supervisor (legado, nao utilizado)
    README.md                   -> Este arquivo
```

## Pre-requisitos

- Servidor com Cloudron instalado (v7.0+)
- [Cloudron CLI](https://docs.cloudron.io/packaging/cli/) instalado: `npm install -g cloudron`
- Acesso ao Docker Registry do Cloudron (`registry.sinesys.online`)
- Docker instalado localmente (apenas para deploy local)

## Addons Utilizados

| Addon | Descricao | Variaveis Cloudron |
|---|---|---|
| **redis** | Cache distribuido (ioredis) | `CLOUDRON_REDIS_URL`, `CLOUDRON_REDIS_PASSWORD` |
| **sendmail** | Envio de emails via SMTP relay | `CLOUDRON_MAIL_SMTP_*`, `CLOUDRON_MAIL_FROM` |
| **localstorage** | Storage persistente em `/app/data` | Automatico |

> O `start.sh` mapeia automaticamente as variaveis do Cloudron para o formato que o app espera.

---

## Scripts de Deploy

### 1. Deploy Remoto — `cloudron-deploy.sh`

Usa o **Build Service do Cloudron** para buildar a imagem remotamente. O build roda no servidor, sem necessidade de Docker local.

**Fluxo:** Build remoto -> Update -> Env Set

```bash
# Deploy completo (build + update + env set)
./scripts/cloudron-deploy.sh

# Pular o build (apenas update + env set)
./scripts/cloudron-deploy.sh --skip-build

# Apenas setar variaveis de ambiente
./scripts/cloudron-deploy.sh --env-only

# Build sem cache
./scripts/cloudron-deploy.sh --no-cache
```

**Etapas executadas:**

| Step | Comando | Descricao |
|---|---|---|
| 1/3 | `cloudron build build -f Dockerfile.cloudron` | Build remoto via Build Service |
| 2/3 | `cloudron update` | Atualiza o app com a nova imagem |
| 3/3 | `cloudron env set ...` | Seta variaveis de runtime do `.env.local` |

**Configuracao do Build Service (uma vez):**

```bash
cloudron build --set-build-service 'https://builder.sinesys.online' --build-service-token <TOKEN>
```

---

### 2. Deploy Local — `cloudron-deploy-local.sh`

Faz o **Docker build localmente** e envia a imagem para o registry do Cloudron. Alternativa quando o Build Service remoto nao tem memoria suficiente.

**Fluxo:** Docker build local -> Docker push -> Update -> Env Set

```bash
# Deploy completo (build + push + update + env set)
./scripts/cloudron-deploy-local.sh

# Pular o build (apenas update + env set)
./scripts/cloudron-deploy-local.sh --skip-build

# Apenas setar variaveis de ambiente
./scripts/cloudron-deploy-local.sh --env-only

# Build sem cache Docker
./scripts/cloudron-deploy-local.sh --no-cache
```

**Etapas executadas:**

| Step | Comando | Descricao |
|---|---|---|
| 1/4 | `docker build --platform linux/amd64 -f Dockerfile.cloudron -t <IMAGE> .` | Build local (amd64) |
| 2/4 | `docker push <IMAGE>` | Push para `registry.sinesys.online` |
| 3/4 | `cloudron update --image <IMAGE>` | Atualiza o app com a nova imagem |
| 4/4 | `cloudron env set ...` | Seta variaveis de runtime do `.env.local` |

**Tag da imagem:** `registry.sinesys.online/zattar-os:<YYYYMMDD-HHMMSS>-<git-sha>`

**Requisitos de memoria Docker:** Minimo 10 GB RAM para o Docker Desktop (recomendado 12 GB+). Ajuste em Docker Desktop > Settings > Resources > Memory.

**Login no registry (uma vez):**

```bash
docker login registry.sinesys.online
```

---

## Dockerfile.cloudron — Multi-Stage Build

O build usa 3 stages para otimizar o tamanho da imagem:

### Stage 1: `deps` (node:22-alpine)
- Instala dependencias com `npm ci --legacy-peer-deps --ignore-scripts`
- Pula downloads de Playwright e telemetria

### Stage 2: `builder` (node:22-alpine)
- Copia `node_modules` do stage anterior
- Copia o codigo fonte (incluindo `.env.production`)
- Copia o worker do PDF.js para `public/pdfjs/`
- Executa `npm run build:ci` (Next.js build com 6 GB de heap, sem PWA)

### Stage 3: `runner` (cloudron/base:4.2.0)
- Atualiza Node.js 18 -> 22 (cloudron/base vem com Node 18)
- Copia apenas o output standalone do Next.js (build otimizado)
- Cria symlink `.next/cache` -> `/app/data/cache/next` (cache persistente)
- Copia `cloudron/start.sh` como entrypoint

**Comando de build:**
```
npm run build:ci
  = cross-env NODE_OPTIONS=--max-old-space-size=6144 DISABLE_PWA=true NEXT_TELEMETRY_DISABLED=1 next build --webpack
```

---

## Variaveis de Ambiente

### Build Time (`.env.production`)

Lidas automaticamente pelo Next.js durante o build. Sao inlined no JavaScript client-side.

| Variavel | Descricao |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Chave publica do Supabase (protegida por RLS) |

### Runtime (`.env.local` -> `cloudron env set`)

Setadas via `cloudron env set` pelos scripts de deploy. Sao secrets e **nao** devem ser commitadas.

Os scripts filtram automaticamente:
- **Variaveis de addon** (`REDIS_URL`, `REDIS_PASSWORD`): fornecidas pelo Cloudron
- **Variaveis de build** (`NEXT_PUBLIC_*`): ja inlined no build
- **Variaveis irrelevantes** (`PUPPETEER_SKIP_DOWNLOAD`, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`)

### Automaticas (Cloudron Addons)

Mapeadas pelo `start.sh` no startup:

| Addon Cloudron | Variavel App |
|---|---|
| `CLOUDRON_REDIS_URL` | `REDIS_URL` |
| `CLOUDRON_REDIS_PASSWORD` | `REDIS_PASSWORD` |
| `CLOUDRON_MAIL_SMTP_SERVER` | `SYSTEM_SMTP_HOST` |
| `CLOUDRON_MAIL_SMTP_PORT` | `SYSTEM_SMTP_PORT` |
| `CLOUDRON_MAIL_SMTP_USERNAME` | `SYSTEM_SMTP_USER` |
| `CLOUDRON_MAIL_SMTP_PASSWORD` | `SYSTEM_SMTP_PASS` |
| `CLOUDRON_MAIL_FROM` | `SYSTEM_MAIL_FROM` |
| `CLOUDRON_MAIL_FROM_DISPLAY_NAME` | `SYSTEM_MAIL_DISPLAY_NAME` |

---

## CloudronManifest.json

```json
{
  "id": "io.zattar.os",
  "title": "Zattar OS",
  "version": "1.0.0",
  "healthCheckPath": "/api/health",
  "httpPort": 3000,
  "memoryLimit": 2048,
  "optionalSso": true,
  "addons": {
    "localstorage": {},
    "redis": {},
    "sendmail": { "supportsDisplayName": true }
  }
}
```

---

## start.sh — Script de Inicializacao

O `start.sh` executa no container Cloudron a cada startup:

1. **Mapeia variaveis de addon** (Redis, Email) para o formato da aplicacao
2. **Configura runtime** (`NODE_ENV=production`, `HOSTNAME=0.0.0.0`, `PORT=3000`)
3. **Cria diretorios** em `/app/data/` (cache, uploads, logs)
4. **Calcula heap do Node.js** baseado no `CLOUDRON_MEMORY_LIMIT` (container - 256 MB de overhead)
5. **Inicia o servidor** com `exec node /app/code/server.js` (PID 1, sem supervisor)

> O Cloudron gerencia restart do container automaticamente. Supervisor nao eh necessario.

---

## Storage Persistente (/app/data)

O diretorio `/app/data` eh o unico writable e persiste entre updates e backups:

```
/app/data/
  cache/next/    -> Cache do Next.js (symlinked de .next/cache)
  uploads/       -> Uploads temporarios
  logs/          -> Logs da aplicacao
```

> `/app/code` eh READ-ONLY em runtime.

---

## Login no Cloudron CLI

```bash
cloudron login https://my.sinesys.online
```

---

## Comandos Uteis

```bash
# Ver logs em tempo real
cloudron logs -f

# Verificar variaveis de ambiente
cloudron exec -- env | grep -E 'CLOUDRON_|REDIS_|MAIL_'

# Restart da app
cloudron restart

# Verificar Redis
cloudron exec -- node -e "
  const Redis = require('ioredis');
  const r = new Redis(process.env.CLOUDRON_REDIS_URL, { password: process.env.CLOUDRON_REDIS_PASSWORD });
  r.ping().then(p => { console.log('Redis:', p); process.exit(0); });
"

# Ver status da app
cloudron status
```

---

## Fluxo Completo (Resumo)

```
1. Editar codigo
2. Garantir .env.production com NEXT_PUBLIC_* corretas
3. Garantir .env.local com todas as variaveis de runtime
4. Escolher metodo de deploy:
   a) Remoto:  ./scripts/cloudron-deploy.sh
   b) Local:   ./scripts/cloudron-deploy-local.sh
5. Acompanhar: cloudron logs -f
```
