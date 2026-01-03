# CI/CD - Testes e Cobertura

## Workflows GitHub Actions

### 1. Tests and Coverage (`tests.yml`)

Executado em **todos os PRs** e pushes para `main`/`master`/`develop`.

#### Jobs

##### Unit & Integration Tests
- Executa testes unitários e de integração
- Gera relatório de cobertura
- Envia para Codecov
- Verifica threshold de 80%
- Falha se cobertura < 80%

##### E2E Tests
- Executa testes Playwright
- Cross-browser (Chrome, Firefox, Safari)
- Mobile (Pixel 7, iPhone 14)
- Salva relatórios como artifacts

##### Coverage Report
- Gera relatório por módulo (features, lib, components)
- Adiciona comentário em PRs com resumo

#### Configuração

**Secrets necessários:**
- `CODECOV_TOKEN`: Token do Codecov (obrigatório)

**Variáveis de ambiente:**
- `NODE_VERSION`: 24.9.0 (Node.js LTS)

#### Artifacts

Os seguintes artifacts são salvos por 30 dias:

- `coverage-report`: Relatório HTML de cobertura
- `playwright-report`: Relatório de testes E2E

#### Falhas Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| Coverage below 80% | Cobertura insuficiente | Adicionar testes |
| Codecov upload failed | Token inválido | Verificar `CODECOV_TOKEN` |
| E2E timeout | Testes lentos | Aumentar timeout no `playwright.config.ts` |
| Dependency install failed | Cache corrompido | Limpar cache do GitHub Actions |

---

## Codecov

### Configuração

Arquivo: `codecov.yml`

#### Flags

Cobertura é separada por módulo:

- `features`: `src/features/`
- `lib`: `src/lib/`
- `components`: `src/components/`
- `hooks`: `src/hooks/`

#### Thresholds

- **Project**: 80% (threshold: 2%)
- **Patch**: 80% (threshold: 5%)

#### Comentários em PRs

Codecov adiciona automaticamente um comentário em PRs com:

- Cobertura total (antes/depois)
- Diff de cobertura
- Arquivos com maior impacto
- Visualização em árvore

### Visualização

#### Dashboard

Acesse: [https://codecov.io/gh/sinesys/sinesys](https://codecov.io/gh/sinesys/sinesys)

Recursos:
- Gráfico de tendência de cobertura
- Navegação por arquivo
- Cobertura por flag (módulo)
- Análise de commits
- Histórico de PRs

#### Badges

```markdown
# Badge principal
![Coverage](https://codecov.io/gh/sinesys/sinesys/branch/main/graph/badge.svg)

# Badge por flag
![Features](https://codecov.io/gh/sinesys/sinesys/branch/main/graph/badge.svg?flag=features)
![Lib](https://codecov.io/gh/sinesys/sinesys/branch/main/graph/badge.svg?flag=lib)
```

---

## Configurar Codecov no GitHub

### Passos

1. **Acessar Codecov:**
   - Ir para [https://codecov.io](https://codecov.io)
   - Fazer login com GitHub
   - Adicionar repositório `sinesys/sinesys`

2. **Obter Token:**
   - Copiar o `CODECOV_TOKEN` gerado

3. **Adicionar Secret no GitHub:**
   - Ir para `Settings > Secrets and variables > Actions`
   - Clicar em `New repository secret`
   - Nome: `CODECOV_TOKEN`
   - Valor: colar o token copiado

4. **Atualizar Badge:**
   - Copiar URL do badge do Codecov
   - Atualizar no README se necessário

---

## Executar Localmente

### Simular CI

```bash
# Instalar dependências
npm ci

# Executar testes como no CI
npm run test:ci

# Gerar relatório de cobertura
npm run test:coverage:report

# Verificar threshold
npm run test:coverage -- --coverageReporters=json-summary
```

### Executar Workflow Localmente

Usar [act](https://github.com/nektos/act):

```bash
# Instalar act
# Windows (com scoop)
scoop install act

# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Executar workflow
act pull_request -W .github/workflows/tests.yml

# Executar job específico
act pull_request -j unit-and-integration
```

---

## Manutenção

### Atualizar Thresholds

**Arquivo:** `jest.config.js`

```javascript
coverageThreshold: {
  global: {
    branches: 85,  // Aumentar de 80% para 85%
    functions: 85,
    lines: 85,
    statements: 85,
  },
}
```

**Arquivo:** `codecov.yml`

```yaml
coverage:
  status:
    project:
      default:
        target: 85%  # Aumentar de 80% para 85%
```

### Adicionar Novo Módulo

1. **Criar testes** em `src/features/{modulo}/__tests__/`
2. **Adicionar script** em `package.json`:
   ```json
   "test:{modulo}": "jest src/features/{modulo}"
   ```
3. **Adicionar flag** em `codecov.yml`:
   ```yaml
   flags:
     {modulo}:
       paths:
         - src/features/{modulo}/
   ```

### Monitorar Cobertura

```bash
# Gerar relatório JSON
npm run test:coverage:json

# Extrair métricas
# Windows PowerShell
$coverage = Get-Content coverage/coverage-summary.json | ConvertFrom-Json
$coverage.total.lines.pct

# Linux/macOS
jq '.total.lines.pct' coverage/coverage-summary.json
jq '.total.branches.pct' coverage/coverage-summary.json
```

---

## Troubleshooting

### Codecov não recebe upload

**Sintomas:**
- Workflow passa mas Codecov não atualiza
- Badge mostra "unknown"

**Soluções:**
1. Verificar `CODECOV_TOKEN` no GitHub Secrets
2. Verificar se `coverage/lcov.info` foi gerado
3. Verificar logs do step "Upload coverage to Codecov"
4. Testar upload manual:
   ```bash
   # Linux/macOS
   bash <(curl -s https://codecov.io/bash) -t $CODECOV_TOKEN

   # Windows (PowerShell)
   Invoke-WebRequest -Uri https://uploader.codecov.io/latest/windows/codecov.exe -Outfile codecov.exe
   .\codecov.exe -t $env:CODECOV_TOKEN
   ```

### Testes passam localmente mas falham no CI

**Causas comuns:**
- Diferenças de timezone
- Dependências de arquivos locais
- Mocks não configurados
- Variáveis de ambiente faltando

**Soluções:**
1. Executar `npm run test:ci` localmente
2. Verificar logs do GitHub Actions
3. Adicionar `console.log` para debug
4. Usar `act` para simular CI localmente

### Cobertura diferente entre local e CI

**Causas:**
- Cache de testes antigos
- Arquivos não commitados
- Configuração de `collectCoverageFrom` diferente

**Soluções:**
1. Limpar cache: `npm run test -- --clearCache`
2. Verificar `.gitignore`
3. Comparar `jest.config.js` local vs CI

---

## Referências

- [Codecov Documentation](https://docs.codecov.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#coveragethreshold-object)
- [Playwright CI Guide](https://playwright.dev/docs/ci)
