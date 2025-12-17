# Change: Otimizar Infraestrutura Docker e CI/CD

## Why

O projeto possui uma infraestrutura Docker e CI/CD funcional com multi-stage build, output standalone do Next.js 16, e boas práticas de segurança (usuário não-root, healthcheck). No entanto, há oportunidades significativas de otimização: o workflow de deploy está inativo (em `.gemini/`), o cache do Docker não está otimizado para GitHub Actions, e algumas configurações podem ser modernizadas seguindo as melhores práticas de 2025 para Node.js 24 e Next.js 16.

## What Changes

### Otimização do Dockerfile
- Atualizar base images para `node:24-alpine` com pinning de digest
- Otimizar cache mounts e ordenação de layers
- Reduzir NODE_OPTIONS de 4096MB para 3072MB
- Adicionar `HOSTNAME` explícito no runner stage
- Usar `--chown=nextjs:nodejs` em todos os COPY

### Modernização do GitHub Actions
- Mover workflow de `.gemini/.github/workflows/` para `.github/workflows/`
- Atualizar `docker/build-push-action` para v6
- Implementar cache registry (`type=registry,mode=max`)
- Atualizar workflow de testes para Node.js 24.x
- Adicionar cache de dependências npm

### Configuração de Deploy
- Criar `captain-definition` para CapRover
- Configurar webhook automático para deploy
- Documentar secrets necessários no GitHub

### Melhorias de Segurança
- Pinning de imagens base com digest
- Configurar Trivy para análise de vulnerabilidades (futuro)

## Impact

### Affected Specs
- `devops-infrastructure` (nova capability)

### Affected Code
- `Dockerfile` - Otimização completa
- `.github/workflows/docker-build-deploy.yml` - Novo workflow ativo
- `.github/workflows/tests.yml` - Atualização Node.js
- `captain-definition` - Novo arquivo
- `next.config.ts` - Revisões opcionais
- `package.json` - Scripts de build opcionais
- `docs/deploy.md` - Nova documentação

### Resultados Esperados

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Image size** | ~400-500MB | ~200-300MB | 40-50% smaller |
| **Build time (no cache)** | ~8-12 min | ~6-10 min | 20-30% faster |
| **Build time (with cache)** | ~5-8 min | ~2-4 min | 50-60% faster |
| **Deploy time** | Manual | Automatic | 100% automated |
| **Security** | Good | Excellent | Pinning + scanning |
