# Scripts de Integrações

Scripts para gerenciar a migração e configuração de integrações no Sinesys.

## 📁 Arquivos

### `migrate-integrations-to-db.ts`

Migra configurações de integrações de variáveis de ambiente para a tabela `integracoes`.

**Uso:**

```bash
npm run integrations:migrate
# ou
tsx scripts/integrations/migrate-integrations-to-db.ts
```

**O que faz:**

- Lê variáveis de ambiente (TWOFAUTH*\*, DIFY*\_, ZAPIER\_\_)
- Insere na tabela `integracoes`
- Verifica duplicatas antes de inserir
- Logs detalhados do processo

**Variáveis suportadas:**

- `TWOFAUTH_API_URL` + `TWOFAUTH_API_TOKEN` + `TWOFAUTH_ACCOUNT_ID`
- `DIFY_API_URL` + `DIFY_API_KEY`
- `ZAPIER_WEBHOOK_URL`

---

### `test-integration-config.ts`

Testa se as integrações estão configuradas corretamente.

**Uso:**

```bash
npm run integrations:test
# ou
tsx scripts/integrations/test-integration-config.ts
```

**O que testa:**

1. ✅ Tabela `integracoes` existe
2. ✅ Listar todas as integrações
3. ✅ Configuração 2FAuth
4. ✅ Configuração Dify
5. ✅ Configuração Zapier

**Output:**

```
🧪 Testando Configuração de Integrações
============================================================

📋 Teste 1: Verificar se a tabela integracoes existe...
✅ Tabela integracoes existe e está acessível

📋 Teste 2: Listar todas as integrações...
✅ 3 integração(ões) encontrada(s):

   • TWOFAUTH: 2FAuth Principal
     Ativo: ✅
     Criado em: 16/02/2026 22:00:00

   • DIFY: Dify AI Principal
     Ativo: ✅
     Criado em: 16/02/2026 22:00:00

   • ZAPIER: Zapier Principal
     Ativo: ✅
     Criado em: 16/02/2026 22:00:00

...

📊 Resumo dos Testes:
   ✅ Passou: 5/5
   ❌ Falhou: 0/5

✨ Todos os testes passaram!
```

---

### `sync-dify-metadata.py`

Script Python para sincronizar metadados do Dify AI.

**Uso:**

```bash
python scripts/integrations/sync-dify-metadata.py
```

**O que faz:**

- Sincroniza metadados e configurações do Dify
- Atualiza informações de workflows e chatflows
- Mantém dados consistentes entre sistemas

---

## 🚀 Fluxo Completo

### 1. Aplicar Migration

```bash
# Via Supabase CLI (recomendado)
npx supabase db push
```

### 2. Migrar Configurações

```bash
tsx scripts/integrations/migrate-integrations-to-db.ts
```

### 3. Testar

```bash
tsx scripts/integrations/test-integration-config.ts
```

### 4. Verificar na Interface

Acesse: `/app/configuracoes?tab=integracoes`

---

## 📋 Variáveis de Ambiente

### 2FAuth

```env
TWOFAUTH_API_URL=https://2fauth.example.com
TWOFAUTH_API_TOKEN=your-token-here
TWOFAUTH_ACCOUNT_ID=1
```

### Dify AI

```env
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-xxxxxxxxxxxxx
```

### Zapier

```env
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/123456/abcdef
```

---

## 🔧 Troubleshooting

### Erro: "Tabela integracoes não existe"

```bash
# Aplicar migration
npx supabase db push
```

### Erro: "Configuração não encontrada"

```bash
# Migrar configurações
npm run integrations:migrate
```

### Erro: "Duplicate key value"

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

---

## 📚 Documentação Relacionada

- **Guia de Migração:** `docs/integrations/migration-guide.md`
- **Quick Start:** `QUICK_START_INTEGRACOES.md`
- **Resumo Técnico:** `MIGRATION_INTEGRACOES_SUMMARY.md`
- **Feature Code:** `src/features/integracoes/`
- **Migration SQL:** `supabase/migrations/20260216220000_create_integracoes_table.sql`

---

## 💡 Dicas

1. Execute os scripts na ordem: apply → migrate → test
2. Mantenha variáveis de ambiente até confirmar funcionamento
3. Use a interface web para configurar novas integrações
4. Ative/desative integrações sem redeploy
5. Múltiplas instâncias do mesmo tipo são suportadas

---

**Última atualização:** 2026-02-16  
**Autor:** Kiro AI Assistant
