# Sistema de Integrações - Sinesys

## ✅ Status: Operacional

O sistema de integrações está totalmente funcional e pronto para uso!

## 🚀 Acesso Rápido

### Interface Web
**URL:** `/app/configuracoes?tab=integracoes`

### Scripts NPM
```bash
npm run integrations:migrate  # Migrar de .env.local
npm run integrations:test     # Testar configurações
npm run integrations:check    # Verificar tabela
```

## 📊 Integrações Ativas

| Tipo | Nome | Status | Configurado |
|------|------|--------|-------------|
| 2FAuth | 2FAuth Principal | ✅ Ativo | ✅ Sim |
| Dify | - | ⚪ Não configurado | ❌ Não |
| Zapier | - | ⚪ Não configurado | ❌ Não |

## 🎯 Como Adicionar Nova Integração

### Opção 1: Via Interface (Recomendado)

1. Acesse `/app/configuracoes?tab=integracoes`
2. Clique em "Nova Integração"
3. Preencha:
   - **Tipo:** twofauth, zapier, dify, webhook, api
   - **Nome:** Nome descritivo
   - **Descrição:** Opcional
   - **Ativo:** Marque para ativar
   - **Configuração:** JSON com campos específicos
4. Salve

### Opção 2: Via Variáveis de Ambiente

1. Adicione ao `.env.local`:
   ```env
   # Dify AI
   DIFY_API_URL=https://api.dify.ai/v1
   DIFY_API_KEY=app-xxxxxxxxxxxxx
   
   # Zapier
   ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/123456/abcdef
   ```

2. Execute:
   ```bash
   npm run integrations:migrate
   ```

### Opção 3: Via Código

```typescript
import { actionCriarIntegracao } from '@/features/integracoes';

const result = await actionCriarIntegracao({
  tipo: 'webhook',
  nome: 'Webhook Notificações',
  descricao: 'Webhook para enviar notificações',
  ativo: true,
  configuracao: {
    url: 'https://example.com/webhook',
    secret: 'webhook-secret',
  },
});
```

## 📖 Exemplos de Configuração

### 2FAuth
```json
{
  "api_url": "https://2fauth.example.com",
  "api_token": "seu-token-aqui",
  "account_id": 1
}
```

### Dify AI
```json
{
  "api_url": "https://api.dify.ai/v1",
  "api_key": "app-xxxxxxxxxxxxx"
}
```

### Zapier
```json
{
  "webhook_url": "https://hooks.zapier.com/hooks/catch/123456/abcdef"
}
```

### Webhook Customizado
```json
{
  "url": "https://example.com/webhook",
  "secret": "webhook-secret",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

## 🔧 Uso no Código

### Buscar Configuração

```typescript
import { actionBuscarConfig2FAuth } from '@/features/integracoes';

const config = await actionBuscarConfig2FAuth();

if (config.success && config.data) {
  const { api_url, api_token, account_id } = config.data;
  // Usar configuração
}
```

### Listar Integrações

```typescript
import { actionListarIntegracoesPorTipo } from '@/features/integracoes';

const result = await actionListarIntegracoesPorTipo({ tipo: 'twofauth' });

if (result.success) {
  const integracoes = result.data;
  // Processar integrações
}
```

### Atualizar Integração

```typescript
import { actionAtualizarIntegracao } from '@/features/integracoes';

const result = await actionAtualizarIntegracao({
  id: 'uuid-da-integracao',
  ativo: false, // Desativar
});
```

## 📚 Documentação Completa

- **Guia de Migração:** `docs/integrations/migration-guide.md`
- **Quick Start:** `QUICK_START_INTEGRACOES.md`
- **Resumo Técnico:** `MIGRATION_INTEGRACOES_SUMMARY.md`
- **Sucesso da Migração:** `SUCESSO_MIGRATION_INTEGRACOES.md`
- **Scripts:** `scripts/README_INTEGRATIONS.md`

## 🆘 Troubleshooting

### Integração não aparece na interface

```bash
# Verificar se existe no banco
npm run integrations:test
```

### Erro ao buscar configuração

```bash
# Verificar tabela
npm run integrations:check

# Verificar RLS policies no Supabase Dashboard
```

### Migração não funciona

```bash
# Verificar variáveis de ambiente
grep -E "TWOFAUTH|DIFY|ZAPIER" .env.local

# Executar migração
npm run integrations:migrate
```

## 🔐 Segurança

- ✅ RLS (Row-Level Security) ativo
- ✅ Apenas usuários autenticados podem acessar
- ✅ Tokens armazenados em JSONB (criptografado em trânsito)
- ✅ Auditoria de criação/atualização

## 🎯 Benefícios

1. **Configuração Dinâmica**: Sem redeploy
2. **Múltiplas Instâncias**: Várias integrações do mesmo tipo
3. **Interface Amigável**: Gerenciamento via web
4. **Auditoria**: Rastreamento completo
5. **Validação**: Schemas Zod
6. **Fallback**: Compatibilidade com env vars

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a documentação em `docs/integrations/`
2. Verifique os exemplos em `QUICK_START_INTEGRACOES.md`
3. Execute os testes: `npm run integrations:test`

---

**Última atualização:** 2026-02-16  
**Status:** ✅ Operacional  
**Integrações Ativas:** 1 (2FAuth)

