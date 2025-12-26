# Configuração Multi-Domínio no CapRover

Este documento explica como configurar múltiplos domínios para o mesmo app Next.js no CapRover.

## 🎯 Arquitetura

Três domínios apontam para o mesmo container Docker/app Next.js:

- **app.zattaradvogados.com** → Dashboard (rotas padrão `/`)
- **zattaradvogados.com** → Site institucional (rotas `/website/*`)
- **meuprocesso.zattaradvogados.com** → Portal do cliente (rotas `/meu-processo/*`)

## 📝 Passo a Passo

### 1. Configurar DNS

Certifique-se de que todos os 3 domínios estão apontando para o servidor CapRover:

```
app.zattaradvogados.com         → A record para IP do servidor
zattaradvogados.com             → A record para IP do servidor
meuprocesso.zattaradvogados.com → A record para IP do servidor
```

### 2. Adicionar Domínios no CapRover

1. Acesse a dashboard do CapRover
2. Entre no seu app
3. Na seção **HTTP Settings**:
   - Digite `app.zattaradvogados.com` no campo "Connect New Domain"
   - Clique em "Connect New Domain"
   - Clique em "Enable HTTPS" para obter certificado SSL
   - Repita para os outros 2 domínios:
     - `zattaradvogados.com`
     - `meuprocesso.zattaradvogados.com`

**IMPORTANTE:** Você **NÃO precisa modificar a configuração do Nginx**. O CapRover cria automaticamente um server block para cada domínio adicionado.

### 3. Configurar Variáveis de Ambiente

No **CapRover Dashboard** > Seu App > **App Configs** > **Environment Variables**, adicione:

```bash
NEXT_PUBLIC_DASHBOARD_URL=https://app.zattaradvogados.com
NEXT_PUBLIC_WEBSITE_URL=https://zattaradvogados.com
NEXT_PUBLIC_MEU_PROCESSO_URL=https://meuprocesso.zattaradvogados.com
NODE_ENV=production
```

Essas variáveis são usadas pelo middleware para detectar qual app está sendo acessado.

### 4. Deploy

Faça o deploy da sua imagem Docker normalmente. O middleware detectará automaticamente o domínio e roteará para o conteúdo correto.

## 🔧 Como Funciona

### Detecção de Domínio (Middleware)

O arquivo [middleware.ts](middleware.ts) intercepta todas as requisições e:

1. **Detecta o domínio** via header `host`
2. **Identifica o app** comparando com as variáveis de ambiente
3. **Aplica roteamento:**
   - Site institucional → Reescreve URL para `/website/*`
   - Portal do cliente → Reescreve URL para `/meu-processo/*`
   - Dashboard → Mantém rotas padrão

```typescript
// Exemplo: zattaradvogados.com/sobre
// Middleware reescreve para: /website/sobre
if (domain === 'zattaradvogados.com') {
  url.pathname = `/website${pathname}`;
  return NextResponse.rewrite(url);
}
```

### Proxy Reverso (CapRover/Nginx)

O CapRover gerencia automaticamente o proxy reverso:

```nginx
# CapRover cria automaticamente para cada domínio:
server {
  listen 443 ssl;
  server_name app.zattaradvogados.com;

  location / {
    proxy_pass http://seu-app:3000;
    proxy_set_header Host $host;
  }
}

server {
  listen 443 ssl;
  server_name zattaradvogados.com;

  location / {
    proxy_pass http://seu-app:3000;
    proxy_set_header Host $host;
  }
}

# E assim por diante para cada domínio...
```

## ✅ Verificação

Após configurar, teste cada domínio:

1. **https://app.zattaradvogados.com** → Deve abrir o dashboard
2. **https://zattaradvogados.com** → Deve abrir o site institucional
3. **https://meuprocesso.zattaradvogados.com** → Deve abrir o portal do cliente

## 🐛 Troubleshooting

### Problema: "Cannot GET /"

**Causa:** O domínio foi adicionado no CapRover mas as variáveis de ambiente não foram configuradas.

**Solução:** Adicione as variáveis `NEXT_PUBLIC_*_URL` e faça redeploy.

### Problema: Domínio não resolve

**Causa:** DNS não está apontando corretamente.

**Solução:** Verifique se o registro A do domínio aponta para o IP do servidor CapRover.

### Problema: Certificado SSL não funciona

**Causa:** CapRover não conseguiu obter certificado Let's Encrypt.

**Solução:**
- Verifique se o domínio está apontando corretamente
- Aguarde alguns minutos (pode demorar para propagar)
- Tente clicar em "Enable HTTPS" novamente

## 🔧 Configuração Nginx no CapRover

### Você NÃO precisa modificar o template Nginx

O template padrão do CapRover já está configurado corretamente para roteamento multi-domínio. Os headers importantes já estão incluídos:

```nginx
proxy_set_header Host $host;                           # Preserva o domínio original
proxy_set_header X-Real-IP $remote_addr;               # IP real do cliente
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;            # http ou https
```

**O header `Host` é ESSENCIAL** porque permite que o middleware Next.js detecte qual domínio foi acessado.

### Configurações Opcionais (se necessário)

Se você precisar ajustar algo, acesse **App > Edit Default Nginx Configurations**:

#### 1. Aumentar o tamanho máximo de upload (se necessário)

O padrão é `500m`. Se você precisa enviar arquivos maiores:

```nginx
client_max_body_size 1000m;  # Aumenta para 1GB
```

#### 2. Habilitar WebSocket (se necessário)

No dashboard do CapRover, marque a opção **"Websocket Support"** na seção HTTP Settings. Isso adiciona automaticamente:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_http_version 1.1;
```

#### 3. Ajustar timeouts (se tiver requisições longas)

Se você tem requisições que demoram muito (ex: processamento de PDFs, scraping):

```nginx
proxy_read_timeout 300s;       # Timeout de leitura (padrão 60s)
proxy_connect_timeout 300s;    # Timeout de conexão
proxy_send_timeout 300s;       # Timeout de envio
```

### Validação da Configuração

Após adicionar os domínios, você pode verificar a configuração final do Nginx:

1. Acesse o servidor via SSH
2. Entre no container CapRover:
```bash
docker exec -it $(docker ps -q -f name=captain-captain) bash
```

3. Visualize a configuração compilada:
```bash
cat /captain/generated/nginx/conf.d/captain.conf
```

Você verá um `server` block para cada domínio adicionado.

## 📚 Referências

- [CapRover - App Configuration](https://caprover.com/docs/app-configuration.html)
- [CapRover - NGINX Customization](https://caprover.com/docs/nginx-customization.html)
- [Next.js - Multi-Domain Setup (GitHub Example)](https://github.com/leerob/nextjs-multiple-domains)
- [Next.js - Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## 🔐 Segurança

- Todos os domínios usam HTTPS via Let's Encrypt (gerenciado automaticamente pelo CapRover)
- O middleware valida autenticação para cada app:
  - **Dashboard:** Requer autenticação Supabase
  - **Meu Processo:** Requer cookie de sessão CPF
  - **Website:** Público (sem autenticação)
