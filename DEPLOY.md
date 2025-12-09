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
- **Docker com BuildKit habilitado** (ver seção "Requisito: Docker BuildKit")

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
> 💡 **Dica**: Para entender como otimizar o tempo de build, veja a seção "Otimização de Build e Cache Docker".
> 💡 **Nota**: O build do Next.js requer pelo menos 4GB de RAM disponível no servidor. Verifique a seção "Proteções Contra Out-Of-Memory (OOM)" para detalhes.
> 💡 **Nota**: Para entender os scripts de build, veja 'Scripts de Build e Configuração do Next.js'.

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

## Scripts de Build e Configuração do Next.js

#### Diferença entre Scripts de Build

O projeto possui diferentes scripts de build para diferentes cenários:

| Script | Comando | Uso | Turbopack | Otimizações |
|--------|---------|-----|-----------|-------------|
| `build:prod` | `next build --webpack` | **Produção (CapRover)** | ❌ Não | Máximas |
| `build` | `next build --turbopack` + filtros | Desenvolvimento local | ✅ Sim | Warnings filtrados |
| `build:prod:webpack` | `next build --webpack` | Fallback se Turbopack falhar | ❌ Não | Máximas |
| `build:prod:turbopack` | `next build --turbopack` | Produção (experimental) | ✅ Sim | Experimental |
| `build:debug-memory` | `node scripts/run-build-debug-memory.js` | Debug de OOM | ✅ Sim | + GC trace |
| `analyze` | `node scripts/run-analyze.js` | Análise de bundle | ✅ Sim | + Analyzer |

**Por que Webpack em produção?**
- O plugin PWA `@ducanh2912/next-pwa` requer Webpack para gerar corretamente o service worker e assets offline.
- Garante compatibilidade total com a configuração `withPWA(...)` em `next.config.ts`.
- Turbopack permanece disponível para desenvolvimento local e experimentos, mas não é usado no caminho principal de produção.

**Quando usar Webpack?**
- Se houver problemas de compatibilidade com Turbopack
- Se usar plugins Webpack customizados não suportados
- Use o script `build:prod:webpack` como fallback

#### Otimizações de Memória no next.config.ts

O `next.config.ts` inclui várias otimizações para reduzir consumo de memória:

**1. Source Maps desabilitados:**
```typescript
productionBrowserSourceMaps: false,  // Economiza ~500MB durante build
experimental: {
  serverSourceMaps: false,           // Reduz memória do servidor
}
```

**2. Otimizações de Webpack:**
```typescript
experimental: {
  webpackMemoryOptimizations: true,  // Reduz uso de memória durante build
  webpackBuildWorker: true,          // Usa worker separado para build
}
```

**3. Output Standalone:**
```typescript
output: 'standalone',  // Gera build otimizado para Docker (~200-300MB)
```

**Trade-offs:**
- `webpackMemoryOptimizations: true` pode aumentar tempo de build em ~10-20%
- Source maps desabilitados dificultam debug em produção (use logs estruturados)
- `typescript.ignoreBuildErrors: true` **esconde erros de tipo** - use com cautela

#### Análise de Bundle

Para identificar dependências grandes que consomem memória:

```bash
# Gerar relatório de análise
npm run analyze

# Abrir relatórios gerados
open analyze/client.html
open analyze/server.html
```

**O que procurar:**
- Dependências >500KB que podem ser otimizadas
- Bibliotecas duplicadas (diferentes versões)
- Código não usado (tree-shaking incompleto)

**Ações comuns:**
- Substituir bibliotecas grandes por alternativas menores
- Usar imports dinâmicos para código não-crítico
- Atualizar dependências para versões mais leves

#### Debug de Memória

Se o build falhar com OOM, use o script de debug:

```bash
npm run build:debug-memory
```

Este script:
- Define `NODE_OPTIONS` com `--max-old-space-size=2048` e `--trace-gc`
- Mostra eventos de garbage collection durante o build
- Ajuda a identificar picos de memória e possíveis vazamentos

