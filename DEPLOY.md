# Deploy do Sinesys

Este documento descreve como fazer o deploy da stack Sinesys em diferentes ambientes.

## Arquitetura de Serviços

O Sinesys é composto por **3 serviços independentes**, cada um em seu próprio repositório:

| Serviço | Repositório | Descrição | Porta | WebSocket |
|---------|-------------|-----------|-------|-----------|
| **sinesys_app** | Este repo | Frontend Next.js + API | 3000 | ❌ |
| **sinesys_mcp** | sinesys-mcp-server | MCP Server para agentes IA | 3001 | ❌ |
| **sinesys_browser** | sinesys-browser-server | Firefox (scraping PJE) | 3000 | ✅ |

```
┌─────────────────────────────────────────────────────────────┐
│                        Servidor                              │
├─────────────────────────────────────────────────────────────┤
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│   │  sinesys_app │   │ sinesys_mcp  │   │sinesys_browser│   │
│   │  (Next.js)   │   │  (Node.js)   │   │   (Firefox)   │   │
│   │  :3000       │   │  :3001       │   │  :3000 (WS)   │   │
│   └──────┬───────┘   └──────┬───────┘   └───────┬───────┘   │
│          │                  │                    │           │
│          └──────────────────┼────────────────────┘           │
│                             │                                │
│                     ┌───────▼───────┐                       │
│                     │   Supabase    │                       │
│                     │ Redis MongoDB │                       │
│                     └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Deploy no CapRover

### Pré-requisitos

- CapRover instalado e configurado
- CLI do CapRover (`npm install -g caprover`)
- Acesso ao dashboard do CapRover
- Os 3 repositórios clonados localmente

### Passo 1: Criar os Apps no CapRover

Acesse o dashboard do CapRover e crie **3 apps**:

| Nome do App | Repositório | HTTP Port | WebSocket |
|-------------|-------------|-----------|-----------|
| `sinesys` | Este repo | 3000 | ❌ |
| `sinesys-mcp` | sinesys-mcp-server | 3001 | ❌ |
| `sinesys-browser` | sinesys-browser-server | 3000 | ✅ |

> ⚠️ **Importante**: Habilite WebSocket Support apenas para `sinesys-browser`!

### Passo 2: Deploy do Browser Service (Firefox)

**No repositório sinesys-browser-server:**

```bash
# Clone o repositório
git clone https://github.com/seu-org/sinesys-browser-server.git
cd sinesys-browser-server

# Login no CapRover
caprover login

# Deploy
caprover deploy -a sinesys-browser
```

**Variáveis de ambiente:**
```env
PORT=3000
BROWSER_TOKEN=seu_token_opcional
```

**Configurações importantes:**
- Container HTTP Port: `3000`
- WebSocket Support: ✅ **Habilitar**
- Memory: 2048MB (mínimo)

### Passo 3: Deploy do MCP Server

**No repositório sinesys-mcp-server:**

```bash
cd sinesys-mcp-server

# Login no CapRover (se ainda não fez)
caprover login

# Deploy
caprover deploy -a sinesys-mcp
```

**Variáveis de ambiente:**
```env
NODE_ENV=production
PORT=3001
SINESYS_API_URL=http://srv-captain--sinesys:3000
SINESYS_API_KEY=sua_api_key
```

### Passo 4: Deploy do App Principal

**Neste repositório (Sinesys):**

```bash
# Login no CapRover
caprover login

# Deploy
caprover deploy -a sinesys
```

> **Importante**: O CapRover pedirá os build args. Informe:
> - `NEXT_PUBLIC_SUPABASE_URL`
> - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

**Variáveis de ambiente:**
```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_anon_key
SUPABASE_SECRET_KEY=sua_secret_key

# Browser Service (comunicação interna CapRover)
BROWSER_WS_ENDPOINT=ws://srv-captain--sinesys-browser:3000
BROWSER_SERVICE_URL=http://srv-captain--sinesys-browser:3000

# Redis (opcional)
ENABLE_REDIS_CACHE=true
REDIS_URL=redis://host:port

