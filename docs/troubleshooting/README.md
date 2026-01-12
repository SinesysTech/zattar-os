# Troubleshooting - Docker BuildKit

## 📁 Arquivos Criados

### Scripts
- `scripts/docker/fix-buildkit.sh` - Recupera e reconstrói o BuildKit
- `scripts/docker/check-docker-resources.sh` - Verifica recursos antes do build

### Dockerfiles Alternativos
- `Dockerfile.no-cache` - Versão sem cache mounts (fallback)
- `docker-compose.no-cache.yml` - Docker Compose usando Dockerfile alternativo

### Documentação
- `docs/troubleshooting/docker-buildkit-eof-error.md` - Documentação completa
- `docs/troubleshooting/docker-buildkit-quick-fix.md` - Guia rápido

## 🚀 Uso Rápido

### Verificar Recursos
```bash
npm run docker:check-resources
```

### Recuperar BuildKit
```bash
npm run docker:fix-buildkit
```

### Build sem Cache (Fallback)
```bash
# Docker direto
npm run docker:build:no-cache

# Docker Compose
docker-compose -f docker-compose.no-cache.yml up -d --build
```

## 📋 Scripts NPM Adicionados

- `npm run docker:check-resources` - Verifica recursos do Docker
- `npm run docker:fix-buildkit` - Recupera BuildKit
- `npm run docker:build` - Build padrão
- `npm run docker:build:no-cache` - Build sem cache mount
- `npm run docker:build:no-cache-mount` - Build sem cache (completo)

## 🔍 Diagnóstico

Se o build continuar falhando:

1. **Aumente memória do Docker Desktop**
   - Settings → Resources → Memory: 12GB+
   - Settings → Resources → Swap: 2GB+

2. **Limpe cache do Docker**
   ```bash
   docker system prune -a
   ```

3. **Use build sem cache**
   ```bash
   npm run docker:build:no-cache
   ```

4. **Verifique logs do sistema (OOM)**
   ```bash
   # Linux
   dmesg | grep -i oom
   
   # macOS
   log show --predicate 'eventMessage contains "out of memory"' --last 1h
   ```

## 📚 Referências

- [Docker BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
