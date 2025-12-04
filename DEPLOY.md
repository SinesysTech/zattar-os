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
> ⚠️ Importante: Antes de configurar deploy, leia a seção 'Prevenindo Múltiplos Builds Simultâneos' para evitar problemas.

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
   💡 Dica: Se o OOM ocorre durante múltiplos builds simultâneos, veja a seção 'Prevenindo Múltiplos Builds Simultâneos'.

### Container reinicia constantemente

Verifique os logs no dashboard do CapRover: App > App Logs

### Browser Service não conecta

1. Verifique se o app `sinesys-browser` está rodando
2. Confirme que **WebSocket está habilitado** no app
3. Teste a conexão:
   ```bash
   curl http://srv-captain--sinesys-browser:3000/health
   ```

## Prevenindo Múltiplos Builds Simultâneos

Múltiplos builds simultâneos podem causar **Out of Memory (OOM)** no servidor, especialmente quando cada build consome ~2GB de RAM. Isso acontece quando webhooks duplicados ou configurações incorretas no CapRover triggeram builds em paralelo.

### Diagnóstico de Webhooks Duplicados

Para identificar webhooks duplicados no GitHub:

1. Acesse o repositório no GitHub
2. Vá para **Settings → Webhooks**
3. Verifique a lista de webhooks ativos
4. Procure por múltiplos webhooks apontando para a mesma URL do CapRover

**Como identificar duplicados:**
- Mesmo **Payload URL** (ex: `https://captain.yourdomain.com/api/v2/user/apps/webhooks/trigger`)
- Mesmo **Content type** e **Secret** (se aplicável)
- Webhooks com status "Active" para o mesmo app

**Comando para listar webhooks via GitHub CLI:**
```bash
gh api repos/{owner}/{repo}/hooks
```

> ⚠️ **Importante**: Cada app no CapRover deve ter apenas **uma URL de webhook ativa** no GitHub. Múltiplos webhooks para o mesmo app causam builds simultâneos.

### Configuração Correta no CapRover

O CapRover oferece duas opções principais para deploy automático: **"Deploy via GitHub"** e **"Deploy Triggers (Webhook)"**. A diferença é:

- **Deploy via GitHub**: O CapRover monitora o repositório diretamente (requer credenciais Git configuradas)
- **Deploy Triggers (Webhook)**: Usa webhooks externos (como do GitHub) para triggerar builds

**Opção A (Recomendada): Usar apenas "Deploy Triggers (Webhook)" do CapRover**
- No dashboard do CapRover: Apps → [seu-app] → Deployment → Desabilitar "Deploy via GitHub"
- No GitHub: Configure apenas **1 webhook** com a URL fornecida pelo CapRover (Deployment → Deploy Triggers → Copy Webhook URL)

**Opção B: Usar apenas "Deploy via GitHub" (sem webhook externo)**
- No GitHub: Remova todos os webhooks relacionados ao CapRover
- No CapRover: Configure credenciais Git (Deployment → Deploy via GitHub) e habilite o monitoramento

> 🚫 **NUNCA use ambos simultaneamente** (Deploy via GitHub + Webhook): Isso causa builds duplicados e simultâneos, levando a OOM.

### Verificação de Configuração Atual

Para verificar a configuração atual no CapRover:

1. Acesse o dashboard: Apps → [seu-app] → Deployment
2. Verifique se "Deploy via GitHub" está habilitado
3. Verifique se há webhook configurado em "Deploy Triggers"
4. Se ambos estiverem ativos, **desabilite um deles** (recomendado: mantenha apenas o webhook)

### Boas Práticas para Deploy

- Faça commits atômicos: Evite múltiplos pushes em sequência rápida
- Aguarde a conclusão do build anterior antes de fazer novo push
- Use `git push --force` com cautela: Pode triggerar múltiplos builds se houver conflitos
- Considere usar branches de staging para testes antes de deploy em produção

### Checklist de Verificação Pré-Deploy

Antes de cada deploy, verifique:

- [ ] Existe apenas **1 webhook ativo** no GitHub para este app
- [ ] Apenas **uma opção de deploy** está habilitada no CapRover (webhook OU auto-deploy)
- [ ] Não há builds em andamento antes de fazer push
- [ ] O servidor tem memória suficiente (mínimo 4GB disponível)

### Troubleshooting de Múltiplos Builds

**Sintoma**: Logs mostram "A build for [app] was queued, it's now being replaced with a new build..." ou builds simultâneos causando OOM.

**Diagnóstico**:
- No GitHub: Settings → Webhooks → Recent Deliveries → Procure múltiplas requisições para o mesmo commit SHA
- No CapRover: Verifique logs do app para identificar origem dos triggers (webhook vs auto-deploy)

**Solução**:
- Remova webhooks duplicados no GitHub
- Desabilite auto-deploy se estiver usando webhook manual
- Aumente memória do servidor ou adicione swap (ver seção "Build falha com OOM")

### Exemplo de Configuração Correta

```
✅ CONFIGURAÇÃO RECOMENDADA:
- GitHub: 1 webhook ativo (URL do CapRover)
- CapRover: Deploy Triggers habilitado
- CapRover: Deploy via GitHub DESABILITADO

❌ CONFIGURAÇÃO INCORRETA (causa múltiplos builds):
- GitHub: 2+ webhooks ativos
- CapRover: Deploy Triggers E Deploy via GitHub ambos habilitados
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