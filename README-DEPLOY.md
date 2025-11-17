# 📦 Arquivos de Deploy - Portainer + Traefik

Este diretório contém todos os arquivos necessários para fazer o deploy da aplicação Sinesys no Portainer Community Edition usando Traefik como reverse proxy.

## 📋 Arquivos Criados

### Arquivos Principais

1. **`Dockerfile`**
   - Dockerfile multi-stage otimizado para Next.js
   - Inclui suporte ao Playwright/Firefox
   - Build otimizado com output standalone
   - Executa como usuário não-root para segurança

2. **`docker-compose.yml`**
   - Arquivo compose para build local
   - Inclui todas as labels do Traefik
   - Configurado para Portainer Community Edition

3. **`docker-compose.portainer.yml`**
   - Versão alternativa usando imagem pré-construída
   - Útil quando você já tem a imagem buildada

4. **`.dockerignore`**
   - Arquivos e diretórios ignorados no build
   - Otimiza o tamanho da imagem Docker

5. **`env.example.txt`**
   - Exemplo de variáveis de ambiente necessárias
   - Copie para `.env` e preencha com seus valores

6. **`DEPLOY.md`**
   - Documentação completa do processo de deploy
   - Guia passo a passo para Portainer
   - Troubleshooting e dicas

### Arquivos de Configuração Atualizados

1. **`next.config.ts`**
   - Habilitado `output: 'standalone'` para Docker

2. **`app/api/health/route.ts`**
   - Endpoint de health check para Docker
   - Usado pelo healthcheck do container

## 🚀 Quick Start

### 1. Configure as Variáveis de Ambiente

Copie `env.example.txt` para `.env` e preencha:

```bash
cp env.example.txt .env
```

Edite o `.env` com suas credenciais do Supabase e domínio.

### 2. Build da Imagem (Opcional)

Se quiser fazer build local antes:

```bash
docker build -t sinesys:latest .
```

### 3. Deploy no Portainer

1. Acesse o Portainer
2. Vá em **Stacks** > **Add stack**
3. Cole o conteúdo de `docker-compose.yml` ou `docker-compose.portainer.yml`
4. Configure as variáveis de ambiente
5. Clique em **Deploy the stack**

## 📝 Variáveis de Ambiente Obrigatórias

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`: Chave pública/anônima
- `SUPABASE_SERVICE_ROLE_KEY`: Chave secreta (service_role)
- `DOMAIN`: Domínio onde a aplicação estará disponível

## 🔧 Requisitos

- Portainer Community Edition instalado
- Traefik configurado e rodando
- Rede Docker `traefik` criada
- Domínio configurado apontando para o servidor
- Certificado SSL configurado no Traefik

## 📚 Documentação Completa

Consulte o arquivo `DEPLOY.md` para documentação detalhada, troubleshooting e exemplos avançados.

## 🔒 Segurança

⚠️ **Importante:**
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend
- Use apenas `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` no frontend
- Mantenha as variáveis de ambiente seguras
- Use HTTPS sempre (configurado via Traefik)

## 🆘 Suporte

Para problemas:
1. Verifique os logs: `docker logs sinesys`
2. Consulte `DEPLOY.md` para troubleshooting
3. Verifique a documentação do [Portainer](https://docs.portainer.io/)
4. Verifique a documentação do [Traefik](https://doc.traefik.io/traefik/)

