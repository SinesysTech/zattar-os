# 🚀 Guia de Deploy - CapRover com Webhook do GitHub

Este guia explica como fazer o deploy da aplicação Sinesys no CapRover utilizando webhooks do GitHub para deploy automático.

## Pré-requisitos

1. **CapRover** instalado e configurado em seu servidor
2. **GitHub Repository** com o código da aplicação
3. **Domínio** configurado apontando para o CapRover
4. **Certificado SSL** (o CapRover gera automaticamente via Let's Encrypt)

## Arquivos de Configuração

O projeto já está configurado com os arquivos necessários:

```
.
├── captain-definition        # Configuração do CapRover
├── Dockerfile               # Build multi-stage para Next.js + Playwright
└── next.config.ts           # Configuração Next.js com output: 'standalone'
```

### captain-definition

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

Este arquivo indica ao CapRover para usar o Dockerfile existente para construir a imagem.

## Passo a Passo - Configuração no CapRover

### 1. Criar a Aplicação no CapRover

1. Acesse o painel do CapRover (`https://captain.seu-dominio.com`)
2. Vá em **Apps**
3. Clique em **Create a New App**
4. Configure:
   - **App Name**: `sinesys` (ou nome de sua preferência)
   - **Has Persistent Data**: Deixe desmarcado (não é necessário para esta aplicação)
5. Clique em **Create New App**

### 2. Configurar Variáveis de Ambiente

Após criar a aplicação, vá na aba **App Configs** e adicione as variáveis de ambiente:

#### Variáveis Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Chave pública/anônima do Supabase | `eyJxxxxx` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (secreta) | `eyJxxxxx` |

#### Variáveis Opcionais

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DEFAULT_BROWSER` | Navegador para automação | `firefox` |
| `HEADLESS` | Modo headless do navegador | `true` |
| `SCRAPING_TIMEOUT` | Timeout de scraping (ms) | `60000` |

#### Variáveis de Cache (Redis)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `ENABLE_REDIS_CACHE` | Habilitar cache Redis | `true` |
| `REDIS_URL` | URL de conexão Redis | `redis://host:6379` |
| `REDIS_PASSWORD` | Senha do Redis (se houver) | `sua-senha` |
| `REDIS_CACHE_TTL` | TTL padrão do cache (segundos) | `600` |

#### Variáveis MongoDB

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `MONGODB_URL` | URL de conexão MongoDB | `mongodb://host:27017` |
| `MONGODB_DATABASE` | Nome do database | `sinesys` |

#### Variáveis 2FAuth (Automação PJE)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `TWOFAUTH_API_URL` | URL da API 2FAuth | `https://2fauth.exemplo.com/api` |
| `TWOFAUTH_API_TOKEN` | Token de autenticação | `seu-token` |
| `TWOFAUTH_ACCOUNT_ID` | ID da conta 2FA | `123` |

### 3. Configurar HTTPS

1. Na aba **HTTP Settings** da aplicação
2. Habilite **Enable HTTPS**
3. Clique em **Force HTTPS** para redirecionar HTTP para HTTPS
4. O CapRover irá automaticamente gerar o certificado SSL via Let's Encrypt

### 4. Configurar Porta

O Dockerfile já expõe a porta 3000. Verifique em **HTTP Settings**:
- **Container HTTP Port**: `3000`

### 5. Configurar Domínio Customizado (Opcional)

Se quiser usar um domínio customizado:

1. Na aba **HTTP Settings**
2. Em **Custom Domains**, adicione seu domínio (ex: `sinesys.seu-dominio.com`)
3. Configure o DNS do domínio apontando para o IP do CapRover
4. Clique em **Enable HTTPS** para o domínio customizado

## Deploy via GitHub Webhook

### 1. Obter a URL do Webhook

1. No CapRover, vá na aplicação `sinesys`
2. Na aba **Deployment**, seção **Method 3: Deploy from Github/Gitlab/Bitbucket**
3. Copie a **Webhook URL** (formato: `https://captain.seu-dominio.com/api/webhooks/[app-name]?namespace=captain&token=[app-token]`)

### 2. Configurar Webhook no GitHub

1. No repositório GitHub, vá em **Settings** > **Webhooks**
2. Clique em **Add webhook**
3. Configure:
   - **Payload URL**: Cole a URL do webhook copiada do CapRover
   - **Content type**: `application/json`
   - **Secret**: Deixe em branco (a autenticação é via token na URL)
   - **SSL verification**: Habilite se seu CapRover tem SSL válido
   - **Which events would you like to trigger this webhook?**: 
     - Selecione **Just the push event**
     - Ou configure eventos específicos como **Releases** para deploy apenas em releases
4. Clique em **Add webhook**

### 3. Configurar Branch de Deploy (Opcional)

Por padrão, o CapRover faz deploy de qualquer push. Para limitar a branches específicas:

1. No CapRover, na aba **Deployment**
2. Procure por **Git Branch** ou configure via variável de ambiente
3. Defina a branch que deseja monitorar (ex: `main`, `production`)

## Deploy Manual

Caso prefira fazer deploy manual:

### Via Interface do CapRover

1. Vá na aplicação > aba **Deployment**
2. Em **Method 2: Tarball**, faça upload de um arquivo `.tar` do projeto
3. Ou use **Method 4: Deploy via CLI**

### Via CLI do CapRover

```bash
# Instalar CLI do CapRover
npm install -g caprover

# Login no servidor
caprover login

# Deploy
caprover deploy
```

## Configurações de Performance

### Memória e CPU

Na aba **App Configs** > **Instance Settings**:
- **Memory Limit**: Recomendado `2GB` ou mais (devido ao Playwright/Firefox)
- **CPU Limit**: Ajuste conforme necessário

### Replicas

Para alta disponibilidade:
- **Number of Replicas**: Configure conforme necessidade (1 para início)

## Health Check

A aplicação possui endpoint de health check em `/api/health`. Configure no CapRover:

1. Na aba **App Configs**
2. Em **Service Settings** ou **Health Check**:
   - **Health Check Path**: `/api/health`
   - **Health Check Port**: `3000`

## Troubleshooting

### Build Falha

1. Verifique os logs de build no CapRover (aba **Deployment** > **Logs**)
2. Certifique-se de que todas as dependências estão no `package.json`
3. Verifique se o Dockerfile está correto

### Container não inicia

1. Verifique os logs da aplicação (aba **Logs**)
2. Confirme que todas as variáveis de ambiente obrigatórias estão configuradas
3. Verifique se há memória suficiente no servidor

### Erro de conexão Supabase

1. Verifique se `NEXT_PUBLIC_SUPABASE_URL` está correto
2. Confirme que a chave anônima está correta
3. Verifique se o Supabase está acessível do servidor

### Playwright/Firefox não funciona

1. O Dockerfile já inclui todas as dependências necessárias
2. Verifique se há memória suficiente (mínimo 2GB recomendado)
3. Confirme que `HEADLESS=true` está configurado

### Webhook não funciona

1. Verifique se a URL do webhook está correta
2. Confirme que o repositório tem acesso ao servidor CapRover
3. Verifique os logs de webhook no GitHub (Settings > Webhooks > Recent Deliveries)

## Estrutura de Arquivos de Deploy

```
.
├── captain-definition           # Configuração do CapRover
├── Dockerfile                   # Build multi-stage para Next.js
├── .dockerignore               # Arquivos ignorados no build
├── docker-compose.yml          # Para desenvolvimento local
├── docker-compose.portainer.yml # Para deploy no Portainer
└── docs/deploy/
    ├── DEPLOY.md               # Guia para Portainer
    ├── CAPROVER-DEPLOY.md      # Este arquivo
    └── VARIAVEIS-AMBIENTE.md   # Guia de variáveis
```

## Referências

- [Documentação do CapRover](https://caprover.com/docs/)
- [GitHub Webhooks](https://docs.github.com/en/webhooks)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)

## Suporte

Para problemas específicos:

1. Verifique os logs da aplicação no CapRover
2. Consulte a [documentação do CapRover](https://caprover.com/docs/)
3. Verifique a aba **Troubleshooting** acima

