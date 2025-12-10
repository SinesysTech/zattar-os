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

## Deploy no CapRover (via Imagem Docker)

O deploy do Sinesys no CapRover é feito utilizando **imagens Docker pré-construídas via GitHub Actions**, evitando builds no servidor de produção e garantindo deploys mais rápidos e confiáveis.

### Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions                            │
│  1. Push na branch master/main                              │
│  2. Build da imagem Docker                                  │
│  3. Push para Docker Hub                                    │
│  4. Trigger deploy no CapRover (webhook)                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Docker Hub                              │
│  sinesystec/sinesys:latest                                  │
│  sinesystec/sinesys:abc1234 (SHA)                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      CapRover                                │
│  Pull imagem → Deploy → Restart container                   │
└─────────────────────────────────────────────────────────────┘
```

### Pré-requisitos

- CapRover instalado e configurado
- Acesso ao dashboard do CapRover
- Conta no Docker Hub (para armazenar imagens)
- GitHub Actions configurado (já incluído no repositório)

### Passo 1: Criar os Apps no CapRover

Acesse o dashboard do CapRover e crie **3 apps**:

| Nome do App | Descrição | HTTP Port | WebSocket |
|-------------|-----------|-----------|-----------|
| `sinesys` | App principal (Next.js) | 3000 | ❌ |
| `sinesys-mcp` | MCP Server | 3001 | ❌ |
| `sinesys-browser` | Firefox para scraping | 3000 | ✅ |

> ⚠️ **Importante**: Habilite WebSocket Support apenas para `sinesys-browser`!

### Passo 2: Configurar GitHub Secrets

No repositório do GitHub, vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret | Descrição | Exemplo |
|--------|-----------|------|
| `DOCKERHUB_USERNAME` | Username do Docker Hub | `sinesystec` |
| `DOCKERHUB_TOKEN` | Access Token do Docker Hub | `dckr_pat_xxx` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key do Supabase | `eyJ...` |
| `CAPROVER_SERVER` | URL do CapRover | `https://captain.seudominio.com` |
| `CAPROVER_APP_TOKEN` | Token do app (opcional) | Ver passo 3 |

> 💡 **Dica**: Para criar um Docker Hub Access Token, acesse Docker Hub → Account Settings → Security → New Access Token

### Passo 3: Deploy Automático (Recomendado)

**No CapRover:**

1. Acesse **Apps → sinesys → Deployment**
2. Role até **App Webhooks**
3. Habilite **Enable App Token**
4. Copie o token gerado
5. Adicione como secret `CAPROVER_APP_TOKEN` no GitHub

**Resultado**: A cada push na branch `master` ou `main`, o GitHub Actions:
- Faz build da imagem
- Envia para Docker Hub
- Dispara deploy automático no CapRover

### Passo 4: Deploy Manual (Alternativa)

Se não configurou o deploy automático:

1. Aguarde o GitHub Actions completar (veja na aba **Actions** do repositório)
2. No CapRover, acesse **Apps → sinesys → Deployment**
3. Na seção **Deploy via ImageName**, insira:
   ```
   sinesystec/sinesys:latest
   ```
4. Clique em **Deploy**

### Passo 5: Configurar Variáveis de Ambiente

No dashboard do CapRover, vá em **Apps → sinesys → App Configs → Environmental Variables**:

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

### Passo 6: Deploy dos Outros Serviços

**Browser Service (sinesys-browser):**
```env
PORT=3000
BROWSER_TOKEN=seu_token_opcional
```
- Container HTTP Port: `3000`
- WebSocket Support: ✅ **Habilitar**
- Memory: 2048MB (mínimo)

**MCP Server (sinesys-mcp):**
```env
NODE_ENV=production
PORT=3001
SINESYS_API_URL=http://srv-captain--sinesys:3000
SINESYS_API_KEY=sua_api_key
```

### Passo 7: Configurar Domínios e HTTPS

No dashboard do CapRover:

| App | Domínio | HTTPS |
|-----|---------|-------|
| sinesys | app.seudominio.com.br | ✅ |
| sinesys-mcp | mcp.seudominio.com.br (opcional) | ✅ |
| sinesys-browser | (não expor) | — |

### Vantagens do Deploy via GitHub Actions + Docker Hub

| Aspecto | Build no CapRover | Deploy via Imagem (GitHub Actions) |
|---------|-------------------|------------------------------------|
| **Tempo de deploy** | ~5-10 min | ~30 seg |
| **Uso de memória no servidor** | 6-8 GB durante build | Apenas runtime (~512MB) |
| **Risco de OOM** | Alto | Nenhum |
| **Consistência** | Depende do servidor | Imagem idêntica sempre |
| **Rollback** | Rebuild necessário | Trocar tag da imagem |
| **Build acontece** | No CapRover | No GitHub Actions |
| **Custo do servidor** | Precisa mais RAM | Servidor menor e mais barato |

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

