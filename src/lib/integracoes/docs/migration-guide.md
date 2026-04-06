# Guia de Migração: Integrações para Banco de Dados

## Visão Geral

A partir de agora, todas as configurações de integrações (2FAuth, Zapier, Dify, Webhooks, APIs) são armazenadas na tabela `integracoes` do banco de dados, ao invés de variáveis de ambiente.

## Benefícios

- ✅ Configuração via interface web em `/app/configuracoes?tab=integracoes`
- ✅ Múltiplas integrações do mesmo tipo
- ✅ Ativar/desativar integrações sem redeploy
- ✅ Histórico de alterações (created_at, updated_at)
- ✅ Auditoria (created_by_auth_id, updated_by_auth_id)
- ✅ Validação centralizada via Zod schemas

## Migração de Variáveis de Ambiente

### Passo 1: Aplicar Migration

A migration `20260216220000_create_integracoes_table.sql` cria a tabela automaticamente.

```bash
# Se usando Supabase CLI
npx supabase db push

# Ou aplicar manualmente via Dashboard
```

### Passo 2: Migrar Configurações Existentes

Execute o script de migração para transferir variáveis de ambiente para o banco:

```bash
tsx scripts/migrate-integrations-to-db.ts
```

O script busca as seguintes variáveis de ambiente:

| Variável | Integração | Obrigatória |
|----------|------------|-------------|
| `TWOFAUTH_API_URL` | 2FAuth | Sim |
| `TWOFAUTH_API_TOKEN` | 2FAuth | Sim |
| `TWOFAUTH_ACCOUNT_ID` | 2FAuth | Não |
| `DIFY_API_URL` | Dify AI | Sim |
| `DIFY_API_KEY` | Dify AI | Sim |
| `ZAPIER_WEBHOOK_URL` | Zapier | Sim |

### Passo 3: Remover Variáveis de Ambiente (Opcional)

Após migrar, você pode remover as variáveis de ambiente do `.env.local` e dos ambientes de produção.

**Importante:** Mantenha as variáveis até confirmar que tudo está funcionando via banco de dados.

## Configuração via Interface Web

### Acessar Configurações

1. Navegue para `/app/configuracoes?tab=integracoes`
2. Clique em "Nova Integração" ou edite uma existente
3. Preencha os campos:
   - **Tipo**: twofauth, zapier, dify, webhook, api
   - **Nome**: Nome descritivo
   - **Descrição**: Opcional
   - **Ativo**: Marque para ativar
   - **Configuração**: JSON com campos específicos

### Exemplo: 2FAuth

```json
{
  "api_url": "https://2fauth.example.com",
  "api_token": "seu-token-aqui",
  "account_id": 1
}
```

### Exemplo: Dify AI

```json
{
  "api_url": "https://api.dify.ai/v1",
  "api_key": "app-xxxxxxxxxxxxx"
}
```

### Exemplo: Zapier

```json
{
  "webhook_url": "https://hooks.zapier.com/hooks/catch/123456/abcdef"
}
```

## Uso no Código

### Buscar Configuração de Integração

```typescript
import { actionBuscarConfig2FAuth } from '@/features/integracoes';

// Em Server Component
const config = await actionBuscarConfig2FAuth();

if (config.success && config.data) {
  const { api_url, api_token, account_id } = config.data;
  // Usar configuração
}
```

### Listar Integrações por Tipo

```typescript
import { actionListarIntegracoesPorTipo } from '@/features/integracoes';

const result = await actionListarIntegracoesPorTipo({ tipo: 'twofauth' });

if (result.success) {
  const integracoes = result.data;
  // Processar integrações
}
```

### Criar Nova Integração

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

### Atualizar Integração

```typescript
import { actionAtualizarIntegracao } from '@/features/integracoes';

const result = await actionAtualizarIntegracao({
  id: 'uuid-da-integracao',
  ativo: false, // Desativar integração
});
```

## Compatibilidade com Código Legado

O código existente que usa variáveis de ambiente continuará funcionando durante o período de transição.

### Ordem de Prioridade

1. **Banco de dados** (tabela `integracoes`) - Prioridade máxima
2. **Variáveis de ambiente** - Fallback se não encontrar no banco

### Exemplo de Compatibilidade

```typescript
// src/lib/integrations/twofauth/config-loader.ts

export async function load2FAuthConfig(): Promise<TwoFAuthConfig | null> {
  // 1. Tentar buscar do banco
  const dbConfig = await buscarConfig2FAuth();
  if (dbConfig) return dbConfig;

  // 2. Fallback para variáveis de ambiente
  const envUrl = process.env.TWOFAUTH_API_URL;
  const envToken = process.env.TWOFAUTH_API_TOKEN;
  
  if (envUrl && envToken) {
    return {
      api_url: envUrl,
      api_token: envToken,
      account_id: process.env.TWOFAUTH_ACCOUNT_ID 
        ? parseInt(process.env.TWOFAUTH_ACCOUNT_ID, 10) 
        : undefined,
    };
  }

  return null;
}
```

## Schema da Tabela

```sql
CREATE TABLE public.integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('twofauth', 'zapier', 'dify', 'webhook', 'api')),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  configuracao JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  CONSTRAINT integracoes_nome_tipo_unique UNIQUE (tipo, nome)
);
```

## Schemas de Validação (Zod)

### 2FAuth

```typescript
const twofauthConfigSchema = z.object({
  api_url: z.string().url("URL inválida"),
  api_token: z.string().min(10, "Token deve ter no mínimo 10 caracteres"),
  account_id: z.number().int().positive().optional(),
});
```

### Dify AI

```typescript
const difyConfigSchema = z.object({
  api_url: z.string().url("URL inválida"),
  api_key: z.string().min(10, "API key deve ter no mínimo 10 caracteres"),
});
```

### Zapier

```typescript
const zapierConfigSchema = z.object({
  webhook_url: z.string().url("URL inválida"),
});
```

## Troubleshooting

### Erro: "Integração não encontrada"

1. Verifique se a migration foi aplicada: `SELECT * FROM integracoes;`
2. Execute o script de migração: `tsx scripts/migrate-integrations-to-db.ts`
3. Configure manualmente via interface web

### Erro: "Configuração inválida"

1. Verifique o schema Zod correspondente em `src/features/integracoes/domain.ts`
2. Certifique-se de que todos os campos obrigatórios estão presentes
3. Valide o formato dos campos (URLs, tokens, etc.)

### Integração não está sendo usada

1. Verifique se `ativo = true` na tabela
2. Confirme que o código está usando a função correta de busca
3. Verifique logs do servidor para erros de validação

## Próximos Passos

1. ✅ Aplicar migration
2. ✅ Executar script de migração
3. ✅ Testar integrações via interface web
4. ⏳ Atualizar código legado para usar banco de dados
5. ⏳ Remover variáveis de ambiente após confirmação

## Suporte

Para dúvidas ou problemas, consulte:

- Documentação da feature: `src/features/integracoes/`
- Server Actions: `src/features/integracoes/actions/integracoes-actions.ts`
- Domain schemas: `src/features/integracoes/domain.ts`

