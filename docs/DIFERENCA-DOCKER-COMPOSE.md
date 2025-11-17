# 📋 Diferença entre docker-compose.yml e docker-compose.portainer.yml

## Resumo Rápido

- **`docker-compose.yml`**: Faz BUILD da imagem durante o deploy (recomendado para Portainer via repositório)
- **`docker-compose.portainer.yml`**: Usa uma imagem PRÉ-CONSTRUÍDA (requer imagem já buildada)

---

## 🔍 Diferenças Detalhadas

### `docker-compose.yml` - Build Automático

**Características:**
- ✅ Faz o build da imagem automaticamente durante o deploy
- ✅ Usa a seção `build:` do docker-compose
- ✅ Ideal quando você conecta o Portainer ao repositório GitHub/GitLab
- ✅ O Portainer faz o build automaticamente quando você faz deploy

**Quando usar:**
- Quando você está fazendo deploy direto do repositório GitHub/GitLab
- Quando você quer que o Portainer faça o build automaticamente
- Quando você não tem uma imagem pré-construída

**Exemplo de uso:**
```yaml
services:
  zattar_advogados:
    build:
      context: .
      dockerfile: Dockerfile
    # ... resto da configuração
```

---

### `docker-compose.portainer.yml` - Imagem Pré-construída

**Características:**
- ✅ Usa uma imagem Docker já buildada
- ✅ Requer que você tenha buildado a imagem antes
- ✅ Mais rápido no deploy (não precisa fazer build)
- ✅ Usa a seção `image:` do docker-compose

**Quando usar:**
- Quando você já tem a imagem buildada localmente ou em um registry
- Quando você quer fazer o build manualmente antes do deploy
- Quando você quer usar uma imagem de um registry Docker (Docker Hub, etc.)

**Exemplo de uso:**
```yaml
services:
  sinesys:
    image: sinesys:latest
    # ou
    image: seu-registry.com/sinesys:latest
    # ... resto da configuração
```

---

## 📊 Comparação Visual

```
┌─────────────────────────────────────────────────────────┐
│           docker-compose.yml                            │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │  Portainer                                    │     │
│  │  1. Clona repositório GitHub                 │     │
│  │  2. Executa: docker build                    │     │
│  │  3. Cria imagem: zattar_advogados:latest     │     │
│  │  4. Inicia container                          │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ✅ Build automático durante deploy                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│      docker-compose.portainer.yml                       │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │  Portainer                                    │     │
│  │  1. Busca imagem: sinesys:latest             │     │
│  │  2. Se não encontrar, ERRO!                  │     │
│  │  3. Se encontrar, inicia container           │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ⚠️ Requer imagem já buildada                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Qual Usar no Seu Caso?

### Para Deploy via Repositório GitHub (Recomendado)

Use **`docker-compose.yml`** porque:
- ✅ O Portainer vai fazer o build automaticamente
- ✅ Você não precisa buildar a imagem manualmente
- ✅ Qualquer alteração no código será refletida no próximo deploy
- ✅ Mais simples e direto

### Para Deploy com Imagem Pré-construída

Use **`docker-compose.portainer.yml`** se:
- Você já tem a imagem buildada em um registry
- Você quer fazer o build manualmente antes
- Você está usando um registry Docker (Docker Hub, etc.)

---

## 🔧 Como Usar Cada Um

### Usando docker-compose.yml (Build Automático)

1. No Portainer, vá em **Stacks** > **Add stack**
2. Escolha **Repository** como método
3. Configure o repositório GitHub
4. **Compose path**: `docker-compose.yml`
5. Configure as variáveis de ambiente
6. Clique em **Deploy**
7. O Portainer fará o build automaticamente! ✅

### Usando docker-compose.portainer.yml (Imagem Pré-construída)

**Opção 1: Build Manual Antes**
```bash
# Build local
docker build -t sinesys:latest .

# Push para registry (se necessário)
docker push seu-registry.com/sinesys:latest
```

**Opção 2: No Portainer**
1. No Portainer, vá em **Stacks** > **Add stack**
2. Escolha **Repository** como método
3. Configure o repositório GitHub
4. **Compose path**: `docker-compose.portainer.yml`
5. Configure as variáveis de ambiente
6. ⚠️ Certifique-se de que a imagem `sinesys:latest` existe!
7. Clique em **Deploy**

---

## ✅ Resumo Final

| Característica | docker-compose.yml | docker-compose.portainer.yml |
|----------------|-------------------|------------------------------|
| Build automático | ✅ Sim | ❌ Não |
| Requer imagem pré-construída | ❌ Não | ✅ Sim |
| Ideal para repositório GitHub | ✅ Sim | ❌ Não |
| Mais rápido no deploy | ❌ Não | ✅ Sim |
| Mais simples | ✅ Sim | ❌ Não |

**Recomendação:** Use `docker-compose.yml` para deploy via repositório GitHub no Portainer! 🚀