**Analisando heap snapshots:**
```bash
# Gerar heap profile
node --heap-prof node_modules/next/dist/bin/next build

# Abrir no Chrome DevTools
# 1. Abra chrome://inspect
# 2. Clique em "Open dedicated DevTools for Node"
# 3. Vá para Memory tab
# 4. Load o arquivo .heapprofile gerado
```

#### TypeScript Build Errors

O projeto usa `typescript.ignoreBuildErrors: true` no `next.config.ts`.

**Por quê?**
- [DOCUMENTAR RAZÃO ESPECÍFICA DO PROJETO]
- Permite builds mesmo com erros de tipo
- Útil durante desenvolvimento rápido

**Riscos:**
- Erros de tipo podem causar bugs em produção
- Dificulta manutenção do código
- Pode esconder problemas sérios

**Alternativas mais seguras:**
```bash
# Verificar tipos antes do build (recomendado)
npm run type-check

# Build com verificação de tipos
# Remover temporariamente ignoreBuildErrors do next.config.ts
```

**Recomendação**: Considere remover `ignoreBuildErrors` e corrigir erros de tipo gradualmente.

---

## Progressive Web App (PWA)

### Visão Geral

O Sinesys é um **Progressive Web App (PWA)** completo, permitindo instalação como aplicativo nativo em dispositivos móveis e desktop.

**Tecnologias**:
- `@ducanh2912/next-pwa` v10.2.9 (geração automática de service worker)
- Workbox (estratégias de cache avançadas)
- Web App Manifest (metadados do app)

**Benefícios**:
- 📱 Instalação como app nativo (ícone na tela inicial)
- ⚡ Carregamento instantâneo (cache inteligente)
- 🔌 Funciona offline (páginas em cache)
- 🔔 Notificações push (futuro)
- 📊 Menor consumo de dados (cache de assets)

---

### Requisitos para Instalação

Para que o navegador mostre a opção "Instalar app", **TODOS** os critérios abaixo devem ser atendidos:

#### 1. Requisitos Técnicos (Automáticos)

| Requisito | Status | Verificação |
|-----------|--------|-------------|
| **HTTPS** | ✅ Obrigatório | Produção: HTTPS / Dev: localhost |
| **Manifest** | ✅ Configurado | `public/manifest.json` |
| **Service Worker** | ✅ Auto-gerado | Gerado pelo next-pwa no build |
| **Ícones** | ✅ Presentes | 192x192 e 512x512 em `public/` |
| **Display Mode** | ✅ Standalone | `"display": "standalone"` |
| **prefer_related_applications** | ✅ False | Adicionado no manifest |

#### 2. Requisitos de Interação do Usuário (Chrome/Edge)

⚠️ **IMPORTANTE**: O Chrome/Edge só mostra o prompt de instalação se:

1. ✅ **Usuário clicou/tocou na página** pelo menos uma vez
2. ✅ **Usuário passou 30 segundos** visualizando a página
3. ✅ **App não está instalado** ainda

**Isso significa**: Mesmo com tudo configurado corretamente, o prompt **NÃO aparecerá imediatamente** ao abrir a página. É necessário interagir e esperar 30 segundos.

---

### Como Testar o PWA

#### Passo 1: Build de Produção

⚠️ **IMPORTANTE**: O PWA **só funciona em build de produção** (não em `npm run dev`).

```bash
# Build com Webpack (obrigatório para PWA)
npm run build:prod

# Iniciar servidor de produção
npm start
```

**Por que Webpack?** O `@ducanh2912/next-pwa` requer Webpack para gerar o service worker com Workbox. Turbopack não é compatível.

#### Passo 2: Verificar Requisitos

```bash
# Verificar se todos os requisitos estão OK
npm run check:pwa
```

**Saída esperada**:
```
🔍 Verificando requisitos do PWA...

✅ Sucesso:
  ✅ Manifest: name/short_name OK
  ✅ Manifest: start_url OK
  ✅ Manifest: display OK
  ✅ Manifest: prefer_related_applications OK
  ✅ Manifest: ícones 192x192 e 512x512 OK
  ✅ next.config.ts: next-pwa configurado
  ✅ next.config.ts: register: true OK
  ✅ Service worker gerado pelo next-pwa encontrado
  ✅ Página offline configurada
  ✅ @ducanh2912/next-pwa v10.2.9 instalado

🎉 Todos os requisitos do PWA estão OK!
```

