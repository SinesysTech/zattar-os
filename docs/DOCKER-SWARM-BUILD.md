# 🔨 Como Fazer Build da Imagem para Docker Swarm

Como o Docker Swarm **não suporta** `build:` diretamente no docker-compose.yml, você precisa fazer o build da imagem **antes** de fazer o deploy.

## Opções para Fazer Build

### Opção 1: Build Local e Tag Manual

```bash
# 1. Faça o build da imagem localmente
docker build -t zattar_advogados:latest .

# 2. Se você tem múltiplos nós no Swarm, você precisa fazer push para um registry
# ou copiar a imagem para todos os nós

# 3. No Portainer, use o docker-compose.yml que já está configurado
```

### Opção 2: Build no Portainer e Tag Manual

1. No Portainer, vá em **Images**
2. Clique em **Build a new image**
3. Configure:
   - **Image**: `zattar_advogados:latest`
   - **Build method**: Repository
   - **Repository URL**: URL do seu repositório GitHub
   - **Dockerfile path**: `Dockerfile`
4. Clique em **Build the image**
5. Depois faça o deploy da stack usando o `docker-compose.yml`

### Opção 3: Usar Registry Docker (Recomendado para Produção)

```bash
# 1. Build da imagem
docker build -t seu-registry.com/zattar_advogados:latest .

# 2. Push para o registry
docker push seu-registry.com/zattar_advogados:latest

# 3. No docker-compose.yml, altere:
image: seu-registry.com/zattar_advogados:latest
```

### Opção 4: Build via Portainer Stack (Workaround)

Se você quiser que o Portainer faça o build automaticamente:

1. No Portainer, ao criar a stack, escolha **Web editor** ao invés de **Repository**
2. Cole o conteúdo do `docker-compose.yml`
3. Mas antes, você precisa fazer o build da imagem primeiro usando uma das opções acima

## ⚠️ Importante

- Docker Swarm **não suporta** `build:` diretamente
- Você **deve** ter a imagem buildada antes de fazer deploy
- Se você tem múltiplos nós, a imagem precisa estar disponível em todos eles (use registry)

## 🔄 Workflow Recomendado

```
1. Código no GitHub
   ↓
2. Build da imagem (local ou CI/CD)
   docker build -t zattar_advogados:latest .
   ↓
3. Push para registry (se tiver múltiplos nós)
   docker push registry.com/zattar_advogados:latest
   ↓
4. Deploy no Portainer usando docker-compose.yml
   (que já tem image: zattar_advogados:latest)
```

## 📝 Atualizando a Aplicação

Para atualizar:

1. Faça o build da nova versão:
```bash
docker build -t zattar_advogados:latest .
```

2. No Portainer:
   - Vá em **Stacks** > **zattar_advogados** > **Editor**
   - Clique em **Update the stack**
   - O Swarm vai fazer rolling update automaticamente

