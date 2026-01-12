# Monitorar Build Docker

## 🔍 Verificar Status do Build

### Em outro terminal, durante o build:

```bash
# Ver uso de recursos em tempo real
docker stats --no-stream

# Ver processos Docker
docker ps -a

# Ver logs do build (se estiver usando docker-compose)
docker-compose logs -f

# Ver uso de memória do sistema
# Linux
free -h

# macOS
vm_stat
```

## 📊 Monitorar Build em Execução

### Verificar se build está rodando:
```bash
ps aux | grep "docker build" | grep -v grep
```

### Ver uso de recursos do BuildKit:
```bash
docker stats buildx_buildkit_builder0 --no-stream
```

### Ver logs do BuildKit:
```bash
docker logs buildx_buildkit_builder0 --tail 50 -f
```

## ⚠️ Sinais de Problema

### Build travado há mais de 30 minutos:
- Pode indicar problema de memória
- Verifique: `docker stats --no-stream`
- Considere aumentar memória do Docker Desktop

### Erro "EOF" durante build:
- Conexão BuildKit perdida
- Solução: Use `npm run docker:build:no-cache`

### Uso de memória > 90%:
- Risco de OOM (Out of Memory)
- Aumente memória do Docker Desktop
- Limpe cache: `docker system prune -a`

## 🛑 Interromper Build

```bash
# Encontrar PID do build
ps aux | grep "docker build"

# Matar processo (substitua PID)
kill -9 <PID>

# Ou parar todos os builds
docker buildx stop
```

## ✅ Verificar Build Concluído

```bash
# Listar imagens
docker images | grep sinesys

# Verificar tamanho da imagem
docker images sinesys:latest

# Testar imagem
docker run --rm -p 3000:3000 sinesys:latest
```