#### Passo 3: Testar no Navegador

**Chrome/Edge (Desktop)**:

1. Abra `http://localhost:3000` (ou URL de produção com HTTPS)
2. Abra DevTools (F12) → aba **Application**
3. Verifique:
   - **Manifest**: deve mostrar nome, ícones, display mode
   - **Service Workers**: deve mostrar "activated and is running"
4. **Interaja com a página** (clique em qualquer lugar)
5. **Espere 30 segundos**
6. Verifique se aparece:
   - Ícone de instalação na barra de endereço (⊕)
   - Banner de instalação no rodapé da página

**Chrome/Edge (Mobile)**:

1. Acesse via HTTPS (não funciona com IP local sem HTTPS)
2. Interaja com a página por 30 segundos
3. Menu (⋮) → "Instalar app" ou "Adicionar à tela inicial"

**Safari (iOS)**:

⚠️ Safari não suporta `beforeinstallprompt`. Instalação manual:

1. Abra a página
2. Toque no botão Compartilhar (□↑)
3. "Adicionar à Tela de Início"

---

### Troubleshooting

#### ❌ Prompt de instalação não aparece

**Checklist**:

1. **Build de produção?**
   ```bash
   # Deve usar build:prod, não dev
   npm run build:prod && npm start
   ```

2. **HTTPS ou localhost?**
   - ✅ `https://seudominio.com`
   - ✅ `http://localhost:3000`
   - ❌ `http://192.168.1.100:3000` (IP local sem HTTPS)

3. **Service worker registrado?**
   - DevTools → Application → Service Workers
   - Deve mostrar "activated and is running"
   - Se não aparecer, verifique console por erros

4. **Manifest válido?**
   - DevTools → Application → Manifest
   - Deve mostrar todos os campos (nome, ícones, display)
   - Se aparecer erro, rode `npm run check:pwa`

5. **Interagiu por 30 segundos?**
   - Chrome/Edge exigem 30 segundos de interação
   - Clique em qualquer lugar da página
   - Espere 30 segundos

6. **App já instalado?**
   - Se já instalou antes, o prompt não aparece
   - Desinstale o app e limpe o cache
   - Chrome: chrome://apps → remover app

7. **Console mostra erros?**
   ```javascript
   // Abra console e verifique logs do PWA
   [PWA] Install status: {
     isInstallable: true,  // Deve ser true
     isInstalled: false,   // Deve ser false
     installationStatus: 'prompted',
     isSecureContext: true // Deve ser true
   }
   ```

#### ❌ Service worker não registra

**Possíveis causas**:

1. **Build não gerou o service worker**:
   ```bash
   # Verificar se existe após build
   ls -la public/sw.js
   ls -la public/workbox-*.js
   ```
   - Se não existir, o next-pwa não rodou
   - Verifique se usou `npm run build:prod` (Webpack)

2. **Service worker manual conflitando**:
   - Não deve existir `public/sw.js` versionado no git
   - O `.gitignore` ignora `**/public/sw.js`
   - Se existir, delete e faça novo build

3. **Registro manual conflitando**:
   - Não deve ter `navigator.serviceWorker.register('/sw.js')` no código
   - O next-pwa registra automaticamente com `register: true`

#### ❌ Offline não funciona

**Verificações**:

1. **Página offline existe?**
   ```bash
   # Deve existir
   ls app/offline/page.tsx
   ```

2. **Fallback configurado?**
   ```typescript
   // next.config.ts deve ter:
   fallbacks: {
     document: '/offline',
   }
   ```

3. **Testar offline**:
   - DevTools → Network → Throttling → Offline
   - Recarregar página
   - Deve mostrar página offline customizada

#### ❌ Cache não funciona

**Verificações**:

1. **Estratégias de cache configuradas?**
   - Verifique `workboxOptions.runtimeCaching` no `next.config.ts`
   - Deve ter estratégias para imagens, fonts, APIs

2. **Cache Storage no DevTools**:
   - DevTools → Application → Cache Storage
   - Deve mostrar caches: `google-fonts`, `images`, `next-static-js`, `api-cache`

