# Plano: Integração "Editor de Texto IA" nas Configurações

## Contexto

Atualmente o Plate AI usa variáveis de ambiente (`AI_GATEWAY_API_KEY`, `AI_DEFAULT_MODEL`, etc.) para configurar o provedor de IA. O objetivo é mover tudo para o banco de dados, gerenciável pela UI de Integrações.

### Providers suportados pelo Vercel AI SDK

O **Vercel AI SDK** suporta múltiplos provedores:
- `createGateway()` → **Vercel AI Gateway** (100+ modelos, chave única, formato `provider/model`)
- `createOpenAI()` → **OpenAI** e APIs compatíveis como **OpenRouter** (via `baseURL` customizada)
- `createAnthropic()` → **Anthropic** direto
- `createGoogleGenerativeAI()` → **Google AI** direto

**Sim, suporta OpenRouter** via `createOpenAI({ baseURL: 'https://openrouter.ai/api/v1' })`.

---

## Arquitetura

```
UI (Config Form) → Server Action → Service → Repository (DB: integracoes.configuracao JSONB)
                                                              ↓
API Route (Plate AI) ← getEditorIAConfig() ← cache 1min ← DB
                     ← createAIEditorProvider(config) → Vercel AI SDK Provider
```

## Escopo

### Arquivos a CRIAR (6)
1. `supabase/migrations/20260219000000_add_editor_ia_to_integracoes.sql` — Adicionar `editor_ia` ao CHECK constraint
2. `src/lib/ai-editor/config.ts` — Leitor de config do DB com cache 1min + fallback env vars
3. `src/lib/ai-editor/provider.ts` — Factory que cria o provider correto do AI SDK
4. `src/app/api/ai-editor/status/route.ts` — Endpoint "Testar Conexão"
5. `src/features/integracoes/components/editor-ia-integration-card.tsx` — Card na aba Integrações
6. `src/features/integracoes/components/editor-ia-config-form.tsx` — Formulário de configuração

### Arquivos a MODIFICAR (7)
1. `src/features/integracoes/domain.ts` — Adicionar `editor_ia` ao tipo + `editorIAConfigSchema`
2. `src/features/integracoes/service.ts` — Adicionar `buscarConfigEditorIA()` + `atualizarConfigEditorIA()`
3. `src/features/integracoes/actions/integracoes-actions.ts` — Adicionar `actionAtualizarConfigEditorIA`
4. `src/features/integracoes/index.ts` — Barrel exports
5. `src/app/app/configuracoes/page.tsx` — Fetch `editor_ia` integration
6. `src/app/app/configuracoes/components/configuracoes-tabs-content.tsx` — Renderizar card
7. `src/app/api/plate/ai/route.ts` — Trocar env vars por config do DB + provider dinâmico

### Dependências npm a instalar
- `@ai-sdk/anthropic` e `@ai-sdk/google` (para suportar providers diretos)

---

## Schema da configuração (JSONB)

```typescript
type AIProviderType = "gateway" | "openai" | "openrouter" | "anthropic" | "google";

interface EditorIAConfig {
  provider: AIProviderType;
  api_key: string;
  base_url?: string;           // Custom URL (OpenRouter, self-hosted, etc.)
  default_model: string;       // Ex: "openai/gpt-4o-mini"
  tool_choice_model?: string;  // Fallback: default_model
  comment_model?: string;      // Fallback: default_model
}
```

## Detalhes dos passos

### Passo 1 — Migration SQL
Adicionar `'editor_ia'` ao `CHECK (tipo IN (...))` da tabela `integracoes`. Mesmo padrão da migration do Dyte.

### Passo 2 — Domain (`domain.ts`)
- Adicionar `editor_ia: "editor_ia"` em `TIPOS_INTEGRACAO`
- Adicionar `"editor_ia"` no z.enum do `integracaoBaseSchema`
- Criar `editorIAConfigSchema` (Zod) com validação dos campos
- Exportar types `EditorIAConfig` e `AIProviderType`
- Adicionar labels e descrições nos Records

### Passo 3 — Service (`service.ts`)
- `buscarConfigEditorIA()` — busca por tipo+nome "Editor de Texto IA Principal", valida com Zod
- `atualizarConfigEditorIA(config)` — upsert (cria ou atualiza)
- Padrão idêntico ao `buscarConfigDyte`/`atualizarConfigDyte`

### Passo 4 — Actions
- `actionAtualizarConfigEditorIA` — server action com `authenticatedAction` + `revalidatePath`
- Chamar `invalidateEditorIAConfigCache()` após salvar

### Passo 5 — Runtime config (`src/lib/ai-editor/config.ts`)
- `getEditorIAConfig()` — lê do DB com cache 1min, fallback para env vars
- `invalidateEditorIAConfigCache()` — chamado após salvar config
- Padrão idêntico ao `src/lib/dyte/config.ts`

### Passo 6 — Provider factory (`src/lib/ai-editor/provider.ts`)
- `createAIEditorProvider(config)` — switch/case no `config.provider`:
  - `gateway` → `createGateway()`
  - `openai` → `createOpenAI()`
  - `openrouter` → `createOpenAI({ baseURL: 'https://openrouter.ai/api/v1' })`
  - `anthropic` → `createAnthropic()`
  - `google` → `createGoogleGenerativeAI()`

### Passo 7 — Endpoint status (`/api/ai-editor/status`)
- POST: recebe config parcial, cria provider, faz `generateText()` com 5 tokens max
- Retorna `{ connected: true/false, error? }`
- Padrão idêntico ao `/api/dyte/status`

### Passo 8 — Card de integração
- Dois estados: não configurado (botão "Configurar") e configurado (badge ativo/inativo, provider, modelo)
- Ícone: `Sparkles`
- Link "Gerenciar Prompts do Editor" → `?tab=prompts-ia`
- Padrão idêntico ao `DyteIntegrationCard`

### Passo 9 — Formulário de config
- Select: Provider (Gateway, OpenAI, OpenRouter, Anthropic, Google)
- Input: API Key (password)
- Input: Base URL (opcional, auto-preenchido para OpenRouter)
- Input: Modelo Padrão (com placeholder dinâmico por provider)
- Input: Modelo Tool Choice (opcional)
- Input: Modelo Comentários (opcional)
- Botão: "Testar Conexão" → POST `/api/ai-editor/status`
- Link: "Gerenciar Prompts" → `?tab=prompts-ia`
- Padrão idêntico ao `DyteConfigForm`

### Passo 10 — Wiring (page.tsx + tabs-content)
- Fetch `editor_ia` no `Promise.all` da page
- Passar prop `integracaoEditorIA` ao tabs-content
- Renderizar `<EditorIAIntegrationCard />` no grid de Integrações

### Passo 11 — Refatorar route.ts do Plate AI
- Remover constantes hardcoded de modelo e env var `AI_GATEWAY_API_KEY`
- Usar `getEditorIAConfig()` + `createAIEditorProvider()`
- Trocar `gatewayProvider(...)` por `aiProvider(...)`
- `DEFAULT_MODEL`, `TOOL_CHOICE_MODEL`, `COMMENT_MODEL` vêm do config

### Passo 12 — Verificação final
- `npx tsc --noEmit`
- `npm run build`

## Estratégia de fallback
1. Primeiro: tenta ler config do DB
2. Segundo: se não existir, usa env vars (`AI_GATEWAY_API_KEY`, etc.)
3. Terceiro: se nenhum existir, retorna 401 com mensagem orientativa
