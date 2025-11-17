# Guia de Deploy - Portainer com Traefik

Este guia explica como fazer o deploy da aplicação Sinesys no Portainer Community Edition usando Traefik como reverse proxy.

## Pré-requisitos

1. **Portainer Community Edition** instalado e configurado
2. **Traefik** configurado e rodando como container Docker
3. **Rede Docker** chamada `traefik` criada (ou ajuste o nome no docker-compose.yml)
4. **Domínio** configurado apontando para o servidor
5. **Certificado SSL** configurado no Traefik (Let's Encrypt recomendado)

## Variáveis de Ambiente Necessárias

Antes de fazer o deploy, você precisa configurar as seguintes variáveis de ambiente:

### Obrigatórias

- `NEXT_PUBLIC_SUPABASE_URL`: URL pública do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`: Chave pública/anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave secreta do Supabase (service_role)
- `DOMAIN`: Domínio onde a aplicação estará disponível (ex: `sinesys.exemplo.com.br`)

### Opcionais

- `DEFAULT_BROWSER`: Navegador padrão para automação (`firefox` ou `chrome`) - Padrão: `firefox`
- `HEADLESS`: Executar navegador em modo headless (`true` ou `false`) - Padrão: `true`
- `SCRAPING_TIMEOUT`: Timeout para scraping em milissegundos - Padrão: `60000`

## Passo a Passo - Deploy via Portainer

### 1. Preparar o Build da Imagem

#### Opção A: Build Local e Push para Registry

```bash
# Build da imagem
docker build -t sinesys:latest .

# Tag para seu registry (se aplicável)
docker tag sinesys:latest seu-registry.com/sinesys:latest

# Push para registry
docker push seu-registry.com/sinesys:latest
```

#### Opção B: Build no Portainer

1. No Portainer, vá em **Stacks**
2. Clique em **Add stack**
3. Cole o conteúdo do arquivo `docker-compose.yml`
4. Configure as variáveis de ambiente
5. O Portainer fará o build automaticamente

### 2. Criar Stack no Portainer

1. Acesse o Portainer
2. Vá em **Stacks** no menu lateral
3. Clique em **Add stack**
4. Dê um nome para a stack (ex: `sinesys`)
5. Escolha **Web editor** ou **Upload** para o método de deploy

### 3. Configurar docker-compose.yml

#### Para Build no Portainer

Use o arquivo `docker-compose.yml` que inclui a seção `build`:

```yaml
services:
  sinesys:
    build:
      context: .
      dockerfile: Dockerfile
    # ... resto da configuração
```

#### Para Imagem Pré-construída

Use o arquivo `docker-compose.portainer.yml` que usa uma imagem pré-construída:

```yaml
services:
  sinesys:
    image: sinesys:latest
    # ... resto da configuração
```

### 4. Configurar Variáveis de Ambiente

No Portainer, você pode configurar as variáveis de ambiente de duas formas:

#### Opção A: Via Interface do Portainer

1. Na seção **Environment variables** da stack
2. Adicione cada variável:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DOMAIN`

#### Opção B: Via Arquivo .env

1. Crie um arquivo `.env` com as variáveis
2. No Portainer, use a opção **Environment file** e faça upload do arquivo

**Exemplo de .env:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
DOMAIN=sinesys.exemplo.com.br
```

### 5. Verificar Configuração do Traefik

Certifique-se de que:

1. **Rede Traefik existe**: O Traefik deve estar rodando e a rede `traefik` deve existir
2. **Labels corretas**: As labels do Traefik no docker-compose.yml estão corretas
3. **Entrypoints configurados**: O Traefik deve ter os entrypoints `web` e `websecure` configurados
4. **Certificado SSL**: O certificado resolver `letsencrypt` deve estar configurado no Traefik

### 6. Ajustar Labels do Traefik (se necessário)

Se sua configuração do Traefik for diferente, ajuste as labels:

#### Se usar outro nome de rede:

```yaml
labels:
  - "traefik.docker.network=seu-nome-de-rede"
```

#### Se usar outro certificado resolver:

```yaml
labels:
  - "traefik.http.routers.sinesys.tls.certresolver=seu-resolver"
```

#### Se usar entrypoints diferentes:

```yaml
labels:
  - "traefik.http.routers.sinesys.entrypoints=seu-entrypoint-https"
  - "traefik.http.routers.sinesys-http.entrypoints=seu-entrypoint-http"
```

### 7. Deploy da Stack

1. Clique em **Deploy the stack**
2. Aguarde o build e inicialização do container
3. Verifique os logs em **Logs** para garantir que tudo está funcionando

### 8. Verificar Health Check

A aplicação tem um health check configurado. Você pode verificar o status em:

- **Portainer**: Vá em **Containers** e verifique o status do health check
- **Endpoint**: `http://localhost:3000/api/health` (se exposto internamente)

### 9. Acessar a Aplicação

Após o deploy bem-sucedido, acesse a aplicação através do domínio configurado:

```
https://seu-dominio.com.br
```

## Troubleshooting

### Container não inicia

1. Verifique os logs: `docker logs sinesys`
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Verifique se a porta 3000 não está em uso

### Traefik não roteia corretamente

1. Verifique se o container está na rede `traefik`
2. Verifique se as labels do Traefik estão corretas
3. Verifique os logs do Traefik: `docker logs traefik`

### Erro de conexão com Supabase

1. Verifique se as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` estão corretas
2. Verifique se o Supabase está acessível do servidor
3. Verifique se não está usando `service_role` key no frontend

### Playwright/Firefox não funciona

1. Verifique se todas as dependências do sistema foram instaladas no Dockerfile
2. Se necessário, ajuste as variáveis `HEADLESS` e `DEFAULT_BROWSER`
3. Verifique os logs para erros específicos do Playwright

## Estrutura de Arquivos

```
.
├── Dockerfile                 # Dockerfile multi-stage
├── docker-compose.yml         # Compose para build local
├── docker-compose.portainer.yml  # Compose para Portainer (imagem pré-construída)
├── .dockerignore              # Arquivos ignorados no build
├── .env.example              # Exemplo de variáveis de ambiente
└── DEPLOY.md                 # Este arquivo
```

## Atualizações

Para atualizar a aplicação:

1. Faça pull das alterações do código
2. Rebuild da imagem (se necessário)
3. No Portainer, vá em **Stacks** > **sinesys** > **Editor**
4. Clique em **Update the stack**
5. Aguarde o redeploy

## Segurança

⚠️ **Importante:**

- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend
- Use apenas `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` no frontend
- Mantenha as variáveis de ambiente seguras
- Use HTTPS sempre (configurado via Traefik)
- Revise as políticas RLS no Supabase regularmente

## Suporte

Para problemas específicos:

1. Verifique os logs do container: `docker logs sinesys`
2. Verifique os logs do Traefik: `docker logs traefik`
3. Consulte a documentação do [Portainer](https://docs.portainer.io/)
4. Consulte a documentação do [Traefik](https://doc.traefik.io/traefik/)

