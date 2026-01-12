# Quick Fix - Erros Docker Build

## 🚨 Erro: EOF (BuildKit Connection Lost)

```
ERROR: failed to build: failed to receive status: rpc error: code = Unavailable desc = error reading from server: EOF
```

**Solução:**
```bash
npm run docker:build:no-cache
```

---

## 🚨 Erro: Proxy/Network Timeout

```
ERROR: failed to solve: failed to resolve source metadata for docker.io/docker/dockerfile:1.4: 
proxyconnect tcp: dial tcp: lookup http.docker.internal ...: i/o timeout
```

**Solução:**
```bash
# Opção 1: Build sem syntax directive (recomendado)
bash scripts/docker/build-no-cache.sh Dockerfile.no-syntax

# Opção 2: Corrigir Docker Desktop
# Settings → Resources → Network → Desabilitar "Use kernel networking for UDP"
# Settings → Docker Engine → Remover configurações de proxy
# Reiniciar Docker Desktop
```

---

## 📋 Todos os Scripts Disponíveis

```bash
# Verificar recursos
npm run docker:check-resources

# Recuperar BuildKit
npm run docker:fix-buildkit

# Diagnóstico de proxy
npm run docker:fix-proxy

# Builds alternativos
npm run docker:build                    # Build padrão
npm run docker:build:no-cache           # Sem cache mount
bash scripts/docker/build-no-cache.sh Dockerfile.no-syntax  # Sem syntax directive
```

---

## 🎯 Ordem de Tentativas

1. **Primeiro:** `npm run docker:check-resources`
2. **Se EOF:** `npm run docker:build:no-cache`
3. **Se Proxy:** `bash scripts/docker/build-no-cache.sh Dockerfile.no-syntax`
4. **Se persistir:** Aumentar memória Docker Desktop (12GB+) e reiniciar

---

## 📚 Documentação Completa

- EOF Error: `docs/troubleshooting/docker-buildkit-eof-error.md`
- Proxy Error: `docs/troubleshooting/docker-proxy-error.md`
- Monitor Build: `docs/troubleshooting/monitor-build.md`
