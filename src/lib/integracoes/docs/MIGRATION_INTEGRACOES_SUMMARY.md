# Resumo: Migração de Integrações para Banco de Dados

## ✅ O que foi feito

### 1. Migration SQL Criada
**Arquivo:** `supabase/migrations/20260216220000_create_integracoes_table.sql`

- ✅ Tabela `integracoes` criada com schema completo
- ✅ Índices para performance (tipo, ativo, created_at)
- ✅ Trigger `updated_at` automático
- ✅ RLS policies para authenticated users
- ✅ Comentários em todas as colunas
- ✅ Constraint UNIQUE (tipo, nome)

**Schema:**
```sql
CREATE TABLE public.integracoes (
  id UUID PRIMARY KEY,
  tipo TEXT CHECK (tipo IN ('twofauth', 'zapier', 'dify', 'webhook', 'api')),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  configuracao JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_auth_id UUID REFERENCES auth.users(id),
  updated_by_auth_id UUID REFERENCES auth.users(id)
);
```

### 2. Scripts de Migração

#### Script Principal (Novo)
**Arquivo:** `scripts/migrate-integrations-to-db.ts`

- ✅ Migra configurações de variáveis de ambiente para banco
- ✅ Suporta: 2FAuth, Dify, Zapier
- ✅ Verifica duplicatas antes de inserir
- ✅ Logs detalhados do processo

**Uso:**
```bash
tsx scripts/migrate-integrations-to-db.ts
```

#### Script Existente (Atualizado)
**Arquivo:** `scripts/apply-integracoes-migration.ts`

- ✅ Atualizado para usar nova migration (20260216220000)
- ✅ Aplica SQL no Supabase remoto
- ✅ Migra configuração 2FAuth automaticamente

### 3. Documentação

**Arquivo:** `docs/integrations/migration-guide.md`

- ✅ Guia completo de migração
- ✅ Exemplos de uso no código
- ✅ Schemas de validação Zod
- ✅ Troubleshooting
- ✅ Compatibilidade com código legado

### 4. Feature de Integrações (Já Existente)

**Localização:** `src/features/integracoes/`

- ✅ Domain com schemas Zod
- ✅ Repository com queries tipadas
- ✅ Service com lógica de negócio
- ✅ Server Actions para UI
- ✅ Componentes React para configuração

**Já implementado:**
- `actionListarIntegracoes()`
- `actionListarIntegracoesPorTipo(tipo)`
- `actionBuscarIntegracao(id)`
- `actionBuscarConfig2FAuth()`
- `actionCriarIntegracao(params)`
- `actionAtualizarIntegracao(params)`
- `actionDeletarIntegracao(id)`
- `actionToggleAtivoIntegracao(id, ativo)`
- `actionAtualizarConfig2FAuth(config)`

### 5. Compatibilidade com Código Legado

**Arquivo:** `src/lib/integrations/twofauth/config-loader.ts`

- ✅ Busca primeiro no banco de dados
- ✅ Fallback para variáveis de ambiente
- ✅ Função síncrona para casos especiais

**Ordem de prioridade:**
1. Banco de dados (tabela `integracoes`)
2. Variáveis de ambiente (fallback)

## 📋 Próximos Passos

### 1. Aplicar Migration no Banco Remoto

```bash
# Opção 1: Via Supabase CLI (recomendado)
npx supabase db push

# Opção 2: Via script
tsx scripts/apply-integracoes-migration.ts

# Opção 3: Manual via Dashboard
# Copiar conteúdo de supabase/migrations/20260216220000_create_integracoes_table.sql
# Colar em https://supabase.com/dashboard/project/[PROJECT_ID]/sql/new
```

### 2. Migrar Configurações Existentes

```bash
# Executar script de migração
tsx scripts/migrate-integrations-to-db.ts
```

**Variáveis de ambiente que serão migradas:**
- `TWOFAUTH_API_URL` + `TWOFAUTH_API_TOKEN` + `TWOFAUTH_ACCOUNT_ID`
- `DIFY_API_URL` + `DIFY_API_KEY`
- `ZAPIER_WEBHOOK_URL`

### 3. Configurar via Interface Web