3. **Limpar cache e testar novamente**:
   - DevTools → Application → Clear storage → Clear site data
   - Recarregar página
   - Verificar se caches são criados

---

### Arquitetura do PWA

```
┌─────────────────────────────────────────────────────────────┐
│                     Build Process                            │
├─────────────────────────────────────────────────────────────┤
│  npm run build:prod (Webpack)                               │
│         │                                                    │
│         ├─→ Next.js build                                   │
│         ├─→ @ducanh2912/next-pwa                            │
│         │      ├─→ Gera public/sw.js (Workbox)              │
│         │      ├─→ Gera public/workbox-*.js                 │
│         │      └─→ Injeta script de registro                │
│         └─→ Output: .next/standalone/                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Runtime (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│  1. Usuário acessa página                                   │
│  2. next-pwa registra service worker (register: true)       │
│  3. Service worker ativa e faz cache inicial                │
│  4. Workbox aplica estratégias de cache:                    │
│     - CacheFirst: imagens, fonts (cache → network)          │
│     - NetworkFirst: APIs (network → cache)                  │
│     - NetworkOnly: /api/health (sempre network)             │
│  5. Após 30s de interação:                                  │
│     - Chrome dispara 'beforeinstallprompt'                  │
│     - PWAInstallPrompt mostra banner                        │
│  6. Usuário clica "Instalar":                               │
│     - App instalado como nativo                             │
│     - Ícone na tela inicial                                 │
│     - Abre em janela standalone                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Arquivos Relacionados

| Arquivo | Descrição |
|---------|----------|
| `public/manifest.json` | Metadados do PWA (nome, ícones, display) |
| `public/sw.js` | Service worker (gerado automaticamente) |
| `public/android-chrome-*.png` | Ícones do app (192x192, 512x512) |
| `public/apple-touch-icon.png` | Ícone para iOS |
| `next.config.ts` | Configuração do next-pwa e Workbox |
| `app/layout.tsx` | Metadados PWA (manifest, icons, theme) |
| `app/offline/page.tsx` | Página mostrada quando offline |
| `components/pwa-install-prompt.tsx` | Banner de instalação |
| `hooks/use-pwa-install.ts` | Hook para gerenciar instalação |
| `lib/pwa-utils.ts` | Utilitários PWA (verificações) |
| `scripts/check-pwa.js` | Script de verificação de requisitos |

---

### Deploy em Produção

#### CapRover

**Variáveis de ambiente** (não há variáveis específicas de PWA):
```env
NODE_ENV=production
# ... outras variáveis
```

**Build**:
```bash
# O Dockerfile já usa build:prod automaticamente
docker build -t sinesys .
```

**HTTPS obrigatório**:
- CapRover fornece HTTPS automaticamente via Let's Encrypt
- Habilite "Enable HTTPS" nas configurações do app
- Redirecione HTTP → HTTPS

#### Vercel/Netlify

**Build command**:
```bash
npm run build:prod
```

**Output directory**:
```
.next
```

**HTTPS**: Automático (ambos fornecem HTTPS por padrão)

---

### Referências

- [Chrome Install Criteria](https://web.dev/articles/install-criteria) (2024-09-19)
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) (2025-11-30)
- [@ducanh2912/next-pwa Documentation](https://www.npmjs.com/@ducanh2912/next-pwa)
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)

---

## Requisito: Docker BuildKit

O Dockerfile do Sinesys usa recursos do Docker BuildKit para otimização de cache (`--mount=type=cache`). O BuildKit é necessário para builds mais rápidos e eficientes.

### Verificando se BuildKit está habilitado

```bash
# Verificar versão do Docker (BuildKit é padrão no Docker 23.0+)
docker version

# Testar se BuildKit está ativo
DOCKER_BUILDKIT=1 docker build --help | grep -i buildkit
```

### Habilitando BuildKit

**Opção 1: Variável de ambiente (temporário)**
```bash
export DOCKER_BUILDKIT=1
```

**Opção 2: Configuração do daemon (permanente)**
```bash
# Editar /etc/docker/daemon.json
sudo nano /etc/docker/daemon.json