## Scripts de Build

> ⚠️ **IMPORTANTE**: O build é feito automaticamente pelo **GitHub Actions**, não no CapRover.

### Scripts Disponíveis

O projeto possui diferentes scripts de build para diferentes cenários:

| Script | Comando | Uso | Onde executa |
|--------|---------|-----|-------------|
| `build:caprover` | `next build --webpack` | **Produção (GitHub Actions)** | GitHub Actions |
| `build:prod` | `next build --webpack` | Build local de produção | Local/CI |
| `build` | `next build --turbopack` | Desenvolvimento local | Local |
| `analyze` | `node scripts/run-analyze.js` | Análise de bundle | Local |

**Por que Webpack em produção?**
- O plugin PWA `@ducanh2912/next-pwa` requer Webpack para gerar corretamente o service worker e assets offline.
- Garante compatibilidade total com a configuração `withPWA(...)` em `next.config.ts`.
- Turbopack permanece disponível para desenvolvimento local.

### Configurações de Build

O `next.config.ts` inclui otimizações para redução de tamanho da imagem:

**1. Source Maps desabilitados:**
```typescript
productionBrowserSourceMaps: false,  // Economiza ~500MB
experimental: {
  serverSourceMaps: false,           // Reduz tamanho da imagem
}
```

**2. Output Standalone:**
```typescript
output: 'standalone',  // Gera build otimizado para Docker (~200-300MB)
```

**Trade-offs:**
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

## Build Args vs Environment Variables

### Build Args (tempo de build)
Usados apenas durante `docker build` (na máquina local ou CI):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

> **Por quê?** Variáveis `NEXT_PUBLIC_*` são "inlined" no código durante o build do Next.js.

### Environment Variables (runtime)
Configuradas no CapRover e usadas quando o container está rodando:
- `SUPABASE_SECRET_KEY`
- `BROWSER_WS_ENDPOINT`
- `REDIS_URL`
- etc.

---

## Troubleshooting

### Build local falha com OOM (Out of Memory)

O Next.js pode consumir muita memória durante o build. Soluções:

1. **Aumentar memória do Docker Desktop** (Windows/Mac):
   - Docker Desktop → Settings → Resources → Memory
   - Aumente para 6-8GB

2. **Usar script de debug de memória**:
   ```bash
   npm run build:debug-memory
   ```

3. **Verificar recursos disponíveis**:
   ```bash
   # Linux/Mac
   free -h

   # Windows PowerShell
   Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10
   ```

> 💡 **Dica**: O build requer ~6GB de RAM. Se sua máquina tem menos, considere usar GitHub Actions para build.

### Container reinicia constantemente

Verifique os logs no dashboard do CapRover: App > App Logs

### Browser Service não conecta

1. Verifique se o app `sinesys-browser` está rodando
2. Confirme que **WebSocket está habilitado** no app
3. Teste a conexão:
   ```bash
   curl http://srv-captain--sinesys-browser:3000/health
   ```

### Deploy via imagem falha

1. **Verifique se a imagem existe no registry**:
   ```bash
   docker pull seu-registry/sinesys:latest
   ```

2. **Verifique credenciais do registry no CapRover**:
   - Dashboard → Cluster → Docker Registry Configuration

3. **Verifique logs do CapRover**:
   - App → App Logs ou Build Logs

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

## Requisitos de Memória para Build Local

> **Nota**: Como o deploy é feito via imagem Docker pré-construída, o build ocorre na máquina local ou no CI (GitHub Actions), não no servidor de produção.

| Cenário | RAM Mínima | RAM Recomendada |
|---------|------------|-----------------|
| Build local (Docker Desktop) | 6GB | 8GB |
| Build no CI (GitHub Actions) | Automático | runners-large |

O `NODE_OPTIONS="--max-old-space-size=6144"` no Dockerfile limita o heap do Node.js a 6GB.

> ⚠️ **IMPORTANTE**: O projeto tem +150 dependências e requer 6GB de heap para builds estáveis.

---

## Recursos Recomendados (Servidor de Produção)

| Serviço | RAM Mínima | RAM Recomendada | CPU |
|---------|------------|-----------------|-----|
| sinesys_app | 512MB | 1GB | 1 core |
| sinesys_mcp | 128MB | 256MB | 0.5 core |
| sinesys_browser | 1GB | 2GB | 1-2 cores |

**Total recomendado**: VPS com 4GB RAM, 2-4 cores

> 💡 **Vantagem**: Como não há builds no servidor, a RAM é usada apenas para runtime, permitindo servidores menores e mais baratos.

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