# MongoDB (opcional)
MONGODB_URL=mongodb://...
MONGODB_DATABASE=sinesys
```

### Passo 5: Configurar Domínios e HTTPS

No dashboard do CapRover:

| App | Domínio | HTTPS |
|-----|---------|-------|
| sinesys | app.seudominio.com.br | ✅ |
| sinesys-mcp | mcp.seudominio.com.br (opcional) | ✅ |
| sinesys-browser | (não expor) | — |

---

## Deploy com Docker Compose (Local)

Para desenvolvimento local, você pode usar o `docker-compose.yml` simplificado:

```bash
# Subir apenas o app (sem mcp e browser)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

> **Nota**: Para desenvolvimento completo com os 3 serviços, clone os outros repositórios e suba-os separadamente.

---

## Comunicação entre Serviços

### No CapRover
Use o formato: `srv-captain--NOME_DO_APP`

```
http://srv-captain--sinesys:3000
http://srv-captain--sinesys-mcp:3001
ws://srv-captain--sinesys-browser:3000
```

### No Docker Compose Local
Use o nome do serviço:

```
http://sinesys_app:3000
```

---

## Build Args vs Environment Variables

### Build Args (tempo de build)
Usados apenas durante `docker build`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

> **Por quê?** Variáveis `NEXT_PUBLIC_*` são "inlined" no código durante o build do Next.js.

### Environment Variables (runtime)
Usadas quando o container está rodando:
- `SUPABASE_SECRET_KEY`
- `BROWSER_WS_ENDPOINT`
- `REDIS_URL`
- etc.

---

## Troubleshooting

### Build falha com OOM (Out of Memory)

O Next.js pode consumir muita memória durante o build. Soluções:

1. **Aumentar memória do build no CapRover**:
   - App Configs > Build Timeout & Memory
   - Aumente para 4096MB ou mais

2. **Usar swap no servidor**:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

3. **Build em máquina externa**:
   ```bash
   docker build -t sinesys:latest .
   docker tag sinesys:latest seu-registry/sinesys:latest
   docker push seu-registry/sinesys:latest
   ```
   E no CapRover, use "Deploy via ImageName".

### Container reinicia constantemente

Verifique os logs no dashboard do CapRover: App > App Logs

### Browser Service não conecta

1. Verifique se o app `sinesys-browser` está rodando
2. Confirme que **WebSocket está habilitado** no app
3. Teste a conexão:
   ```bash
   curl http://srv-captain--sinesys-browser:3000/health
   ```

---

## Recursos Recomendados

| Serviço | RAM Mínima | RAM Recomendada | CPU |
|---------|------------|-----------------|-----|
| sinesys_app | 512MB | 1GB | 1 core |
| sinesys_mcp | 128MB | 256MB | 0.5 core |
| sinesys_browser | 1GB | 2GB | 1-2 cores |

**Total recomendado**: VPS com 4GB RAM, 2-4 cores

---

## Variáveis de Ambiente Completas

### App Principal (sinesys)

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...

# API Key (para comunicação entre serviços)
SERVICE_API_KEY=sua_api_key_segura

# Browser Service
BROWSER_WS_ENDPOINT=ws://srv-captain--sinesys-browser:3000
BROWSER_SERVICE_URL=http://srv-captain--sinesys-browser:3000
BROWSER_SERVICE_TOKEN=opcional_token_seguranca

# Redis (opcional)
ENABLE_REDIS_CACHE=true
REDIS_URL=redis://user:password@host:6379

# MongoDB (opcional)
MONGODB_URL=mongodb://user:password@host:27017
MONGODB_DATABASE=sinesys

# 2FAuth (para OTP do PJE)
TWOFAUTH_API_URL=https://seu-2fauth.com
TWOFAUTH_API_TOKEN=seu_token
TWOFAUTH_ACCOUNT_ID=id_da_conta
```

### MCP Server (sinesys-mcp)

```env
NODE_ENV=production
PORT=3001
SINESYS_API_URL=http://srv-captain--sinesys:3000
SINESYS_API_KEY=sua_api_key_segura
```

### Browser Server (sinesys-browser)

```env
PORT=3000
BROWSER_TOKEN=opcional_token_seguranca
```