# Adicionar:
{
  "features": {
    "buildkit": true
  }
}

# Reiniciar Docker
sudo systemctl restart docker
```

**Opção 3: CapRover (se suportado)**
- Verifique se a versão do Docker no servidor é 23.0+ (BuildKit padrão)
- Se não, configure a variável de ambiente no servidor

### Se BuildKit não estiver disponível

Se não for possível habilitar BuildKit, edite o `Dockerfile` e remova o uso de `--mount=type=cache`:

```dockerfile
# De (com BuildKit):
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --ignore-scripts --prefer-offline

# Para (sem BuildKit):
RUN npm ci --legacy-peer-deps --ignore-scripts --prefer-offline
```

> ⚠️ **Nota**: Sem BuildKit, o cache de npm não será preservado entre builds, aumentando o tempo de build.

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

O Next.js pode consumir muita memória durante o build. Soluções rápidas:

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
   💡 **Nota**: Builds simultâneos consomem mais memória. Veja "Prevenindo Múltiplos Builds Simultâneos" e "Otimização de Build e Cache Docker".
   💡 Para proteções abrangentes contra OOM, veja a seção 'Proteções Contra Out-Of-Memory (OOM)'.
   💡 **Dica**: Use `npm run build:debug-memory` para diagnosticar problemas. Veja 'Scripts de Build e Configuração do Next.js' para detalhes.

### Container reinicia constantemente

Verifique os logs no dashboard do CapRover: App > App Logs

### Browser Service não conecta

1. Verifique se o app `sinesys-browser` está rodando
2. Confirme que **WebSocket está habilitado** no app
3. Teste a conexão:
   ```bash
   curl http://srv-captain--sinesys-browser:3000/health
   ```

## Otimização de Build e Cache Docker

### Como o Cache Docker Funciona

Docker cria **layers** para cada comando no Dockerfile. Cada layer é uma imagem intermediária que é armazenada em cache. Quando você executa um build, o Docker verifica se o comando e o contexto (arquivos copiados) mudaram desde o último build. Se não mudaram, a layer é reutilizada, economizando tempo.

Mudanças em arquivos invalidam o cache de comandos subsequentes. Por exemplo, se você muda um arquivo no `COPY . .`, todas as layers depois dessa serão recriadas.

**Exemplo visual de otimização de cache:**
```
# Sem otimização (ruim):
COPY . .          # Copia tudo primeiro
RUN npm ci        # Sempre roda se qualquer arquivo mudar

# Com otimização (bom):
COPY package.json .  # Copia apenas package.json
RUN npm ci           # Só roda se package.json mudar
COPY . .             # Copia resto dos arquivos
```

### Estratégia de Cache no Sinesys

O Dockerfile do Sinesys usa uma estrutura **multi-stage** (deps → builder → runner) para otimizar o cache:

- **Stage `deps`**: Cache de dependências (reutilizado se `package.json` não mudar)
- **Stage `builder`**: Cache de build (invalidado se código mudar)
- **Stage `runner`**: Imagem final leve (~200-300MB)

O `.dockerignore` reduz o contexto de build de ~1.2GB para ~100MB, evitando que arquivos desnecessários invalidem o cache.

### Impacto de Mudanças no Cache

| Mudança | Layers invalidadas | Tempo estimado |
|---------|-------------------|----------------|
| `package.json` | deps + builder + runner | ~3-5min |
| Código-fonte | builder + runner | ~2-3min |
| Build args | builder + runner | ~2-3min |
| `.dockerignore` | tudo | ~3-5min |}

**Dica**: Evite mudar `package.json` e código no mesmo commit se possível.

### Otimizando Tempo de Build

- **Dica 1**: Faça commits atômicos (uma mudança por vez)
- **Dica 2**: Evite mudar arquivos desnecessários (use `.dockerignore`)
- **Dica 3**: Agrupe mudanças em `package.json` em commits separados
- **Dica 4**: Use build local para testar antes de push (evita builds desnecessários no servidor)
- **Dica 5**: Considere usar Docker BuildKit para cache distribuído

### Verificando Uso de Cache

Para identificar se o cache está sendo usado, leia os logs do Docker:

- **Cache hit**: `---> Using cache`
- **Cache miss**: `---> Running in ...`}

**Exemplo de log com cache:**
```
Step 4/12 : COPY package.json package-lock.json* ./
 ---> Using cache
