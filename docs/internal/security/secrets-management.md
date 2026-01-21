# Gerenciamento de Secrets - Sinesys

## 🔒 Princípios de Segurança

### 1. Nunca Commitar Secrets

**Proibido**:
- API keys, tokens, senhas em código
- Credenciais em comentários ou documentação
- Dados sensíveis (CPF, CNPJ) em logs ou exemplos

**Permitido**:
- Variáveis de ambiente (.env.local)
- Placeholders genéricos em documentação
- Secrets em GitHub Secrets (CI/CD)

### 2. Usar Variáveis de Ambiente

**Estrutura**:
```bash
# .env.local (nunca commitado)
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIs...
OPENAI_API_KEY=sk-proj-...
SERVICE_API_KEY=$(openssl rand -hex 32)
```

**Acesso no código**:
```typescript
// ✅ Correto
const apiKey = process.env.OPENAI_API_KEY;

// ❌ Errado
const apiKey = "sk-proj-abc123...";
```

### 3. Sanitizar Logs

**Usar utilitário de sanitização**:
```typescript
import { sanitizeForLogs } from '@/lib/utils/sanitize-logs';

// ✅ Correto
console.log('Dados:', sanitizeForLogs({ cpf, senha, token }));
// Output: { cpf: "123***", senha: "[REDACTED]", token: "[REDACTED]" }

// ❌ Errado
console.log('Dados:', { cpf, senha, token });
```

### 4. Validação Automatizada

**Pre-commit**:
- ESLint detecta secrets hardcoded
- Gitleaks escaneia commits

**CI/CD**:
- GitHub Actions executa security scan
- Bloqueia merge se secrets detectados

## 📋 Checklist de Revisão de Código

Antes de criar PR, verificar:

- [ ] Nenhum secret hardcoded no código
- [ ] Logs sanitizados (CPF, senhas, tokens)
- [ ] Variáveis de ambiente documentadas em .env.example
- [ ] Exemplos em documentação usam placeholders genéricos
- [ ] ESLint passa sem warnings de segurança
- [ ] Gitleaks não detecta secrets

## 🚨 O Que Fazer se Commitou um Secret

1. **Revogar imediatamente** o secret exposto
2. **Gerar novo secret** e atualizar em produção
3. **Remover do histórico Git**:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
4. **Notificar equipe** sobre o incidente

## 📚 Recursos

- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