1. Acesse: `/app/configuracoes?tab=integracoes`
2. Clique em "Nova Integração" ou edite existente
3. Preencha os campos e salve

### 4. Verificar Funcionamento

```bash
# Testar busca de configuração
tsx scripts/test-integration-config.ts

# Ou via código:
import { actionBuscarConfig2FAuth } from '@/features/integracoes';

const result = await actionBuscarConfig2FAuth();
console.log(result);
```

### 5. Remover Variáveis de Ambiente (Opcional)

Após confirmar que tudo está funcionando via banco:

1. Remover de `.env.local`:
   - `TWOFAUTH_API_URL`
   - `TWOFAUTH_API_TOKEN`
   - `TWOFAUTH_ACCOUNT_ID`
   - `DIFY_API_URL`
   - `DIFY_API_KEY`
   - `ZAPIER_WEBHOOK_URL`

2. Remover de ambientes de produção (Vercel, etc.)

**⚠️ IMPORTANTE:** Mantenha as variáveis até confirmar que tudo funciona!

## 🔍 Verificação

### Verificar se a tabela existe

```sql
SELECT * FROM integracoes;
```

### Verificar se a migration foi aplicada

```bash
# Via Supabase CLI
npx supabase migration list

# Ou verificar no Dashboard
# Supabase > Database > Migrations
```

### Verificar se as integrações foram migradas

```sql
SELECT tipo, nome, ativo, created_at 
FROM integracoes 
ORDER BY created_at DESC;
```

## 📊 Status Atual

### Migrations
- ✅ `00000000000001_production_schema.sql` - Schema de produção
- ✅ `20260216215126_add_tarefas_kanban_fields.sql` - Campos Kanban
- ✅ `20260216220000_create_integracoes_table.sql` - **NOVA** Tabela integrações

### Código
- ✅ Feature `integracoes` completa
- ✅ Config loader com fallback
- ✅ Server Actions implementadas
- ✅ UI em `/app/configuracoes?tab=integracoes`

### Documentação
- ✅ Guia de migração completo
- ✅ Exemplos de uso
- ✅ Troubleshooting

## 🎯 Benefícios

1. **Configuração Dinâmica**: Alterar integrações sem redeploy
2. **Múltiplas Instâncias**: Várias integrações do mesmo tipo
3. **Auditoria**: Rastreamento de quem criou/alterou
4. **Validação**: Schemas Zod garantem dados corretos
5. **Interface Web**: Configuração via UI amigável
6. **Segurança**: RLS policies protegem dados
7. **Histórico**: Timestamps de criação e atualização

## 📝 Notas Importantes

1. **Compatibilidade**: Código legado continua funcionando com variáveis de ambiente
2. **Prioridade**: Banco de dados tem prioridade sobre env vars
3. **Fallback**: Se não encontrar no banco, usa env vars
4. **RLS**: Apenas usuários autenticados podem acessar
5. **Unique Constraint**: Não permite duplicatas (tipo + nome)

## 🆘 Troubleshooting

### Erro: "Tabela integracoes não existe"
```bash
# Aplicar migration
npx supabase db push
# ou
tsx scripts/apply-integracoes-migration.ts
```

### Erro: "Configuração não encontrada"
```bash
# Migrar configurações
tsx scripts/migrate-integrations-to-db.ts
# ou configurar via UI
```

### Erro: "Duplicate key value violates unique constraint"
```sql
-- Verificar duplicatas
SELECT tipo, nome, COUNT(*) 
FROM integracoes 
GROUP BY tipo, nome 
HAVING COUNT(*) > 1;

-- Remover duplicatas (manter a mais recente)
DELETE FROM integracoes a
USING integracoes b
WHERE a.id < b.id
  AND a.tipo = b.tipo
  AND a.nome = b.nome;
```

## 📚 Referências

- Feature: `src/features/integracoes/`
- Migration: `supabase/migrations/20260216220000_create_integracoes_table.sql`
- Scripts: `scripts/migrate-integrations-to-db.ts`
- Docs: `docs/integrations/migration-guide.md`
- UI: `/app/configuracoes?tab=integracoes`

---

**Data:** 2026-02-16  
**Autor:** Kiro AI Assistant  
**Status:** ✅ Pronto para aplicação