Step 5/12 : RUN npm ci --ignore-scripts
 ---> Using cache
Step 6/12 : COPY --from=deps /app/node_modules ./node_modules
 ---> Using cache
```

**Calculando tempo economizado**: Compare o tempo total do build com/sem cache. Tipicamente, builds com cache completo levam ~1-2min vs ~4-6min sem cache.

### Troubleshooting de Cache

**Problema**: Build sempre demora mesmo sem mudanças
- **Causa**: `.dockerignore` pode estar incorreto, incluindo arquivos temporários que mudam sempre
- **Solução**: Verificar se arquivos como `.next`, `node_modules` ou logs estão sendo excluídos

**Problema**: Cache não é reutilizado após mudança pequena
- **Causa**: Mudança em arquivo que afeta uma layer anterior (ex: mudar `README.md` invalida `COPY . .`)
- **Solução**: Revisar ordem de comandos no Dockerfile ou mover arquivos não-essenciais para fora do contexto
💡 **Nota**: Para otimizações do Next.js, veja 'Scripts de Build e Configuração do Next.js'.

---

## Proteções Contra Out-Of-Memory (OOM)

### Introdução

Erros de Out-Of-Memory (OOM) ocorrem quando o Next.js build consome mais memória RAM do que está disponível no servidor. Um build típico do Next.js pode usar ~2-3GB de RAM, especialmente em projetos com muitas páginas ou componentes complexos. Quando múltiplos builds ocorrem simultaneamente (devido a webhooks duplicados), o consumo pode multiplicar, causando falhas.

### Requisitos de Memória

| Cenário | RAM Mínima | RAM Recomendada | Notas |
|---------|------------|-----------------|-------|
| Build único | 6GB | 8GB | Inclui 6GB para Node.js + 2GB para sistema |
| Build com cache | 4GB | 6GB | Builds subsequentes consomem menos |
| Múltiplos builds simultâneos | **Evitar** | **Evitar** | Configure webhook corretamente |

O `NODE_OPTIONS="--max-old-space-size=6144"` no Dockerfile limita o heap do Node.js a 6GB. O sistema operacional precisa de ~2GB adicionais para operações normais.

> ⚠️ **IMPORTANTE**: O projeto tem +150 dependências (Plate.js, CopilotKit, Supabase, etc.) e requer 6GB de heap para builds estáveis.

### Configurações do CapRover

#### Build Memory
Acesse App Configs → Build Timeout & Memory para ajustar:
- **Valor mínimo**: 6144MB (6GB) - alinhado com `NODE_OPTIONS` no Dockerfile
- **Valor recomendado**: 8192MB (8GB) para builds mais rápidos e margem de segurança

> ⚠️ **CRÍTICO**: O valor do Build Memory no CapRover **DEVE** ser igual ou maior que o valor de `NODE_OPTIONS` no Dockerfile e no script `build:caprover` (atualmente 6144MB). Se o CapRover tiver menos memória que o limite do Node.js, o build falhará com OOM.

#### Build Timeout
Recomendações baseadas no cenário:
- **Build sem cache**: 600s (10 minutos) - primeira vez ou após mudanças em dependências
- **Build com dependências novas**: 900s (15 minutos) - quando `package.json` muda

#### Instance Count
Mantenha em 1 durante o build para evitar múltiplas instâncias consumindo memória extra.

### Configuração de Swap (Servidores com RAM Limitada)

Use swap quando o servidor tiver menos de 8GB RAM física. O swap permite que o sistema use disco como memória adicional, mas torna os builds 2-3x mais lentos.

#### Quando usar swap
- Servidores com <8GB RAM física
- Builds esporádicos (não produção contínua)

#### Impacto no desempenho
- Builds ficam 2-3x mais lentos devido ao acesso ao disco
- Alto uso de swap (>50%) pode causar travamentos do sistema

#### Comandos para configurar swap
```bash
# Criar arquivo de swap de 4GB
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente (adicionar ao /etc/fstab)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/sysctl.conf
```

#### Otimizar uso de swap
```bash
# Reduzir swappiness para usar swap apenas quando necessário
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### Script de Verificação Pré-Build

