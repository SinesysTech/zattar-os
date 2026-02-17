# 🔄 Migration: Adicionar tipo "chatflow" ao Dify

## Problema
O tipo `chatflow` estava faltando na constraint da tabela `dify_apps`, causando o erro:
```
new row for relation "dify_apps" violates check constraint "dify_apps_app_type_check"
```

## Solução

### Opção 1: Aplicar via Supabase Dashboard (RECOMENDADO)

1. **Acesse o Supabase Dashboard**: https://supabase.com/dashboard
2. **Selecione seu projeto**
3. **Vá em "SQL Editor"** no menu lateral esquerdo
4. **Cole e execute o SQL abaixo**:

```sql
ALTER TABLE dify_apps DROP CONSTRAINT IF EXISTS dify_apps_app_type_check;

ALTER TABLE dify_apps ADD CONSTRAINT dify_apps_app_type_check 
  CHECK (app_type IN ('chat', 'chatflow', 'workflow', 'completion', 'agent'));

COMMENT ON COLUMN dify_apps.app_type IS 
  'Tipo do aplicativo Dify: chat (chatbot básico), chatflow (conversas multi-turn com memória), workflow (tarefas single-turn), completion (geração de texto), agent (agente com ferramentas)';
```

5. **Clique em "Run"** (ou pressione Ctrl/Cmd + Enter)

### Opção 2: Via Script (mostra instruções)

Execute o script que mostra as instruções:

```bash
npx tsx scripts/apply-dify-chatflow-migration.ts
```

### Opção 3: Via psql (se tiver acesso direto ao banco)

```bash
psql $DATABASE_URL -c "
ALTER TABLE dify_apps DROP CONSTRAINT IF EXISTS dify_apps_app_type_check;
ALTER TABLE dify_apps ADD CONSTRAINT dify_apps_app_type_check 
  CHECK (app_type IN ('chat', 'chatflow', 'workflow', 'completion', 'agent'));
"
```

## Verificação

Após aplicar a migration, você pode verificar se funcionou:

```sql
-- Verificar a constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'dify_apps'::regclass
  AND conname = 'dify_apps_app_type_check';
```

Deve retornar:
```
constraint_name: dify_apps_app_type_check
constraint_definition: CHECK ((app_type = ANY (ARRAY['chat'::text, 'chatflow'::text, 'workflow'::text, 'completion'::text, 'agent'::text])))
```

## Tipos de Aplicativos Dify

Após a migration, os seguintes tipos estarão disponíveis:

| Tipo | Descrição |
|------|-----------|
| `chat` | Chatbot básico para conversas simples |
| `chatflow` | ✨ **NOVO** - Conversas multi-turn com memória e variáveis de sessão |
| `workflow` | Automação de tarefas single-turn com lógica multi-step |
| `completion` | Geração de texto sem contexto de conversa |
| `agent` | Agente AI com acesso a ferramentas externas |

## Diferença: Chat vs Chatflow

- **Chat**: Conversas básicas, sem memória persistente entre sessões
- **Chatflow**: Mantém contexto entre múltiplos turnos, tem variáveis de sessão (`sys.conversation_id`, `sys.dialogue_count`), memória persistente

## Arquivos Modificados

- ✅ `src/features/dify/domain.ts` - Enum `TipoDifyApp` atualizado
- ✅ `src/features/dify/components/dify-apps-list.tsx` - Interface e UI atualizadas
- ✅ `supabase/migrations/20260216160000_add_chatflow_to_dify_apps.sql` - Migration criada
- ✅ `src/features/dify/README.md` - Documentação completa adicionada

## Referências

- [Dify Docs - Key Concepts](https://docs.dify.ai/en/use-dify/getting-started/key-concepts)
- [Dify Docs - Workflow vs Chatflow](https://docs.dify.ai/en/use-dify/getting-started/key-concepts#chatflow)
