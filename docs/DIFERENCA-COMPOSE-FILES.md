# 📋 Diferença entre docker-compose.yml e docker-compose.portainer.yml

## Resumo Rápido

### `docker-compose.yml`
- **Uso**: Para fazer **build** da imagem Docker no Portainer
- **Quando usar**: Quando você quer que o Portainer faça o build da imagem a partir do código do repositório
- **Característica**: Contém a seção `build:` que instrui o Docker a construir a imagem

### `docker-compose.portainer.yml`
- **Uso**: Para usar uma imagem Docker **já buildada**
- **Quando usar**: Quando você já tem a imagem buildada em um registry ou localmente
- **Característica**: Usa `image:` ao invés de `build:`

---

## Detalhamento

### `docker-compose.yml` - Build no Portainer

```yaml
services:
  zattar_advogados:
    build:                    # ← Indica que vai fazer build
      context: .              # ← Contexto do build (raiz do repo)
      dockerfile: Dockerfile   # ← Qual Dockerfile usar
    # ... resto da config
```

**Como funciona:**
1. Portainer baixa o código do repositório
2. Executa `docker build` usando o Dockerfile
3. Cria a imagem Docker
4. Inicia o container com essa imagem

**Vantagens:**
- ✅ Automático - não precisa fazer build manual
- ✅ Sempre usa a versão mais recente do código
- ✅ Ideal para CI/CD

**Desvantagens:**
- ⚠️ Pode demorar mais (tempo de build)
- ⚠️ Consome mais recursos durante o build

---

### `docker-compose.portainer.yml` - Imagem Pré-construída

```yaml
services:
  sinesys:
    image: sinesys:latest     # ← Usa imagem já existente
    # ... resto da config
```

**Como funciona:**
1. Portainer procura pela imagem `sinesys:latest`
2. Se não encontrar localmente, tenta baixar de um registry
3. Inicia o container com essa imagem

**Vantagens:**
- ✅ Mais rápido (não precisa fazer build)
- ✅ Consome menos recursos
- ✅ Ideal quando você já tem a imagem buildada

**Desvantagens:**
- ⚠️ Precisa fazer build manual antes
- ⚠️ Precisa fazer push para registry (se usar)

---

## Qual Usar?

### Use `docker-compose.yml` quando:
- ✅ Você quer que o Portainer faça o build automaticamente
- ✅ Você está fazendo deploy direto do repositório GitHub/GitLab
- ✅ Você quer sempre usar a versão mais recente do código
- ✅ Você não tem um registry Docker configurado

### Use `docker-compose.portainer.yml` quando:
- ✅ Você já tem a imagem buildada
- ✅ Você quer fazer build localmente e depois fazer deploy
- ✅ Você tem um registry Docker configurado
- ✅ Você quer controle total sobre quando fazer build

---

## Exemplo de Fluxo com `docker-compose.yml`

```
GitHub Repo
    ↓
Portainer faz pull do código
    ↓
Portainer executa: docker build
    ↓
Imagem criada
    ↓
Container iniciado
```

---

## Exemplo de Fluxo com `docker-compose.portainer.yml`

```
Build local ou CI/CD
    ↓
docker build -t sinesys:latest .
    ↓
docker push registry.com/sinesys:latest (opcional)
    ↓
Portainer usa: image: sinesys:latest
    ↓
Container iniciado
```

---

## No Seu Caso

Como você está usando o método **Repository** no Portainer (conectando direto ao GitHub), você deve usar o **`docker-compose.yml`** que contém a seção `build:`.

O Portainer vai:
1. Baixar o código do GitHub
2. Executar o build usando o Dockerfile
3. Criar a imagem
4. Iniciar o container

---

## Migração entre os Dois

Se você quiser migrar de um para outro:

### De `docker-compose.yml` para `docker-compose.portainer.yml`:

1. Faça build da imagem primeiro:
```bash
docker build -t sinesys:latest .
```

2. Altere o arquivo para usar `image:` ao invés de `build:`

### De `docker-compose.portainer.yml` para `docker-compose.yml`:

1. Remova a linha `image:`
2. Adicione a seção `build:`
3. O Portainer fará o build automaticamente