Use o script `scripts/check-build-memory.sh` para verificar memória disponível antes do build:

```bash
# Verificar memória disponível antes do build
bash scripts/check-build-memory.sh
```

O script verifica:
- Memória RAM disponível
- Swap disponível
- Processos que consomem muita memória
- Recomendações baseadas no estado atual

### Troubleshooting de Erros OOM

#### Sintoma 1: Build falha com "JavaScript heap out of memory"
- **Causa**: Node.js atingiu o limite de memória (atualmente 6GB)
- **Solução**: Aumentar `NODE_OPTIONS` no Dockerfile (ex: `--max-old-space-size=8192`) **E** aumentar memória do CapRover para valor igual ou maior

#### Sintoma 2: Container é killed durante build (exit code 137)
- **Causa**: Sistema operacional matou o processo por falta de memória
- **Solução**: Adicionar swap ou aumentar RAM física do servidor

#### Sintoma 3: Build demora muito e servidor fica lento
- **Causa**: Uso excessivo de swap (>50%)
- **Solução**: Aumentar RAM física ou otimizar build para consumir menos memória

#### Sintoma 4: Múltiplos builds simultâneos causam OOM
- **Causa**: Webhooks duplicados ou configuração de auto-deploy + webhook
- **Solução**: Ver seção "Prevenindo Múltiplos Builds Simultâneos"

#### Diagnóstico via logs
- **CapRover logs**: Procure por "out of memory", "heap", "killed"
- **Comandos de diagnóstico**:
  ```bash
  # Ver uso de memória em tempo real
  free -h
  
  # Ver processos que mais consomem memória
  ps aux --sort=-%mem | head -n 10
  
  # Ver logs do sistema sobre OOM
  sudo dmesg | grep -i "out of memory"
  ```

### Alternativas para Servidores com Pouca Memória

#### Opção 1: Build em máquina externa
Use GitHub Actions ou máquina local para build e push da imagem:

```yaml
# .github/workflows/build-and-deploy.yml
name: Build and Deploy to CapRover
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t sinesys:latest .
      - name: Push to registry
        run: |
          docker tag sinesys:latest registry.example.com/sinesys:latest
          docker push registry.example.com/sinesys:latest
      - name: Deploy to CapRover
        run: |
          caprover deploy --imageName registry.example.com/sinesys:latest
```

#### Opção 2: Usar CapRover em servidor maior temporariamente
Migre temporariamente para um servidor com mais RAM durante builds.

#### Opção 3: Otimizar build para consumir menos memória
- Desabilitar source maps em produção
- Usar `experimental.cpus` no `next.config.ts` para limitar paralelismo
- Considerar build incremental com ferramentas como Turborepo

### Monitoramento de Memória

Configure alertas no CapRover para uso de memória alto. Ferramentas recomendadas:
- **Netdata**: Monitoramento em tempo real
- **Prometheus + Grafana**: Dashboards customizados

Métricas importantes:
- Uso de RAM durante build
- Uso de swap
- Tempo de build
- Número de builds simultâneos

---

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
- Aguarde a conclusão do build anterior antes de fazer push
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

| Serviço | RAM Mínima (Runtime) | RAM Recomendada (Runtime) | RAM para Build | CPU |
|---------|----------------------|---------------------------|----------------|-----|
| sinesys_app | 512MB | 1GB | 6GB (mínimo) | 1 core |
| sinesys_mcp | 128MB | 256MB | N/A | 0.5 core |
| sinesys_browser | 1GB | 2GB | N/A | 1-2 cores |

**Total recomendado para runtime**: VPS com 4GB RAM, 2-4 cores
**Total recomendado para build**: Pelo menos 8GB RAM disponível durante builds (6GB Node.js + 2GB sistema)

---

## Variáveis de Ambiente Completas

### App Principal (sinesys)

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...}

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