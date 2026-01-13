# Guia de Migração - Sinesys Arquitetura 2.0

Este documento descreve como migrar o Sinesys para a arquitetura AI-First 2.0.

## Pré-requisitos

### Dependências
```bash
npm install @modelcontextprotocol/sdk
```

### Variáveis de Ambiente
```env
# OpenAI (obrigatório para IA)
OPENAI_API_KEY=sk-...

# Ou Cohere (alternativa)
AI_EMBEDDING_PROVIDER=cohere
COHERE_API_KEY=...

# Cache de embeddings (opcional)
AI_EMBEDDING_CACHE_ENABLED=true
```

### Supabase
1. Habilitar extensão `pgvector`
2. Executar migração: `supabase/migrations/20250101000000_create_embeddings_conhecimento.sql`

## Checklist de Migração

### Fase 1: Infraestrutura Core

- [ ] Criar `src/lib/safe-action.ts`
- [ ] Criar `src/lib/ai/` (embedding, indexing, retrieval)
- [ ] Criar `src/lib/mcp/` (server, registry, utils)
- [ ] Adicionar dependência `@modelcontextprotocol/sdk`

### Fase 2: Integração MCP

- [ ] Criar `src/app/api/mcp/route.ts`
- [ ] Criar `src/app/api/mcp/messages/route.ts`
- [ ] Atualizar `.mcp.json` com servidor interno
- [ ] Registrar ferramentas em `registry.ts`

### Fase 3: Enriquecimento de Features

- [ ] Criar `RULES.md` para processos
- [ ] Criar `RULES.md` para partes
- [ ] Criar `RULES.md` para audiências
- [ ] Criar `RULES.md` para documentos
- [ ] Criar `RULES.md` para financeiro
- [ ] Refatorar actions para usar `authenticatedAction`

### Fase 4: Pipeline RAG

- [ ] Executar migração SQL para `embeddings_conhecimento`
- [ ] Criar feature de busca semântica
- [ ] Adicionar indexação automática em services
- [ ] Executar `npm run ai:reindex` para indexação inicial

### Fase 5: Documentação

- [ ] Criar `ARCHITECTURE.md`
- [ ] Atualizar `AGENTS.md` com seção 2.0
- [ ] Adicionar scripts em `package.json`

## Passo a Passo

### 1. Instalar Dependência MCP

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Executar Migração SQL

```bash
# Via Supabase CLI
npx supabase db push

# Ou manualmente no Supabase Dashboard
# Execute: supabase/migrations/20250101000000_create_embeddings_conhecimento.sql
```

### 3. Configurar Variáveis de Ambiente

Adicionar ao `.env.local`:

```env
# IA/Embeddings
OPENAI_API_KEY=sua-chave-aqui
AI_EMBEDDING_CACHE_ENABLED=true

# MCP (opcional - para autenticação de clientes externos)
SINESYS_API_TOKEN=token-para-clientes-mcp
```

### 4. Testar MCP Localmente

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Em outro terminal, testar endpoint
curl http://localhost:3000/api/mcp/messages \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list", "id": 1}'
```

### 5. Indexar Documentos

```bash
# Reindexação completa (primeira vez)
npm run ai:reindex
```

### 6. Verificar Registry MCP

```bash
# Lista actions não registradas
npm run mcp:check
```

## Refatoração de Actions

### Antes (Padrão Antigo)

```typescript
export async function actionCriarProcesso(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = formDataToInput(formData);
    const validation = schema.safeParse(rawData);
    if (!validation.success) {
      return { success: false, error: '...' };
    }
    const result = await criarProcesso(validation.data);
    revalidatePath('/processos');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: '...' };
  }
}
```

### Depois (Arquitetura 2.0)

```typescript
import { authenticatedAction } from '@/lib/safe-action';

export const actionCriarProcesso = authenticatedAction(
  createProcessoSchema,
  async (data, { user }) => {
    const result = await criarProcesso(data);
    revalidatePath('/processos');
    return {
      message: 'Processo criado com sucesso',
      processo: result.data
    };
  }
);
```

### Benefícios
- 70% menos código
- Validação automática
- Compatível com UI (FormData) e MCP (JSON)
- Contexto do usuário injetado automaticamente

## Adicionar Indexação a Service

### Exemplo: Processos

```typescript
// src/features/processos/service.ts
import { after } from 'next/server';
import { indexarDocumento } from '@/lib/ai/indexing';

export async function criarProcesso(input: CreateProcessoInput) {
  const processo = await repository.create(input);

  // Indexar de forma assíncrona
  after(async () => {
    await indexarDocumento({
      texto: `
        Processo ${processo.numeroProcesso}
        Parte Autora: ${processo.nomeParteAutora}
        Parte Ré: ${processo.nomeParteRe}
      `,
      metadata: {
        tipo: 'processo',
        id: processo.id,
        numeroProcesso: processo.numeroProcesso,
      }
    });
  });

  return { success: true, data: processo };
}
```

## Criar RULES.md para Feature

### Template

```markdown
# Regras de Negócio - [Nome da Feature]

## Contexto
[Descrição do domínio]

## Regras de Validação
- [Regra 1]
- [Regra 2]

## Regras de Negócio
- [Regra 1]
- [Regra 2]

## Fluxos Especiais
- [Fluxo 1]

## Restrições de Acesso
- [Restrição 1]

## Integrações
- [Sistema 1]
```

## Troubleshooting

### Erro: "OPENAI_API_KEY não configurada"
Verificar se a variável está definida em `.env.local` e reiniciar o servidor.

### Erro: "Tabela embeddings_conhecimento não existe"
Executar a migração SQL no Supabase.

### Erro: "Ferramenta não encontrada"
Verificar se a action está registrada em `src/lib/mcp/registry.ts`.

### Performance lenta na busca
1. Verificar se índice IVFFlat foi criado
2. Habilitar cache Redis
3. Aumentar `lists` no índice para datasets maiores

## Rollback

Se necessário reverter a migração:

1. Remover endpoints MCP: `rm -rf src/app/api/mcp`
2. Remover lib MCP/AI: `rm -rf src/lib/mcp src/lib/ai`
3. Remover dependência: `npm uninstall @modelcontextprotocol/sdk`
4. Reverter migrations no Supabase
5. Restaurar actions antigas do git

## Suporte

Em caso de dúvidas:
1. Verificar `ARCHITECTURE.md`
2. Consultar `AGENTS.md`
3. Verificar arquivos `RULES.md` das features
