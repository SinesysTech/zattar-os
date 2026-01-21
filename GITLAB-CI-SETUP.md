# Configuração GitLab CI/CD - Zattar Advogados App

Este guia explica como configurar o GitLab CI/CD para automatizar o build e deploy da aplicação.

## Visão Geral

O pipeline GitLab CI/CD configurado irá:

1. Executar lint e verificações de qualidade do código
2. Rodar testes unitários e de integração
3. Fazer build da aplicação Next.js
4. Criar e publicar imagem Docker no GitLab Container Registry
5. Disponibilizar imagem pronta para deploy

## Passo 1: Configurar o Repositório no GitLab

### 1.1 Criar/Migrar Repositório

Se você ainda não tem o projeto no GitLab:

```bash
# Adicionar remote do GitLab
git remote add gitlab https://gitlab.com/seu-usuario/zattar-advogados-app.git

# Ou se já existe, atualizar a URL
git remote set-url gitlab https://gitlab.com/seu-usuario/zattar-advogados-app.git

# Push para o GitLab
git push gitlab master
```

### 1.2 Habilitar Container Registry

1. Acesse seu projeto no GitLab
2. Vá em **Settings** → **General** → **Visibility, project features, permissions**
3. Certifique-se de que **Container Registry** está habilitado

## Passo 2: Configurar Variáveis de Ambiente (CI/CD Variables)

As variáveis de ambiente são necessárias para o build da aplicação. Configure-as no GitLab:

1. Acesse seu projeto no GitLab
2. Vá em **Settings** → **CI/CD** → **Variables**
3. Clique em **Add variable** e adicione as seguintes variáveis:

### Variáveis Obrigatórias:

| Variável | Tipo | Protected | Masked | Valor |
|----------|------|-----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Variable | ✓ | ✗ | URL do seu projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Variable | ✓ | ✓ | Chave pública/anon do Supabase |

### Variáveis Automáticas do GitLab (não precisa adicionar):

Estas variáveis são fornecidas automaticamente pelo GitLab:
- `CI_REGISTRY` - URL do Container Registry
- `CI_REGISTRY_USER` - Usuário para login no registry
- `CI_REGISTRY_PASSWORD` - Token de acesso ao registry
- `CI_REGISTRY_IMAGE` - Nome completo da imagem
- `CI_COMMIT_SHORT_SHA` - Hash curto do commit
- `CI_COMMIT_REF_SLUG` - Nome da branch formatado

## Passo 3: Como Obter as Credenciais do Supabase

### 3.1 Acessar o Dashboard do Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto Zattar Advogados

### 3.2 Obter as Variáveis

1. No menu lateral, clique em **Settings** (ícone de engrenagem)
2. Vá para **API**
3. Você verá:
   - **Project URL**: Use este valor para `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: Use este valor para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

## Passo 4: Fazer o Primeiro Commit

Agora que tudo está configurado, faça um commit para disparar o pipeline:

```bash
# Adicionar os arquivos de CI/CD
git add .gitlab-ci.yml

# Fazer commit
git commit -m "ci: configure GitLab CI/CD pipeline with Docker build"

# Push para disparar o pipeline
git push gitlab master
```

## Passo 5: Acompanhar o Pipeline

### 5.1 Visualizar Pipeline

1. No GitLab, vá para **CI/CD** → **Pipelines**
2. Você verá o pipeline em execução
3. Clique no pipeline para ver detalhes de cada job

### 5.2 Stages do Pipeline

O pipeline tem 4 stages:

1. **lint** (2-3 minutos)
   - Verifica qualidade do código
   - Executa type-check
   - Valida arquitetura

2. **test** (3-5 minutos)
   - Testes unitários
   - Testes de integração
   - Security scan

3. **build** (5-10 minutos)
   - Build da aplicação Next.js
   - Gera artefatos otimizados

4. **docker** (10-15 minutos)
   - Cria imagem Docker
   - Publica no GitLab Container Registry

### 5.3 Verificar Imagem Criada

Após o pipeline completar com sucesso:

1. Vá para **Packages and registries** → **Container Registry**
2. Você verá as imagens criadas com as tags:
   - `latest` - Última versão de qualquer branch
   - `master` ou `main` - Última versão da branch principal
   - `production` - Tag específica para produção
   - `<commit-sha>` - Tag específica do commit

## Passo 6: Usar a Imagem Docker

### 6.1 Pull da Imagem

```bash
# Login no GitLab Container Registry
docker login registry.gitlab.com

