# Deploy do Sinesys

Este documento descreve como fazer o deploy da stack Sinesys em diferentes ambientes.

## Arquitetura de Serviços

O Sinesys é composto por **3 serviços independentes**:

| Serviço | Descrição | Porta | Recursos |
|---------|-----------|-------|----------|
| **sinesys_app** | Frontend Next.js + API | 3000 | 512MB-1GB RAM |
| **sinesys_mcp** | MCP Server para agentes IA | 3001 | 128-256MB RAM |
| **sinesys_browser** | Firefox (scraping PJE) | 3002 | 1-2GB RAM |

```
┌─────────────────────────────────────────────────────────────┐
│                        Servidor                              │
├─────────────────────────────────────────────────────────────┤
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│   │  sinesys_app │   │ sinesys_mcp  │   │sinesys_browser│   │
│   │  (Next.js)   │   │  (Node.js)   │   │   (Firefox)   │   │
│   │  :3000       │   │  :3001       │   │  :3002        │   │
│   └──────┬───────┘   └──────┬───────┘   └───────┬───────┘   │
│          │                  │                    │           │
│          └──────────────────┼────────────────────┘           │
│                             │                                │
│                     ┌───────▼───────┐                       │
│                     │   Supabase    │                       │
│                     └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Deploy no CapRover

### Pré-requisitos

- CapRover instalado e configurado
- CLI do CapRover (`npm install -g caprover`)
- Acesso ao dashboard do CapRover

### Passo 1: Criar os Apps no CapRover

Acesse o dashboard do CapRover e crie **3 apps**:

1. **sinesys** (ou nome de sua preferência)
2. **sinesys-mcp**
3. **sinesys-browser**

### Passo 2: Deploy do Browser Service (Firefox)

O Browser Service usa Firefox via Playwright (o PJE-TRT funciona melhor com Firefox).

**Opção A: Build local e deploy**

1. Faça build da imagem localmente:
   ```bash
   docker build -f Dockerfile.browser -t sinesys_browser:latest .
   ```

2. Envie para seu registry ou faça deploy via tarball:
   ```bash
   # Via CLI do CapRover
   caprover deploy -a sinesys-browser -t ./Dockerfile.browser
   ```

**Opção B: Deploy via captain-definition**

1. Renomeie o arquivo:
   ```bash
   cp captain-definition.browser captain-definition
   ```

2. Deploy:
   ```bash
   caprover deploy -a sinesys-browser
   ```

3. Restaure o captain-definition original:
   ```bash
   git checkout captain-definition
   ```

4. Configure as variáveis de ambiente no dashboard:
   ```
   PORT=3000
   BROWSER_TOKEN=seu_token_opcional
   ```

5. Em **App Configs** > **Container HTTP Port**: `3000`

6. Configure os recursos mínimos (se disponível):
   - Memory: 2048MB
   - CPU: 1-2 cores

### Passo 3: Deploy do MCP Server

1. No terminal, navegue até a pasta `mcp/`:
   ```bash
   cd mcp
   ```

2. Faça login no CapRover:
   ```bash
   caprover login
   ```

3. Deploy do MCP:
   ```bash
   caprover deploy -a sinesys-mcp
   ```

4. Configure as variáveis de ambiente no dashboard:
   ```
   NODE_ENV=production
   PORT=3001
   SINESYS_API_URL=http://srv-captain--sinesys:3000
   SINESYS_API_KEY=sua_api_key
   ```

   > **Nota**: No CapRover, a comunicação entre apps usa o formato `srv-captain--NOME_DO_APP`

### Passo 4: Deploy do App Principal

1. Volte para a raiz do projeto:
   ```bash
   cd ..
   ```

2. Deploy do app:
   ```bash
   caprover deploy -a sinesys
   ```

   > **Importante**: O CapRover pedirá os build args. Informe:
   > - `NEXT_PUBLIC_SUPABASE_URL`
   > - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

3. Configure as variáveis de ambiente no dashboard:
   ```
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

### Passo 5: Configurar Domínios

No dashboard do CapRover, configure os domínios para cada app:

| App | Domínio Sugerido |
|-----|------------------|
| sinesys | app.seudominio.com.br |
| sinesys-mcp | mcp.seudominio.com.br (ou interno) |
| sinesys-browser | (não expor externamente) |

### Passo 6: Habilitar HTTPS

Para cada app exposto externamente:
1. Vá em **HTTP Settings**
2. Clique em **Enable HTTPS**
3. Marque **Force HTTPS**

---

## Deploy com Docker Compose (Local/VPS)

### Desenvolvimento Local

```bash
# Criar arquivo .env com suas variáveis
cp .env.example .env

# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### Docker Swarm com Traefik

Use o arquivo `docker-compose.swarm.yml`:

```bash
# Criar rede (se não existir)
docker network create --driver overlay network_swarm_public

# Deploy da stack
docker stack deploy -c docker-compose.swarm.yml sinesys

# Ver status
docker service ls

# Ver logs
docker service logs sinesys_sinesys_app -f
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

## Comunicação entre Serviços

### No CapRover
Use o formato: `srv-captain--NOME_DO_APP`

```
http://srv-captain--sinesys:3000
http://srv-captain--sinesys-mcp:3001
ws://srv-captain--sinesys-browser:3000
```

### No Docker Compose
Use o nome do serviço diretamente:

```
http://sinesys_app:3000
http://sinesys_mcp:3001
ws://sinesys_browser:3000
```

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

Verifique os logs:
```bash
# CapRover
# Dashboard > App > App Logs

# Docker
docker logs sinesys_app -f
```

### Browser Service não conecta

1. Verifique se o serviço está rodando
2. Confirme a URL de conexão (interno vs externo)
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

```env
# ==========================================
# SUPABASE (obrigatório)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...

# ==========================================
# API KEY (para comunicação entre serviços)
# ==========================================
SERVICE_API_KEY=sua_api_key_segura

# ==========================================
# BROWSER SERVICE
# ==========================================
# Para CapRover:
BROWSER_WS_ENDPOINT=ws://srv-captain--sinesys-browser:3000
BROWSER_SERVICE_URL=http://srv-captain--sinesys-browser:3000

# Para Docker Compose:
# BROWSER_WS_ENDPOINT=ws://sinesys_browser:3000
# BROWSER_SERVICE_URL=http://sinesys_browser:3000

BROWSER_SERVICE_TOKEN=opcional_token_seguranca

# ==========================================
# REDIS (opcional)
# ==========================================
ENABLE_REDIS_CACHE=true
REDIS_URL=redis://user:password@host:6379

# ==========================================
# MONGODB (opcional)
# ==========================================
MONGODB_URL=mongodb://user:password@host:27017
MONGODB_DATABASE=sinesys

# ==========================================
# 2FAUTH (para OTP do PJE)
# ==========================================
TWOFAUTH_API_URL=https://seu-2fauth.com
TWOFAUTH_API_TOKEN=seu_token
TWOFAUTH_ACCOUNT_ID=id_da_conta

# ==========================================
# DOMÍNIO (para docker-compose.swarm.yml)
# ==========================================
DOMAIN=app.seudominio.com.br
```

