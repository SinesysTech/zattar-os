# Quick Start: Migração de Integrações

## 🚀 Início Rápido (3 passos)

### 1️⃣ Aplicar Migration

```bash
# Opção A: Via Supabase CLI (recomendado)
npx supabase db push

# Opção B: Via script
tsx scripts/apply-integracoes-migration.ts
```

### 2️⃣ Migrar Configurações

```bash
# Migrar variáveis de ambiente para banco
tsx scripts/migrate-integrations-to-db.ts
```

### 3️⃣ Testar

```bash
# Verificar se tudo está funcionando
tsx scripts/test-integration-config.ts
```

## ✅ Pronto!

Acesse: **`/app/configuracoes?tab=integracoes`**

---

## 📋 Checklist Completo

- [ ] Migration aplicada no banco remoto
- [ ] Configurações migradas de `.env.local`
- [ ] Testes executados com sucesso
- [ ] Interface web acessível
- [ ] Integrações funcionando via banco
- [ ] Variáveis de ambiente removidas (opcional)

---

## 🔧 Comandos Úteis

### Verificar tabela no banco

```sql
SELECT * FROM integracoes;
```

### Listar integrações ativas

```sql
SELECT tipo, nome, ativo 
FROM integracoes 
WHERE ativo = true;
```

### Buscar configuração 2FAuth

```sql
SELECT configuracao 
FROM integracoes 
WHERE tipo = 'twofauth' 
  AND ativo = true;
```

---

## 📚 Documentação Completa

- **Guia de Migração:** `docs/integrations/migration-guide.md`
- **Resumo Técnico:** `MIGRATION_INTEGRACOES_SUMMARY.md`
- **Feature Code:** `src/features/integracoes/`

---

## 🆘 Problemas?

### Tabela não existe
```bash
npx supabase db push
```

### Configuração não encontrada
```bash
tsx scripts/migrate-integrations-to-db.ts
```

### Testes falhando
```bash
# Ver logs detalhados
tsx scripts/test-integration-config.ts
```

---

## 💡 Dicas

1. **Mantenha variáveis de ambiente** até confirmar que tudo funciona
2. **Use a interface web** para configurar novas integrações
3. **Ative/desative** integrações sem redeploy
4. **Múltiplas instâncias** do mesmo tipo são suportadas

---

**Tempo estimado:** 5-10 minutos  
**Dificuldade:** Fácil  
**Reversível:** Sim (fallback para env vars)