# Pull da imagem
docker pull registry.gitlab.com/seu-usuario/zattar-advogados-app:latest
```

### 6.2 Executar Localmente

```bash
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=sua-url \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua-chave \
  registry.gitlab.com/seu-usuario/zattar-advogados-app:latest
```

### 6.3 Deploy em Servidor

A imagem pode ser usada em qualquer ambiente que suporte Docker:

- **Docker Compose**
- **Kubernetes**
- **Docker Swarm**
- **CapRover**
- **Portainer**

Exemplo com Docker Compose:

```yaml
version: '3.8'
services:
  app:
    image: registry.gitlab.com/seu-usuario/zattar-advogados-app:latest
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${SUPABASE_KEY}
    restart: unless-stopped
```

## Estrutura do Pipeline

### Arquivos Importantes

- [.gitlab-ci.yml](.gitlab-ci.yml) - Configuração do pipeline CI/CD
- [Dockerfile](Dockerfile) - Instruções para build da imagem Docker
- [.dockerignore](.dockerignore) - Arquivos ignorados no contexto Docker

### Cache e Otimizações

O pipeline utiliza várias otimizações:

1. **Cache do npm**: `node_modules` são cacheados entre builds
2. **Cache do Next.js**: `.next/cache` é cacheado para builds incrementais
3. **Docker layer cache**: Layers anteriores são reutilizadas
4. **BuildKit**: Usa Docker BuildKit para builds paralelos

### Economia de Tempo

Com cache configurado:
- Primeiro build: ~20-25 minutos
- Builds subsequentes (sem mudanças em deps): ~8-12 minutos
- Builds com mudanças mínimas: ~10-15 minutos

## Troubleshooting

### Erro: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Solução**: Verifique se as variáveis de ambiente estão configuradas em Settings → CI/CD → Variables.

### Erro: "Permission denied" no Docker

**Solução**: O GitLab Runner precisa ter permissão para usar Docker. Se você está usando um runner próprio, certifique-se de que ele está configurado corretamente.

### Build muito lento

**Causas comuns**:
1. Cache não está funcionando
2. Mudanças frequentes em `package.json`
3. Runner com poucos recursos

**Soluções**:
1. Verifique se o cache está habilitado
2. Use `npm ci` ao invés de `npm install`
3. Aumente recursos do runner ou use runners compartilhados do GitLab

### Erro de memória no build

**Solução**: O pipeline já está configurado com `NODE_OPTIONS="--max-old-space-size=6144"`. Se ainda houver problemas, aumente o limite de memória do runner.

### Imagem muito grande

**Solução**: O Dockerfile já está otimizado usando:
- Multi-stage build
- Alpine Linux
- Standalone output do Next.js

Tamanho esperado: ~200-400MB

## Próximos Passos

### Deploy Automático

Para adicionar deploy automático após o build:

1. Configure variáveis de ambiente do servidor
2. Adicione um stage `deploy` no `.gitlab-ci.yml`
3. Use SSH ou ferramentas como Ansible/kubectl

### Notificações

Configure notificações em:
- **Settings** → **Integrations** → **Slack** ou **Discord**
- Para receber alertas de pipeline falhando

### Proteção de Branches

Configure proteção em:
- **Settings** → **Repository** → **Protected branches**
- Exige que pipeline passe antes do merge

### Testes de Performance

Adicione jobs de:
- Lighthouse CI
- Bundle size analysis
- Load testing

## Recursos Adicionais

- [Documentação GitLab CI/CD](https://docs.gitlab.com/ee/ci/)
- [GitLab Container Registry](https://docs.gitlab.com/ee/user/packages/container_registry/)
- [Docker BuildKit](https://docs.docker.com/build/buildkit/)
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)

## Suporte

Se você encontrar problemas:

1. Verifique os logs do pipeline
2. Revise as variáveis de ambiente
3. Confirme que o Dockerfile funciona localmente
4. Entre em contato com a equipe de DevOps

---

**Última atualização**: 2026-01-20
