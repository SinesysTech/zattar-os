# 🏗️ Arquitetura de Sincronização Chatwoot-Zattar

**Objetivo:** Manter contatos, conversas e mensagens sincronizadas entre Zattar e Chatwoot  
**Padrão:** Bidirecional com reconciliação eventual e débito de autoridade  
**Data:** 17/02/2026

---

## 🎯 Princípios Arquiteturais

### 1. **Fonte Única de Verdade (SSOT)**

- Zattar = Fonte primária para dados de **clientes, partes, terceiros**
- Chatwoot = Fonte primária para **conversas e mensagens**
- Mapeamento = Tabela de reconciliação `partes_chatwoot`

### 2. **Sincronização Eventual**

- Não bloquear operação aguardando sync
- Notificar usuário do status
- Retry automático em background

### 3. **Idempotência**

- Todas as operações podem ser repetidas com segurança
- Usar `unique_identifier` para evitar duplicatas

### 4. **Auditoria Completa**

- Registrar toda sync (origem, destination, timestamp, status)
- Manter histórico de mudanças
- Facilitar debugging

---

## ⚙️ Configuração via Tabela Integracoes

As credenciais do Chatwoot são armazenadas na tabela **`integracoes`** (não em variáveis de ambiente):

### Schema

```sql
integracoes {
  id: UUID PRIMARY KEY,
  tipo: 'chatwoot' (enum),
  nome: string,
  descricao: string,
  ativo: boolean,
  configuracao: JSONB {
    api_url: string,
    api_key: string,
    account_id: number,
    default_inbox_id?: number
  },
  created_at: timestamp,
  updated_at: timestamp
}
```

### Como Ler Configuração

```typescript
// src/lib/chatwoot/config.ts

// Opção 1: Ler do banco (via integracoes)
const config = await getChatwootConfigFromDatabase();

// Opção 2: Com fallback para env vars (durante transição)
const config = await getChatwootConfigWithFallback();
```

### Vantagens

✅ Sem redeploy para mudar credenciais  
✅ UI no app para gerenciar integrações  
✅ Multi-tenant por default  
✅ Auditoria de alterações  
✅ Mesmo padrão que 2FAuth e Dify

---

## 📊 Diagrama de Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ZATTAR APP (Frontend)                         │
├─────────────┬──────────────────┬────────────────┬──────────────────┤
│ Dashboard   │ Perfil Cliente   │ Chat           │ Configurações    │
└─────┬───────┴──────────┬───────┴────────┬───────┴─────────┬────────┘
      │                  │                │                │
      └──────────┬───────┴────────┬───────┴───────┬────────┘
                 │                │               │
              Actions          Hooks         Server Actions
                 │                │               │
      ┌──────────┴────────┬───────┴────┬──────────┴──────┐
      │                   │            │                │
   ┌──▼────────────────────▼──────────▼───────────────▼──┐
   │     BACKEND INTEGRATION LAYER (src/features)      │
   ├─────┬─────────────────────────────────────┬────────┤
   │ API │ Service (Business Logic)            │ Action │
   │  +  │                                     │        │
   │Event│ • sincronizarPartePara Chatwoot    │ Muta   │
   │ Bus │ • updateContatoChatwoot            │ tions  │
   │     │ • criarConversaIntegrada           │        │
   │     │ • processarWebhookChatwoot         │        │
   └─────┴──────────────┬──────────────────────┴────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────────┐  ┌──▼──────────┐  ┌─▼──────────┐
   │  Supabase   │  │  MCP Tools  │  │Chatwoot    │
   │             │  │ Registry    │  │HTTP API    │
   │ ├─ partes   │  │             │  │            │
   │ ├─ clientes │  │ 17 tools    │  │ /api/v1    │
   │ ├─ conversas│  │ +8 novos    │  │ /public/   │
   │ ├─ usuarios │  │ =25 tools   │  │ /platform  │
   │ └─ mapeam.  │  │             │  │            │
   └─────────────┘  └─────────────┘  └────────────┘
        │                │                  │
        └────────────────┴──────────────────┘
                        │
                    Webhook
                   Listener
                   (NextJS)
                        │
                  ┌─────▼──────┐
                  │ Chatwoot   │
                  │ Instance   │
                  │            │
                  │ Events:    │
                  │ • conversation│
                  │ • message  │
                  │ • assignee │
                  │ • status   │
                  └────────────┘
```

---

## 🔄 Ciclos de Sincronização

### Ciclo 1: CRIAR CONTATO (Zattar → Chatwoot)

```
┌─────────────┐
│  Utilizador │─── Clica em "Sincronizar com Chatwoot"
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────┐
│ Hook: useSyncChatwoot()          │ ◄─── useCallback no componente
│ ├─ Validar dados                 │
│ ├─ Chamar action                 │
│ └─ Notificar resultado           │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Action: sincronizarPartePara... │ ◄─── Server Action
│ ├─ Verificar auth                │
│ ├─ Chamar service                │
│ └─ Retornar resultado            │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Service: sincronizarPartePara... │ ◄─── Lógica de negócio
│                                  │
│ 1. Buscar parte local (BD)       │
│    └─ SELECT FROM clientes       │
│                                  │
│ 2. Verificar mapeamento          │
│    ├─ SELECT FROM partes_chatwoot│
│    └─ IF EXISTS, retornar        │
│                                  │
│ 3. Criar identifier único        │
│    └─ identifier = "zattar_cli..."│
│                                  │
│ 4. POST /public/api/.../contacts│ ◄─── Chatwoot HTTP API
│    ├─ Payload: identifier, name...│
│    └─ Response: contactId, token │
│                                  │
│ 5. Armazenar mapeamento (BD)     │
│    └─ INSERT INTO partes_chatwoot│
│       ├─ chatwoot_contact_id     │
│       ├─ pubsub_token            │
│       └─ sincronizado = true     │
│                                  │
│ 6. Retornar sucesso              │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ UI: Mostrar resultado            │
│ ├─ ✅ "Sincronizado com sucesso"│
│ ├─ Atualizar mapeamento local    │
│ └─ Habilitar chat (PubSub)       │
└──────────────────────────────────┘

Tempo total: ~2s
Status BD: partes_chatwoot.sincronizado = true
```

### Ciclo 2: ENVIAR MENSAGEM (Zattar → Chatwoot)

```
┌──────────────────────────────┐
│ Usuário escreve mensagem     │
│ "Qual é o status do seu caso?"│
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ onSubmit → sendMessage()     │ ◄─── React event handler
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Action: enviarMensagem           │ ◄─── Server Action
│ ├─ Validar conteúdo              │
│ ├─ Verificar permissões          │
│ ├─ Chamar service                │
│ └─ Retornar resultado            │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Service: enviarMensagem          │ ◄─── Lógica biz
│                                  │
│ 1. Buscar conversa (mapeamento)  │
│    └─ SELECT chatwoot_conv_id    │
│       FROM conversas_chatwoot    │
│                                  │
│ 2. POST /api/conversations/.../  │ ◄─── Chatwoot Agent API
│    messages                      │
│    ├─ content: "Qual é status..."│
│    ├─ message_type: "outgoing"   │
│    └─ Response: message          │
│                                  │
│ 3. Salvar localmente (auditoria) │
│    └─ INSERT INTO notas          │
│       ├─ chatwoot_message_id     │
│       ├─ conteudo                │
│       └─ timestamp               │
│                                  │
│ 4. Publicar evento               │
│    └─ EventBus.emit('message.sent')
│       ├─ Notificar agentes       │
│       └─ Atualizar cache         │
│                                  │
│ 5. Retornar sucesso + ID         │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ UI: Atualizar lista mensagens    │
│ ├─ Adicionar mensagem local      │
│ ├─ Mostrar checkmark             │
│ └─ Scroll para bottom            │
└──────────────────────────────────┘

Tempo total: ~1s
Status BD: notas com chatwoot_message_id
```

### Ciclo 3: RECEBER MENSAGEM (Chatwoot → Zattar via Webhook)

```
┌─────────────────────┐
│ Agente no Chatwoot  │─ "Sim, seu caso avança bem"
│ digita mensagem     │
└──────────┬──────────┘
           │
           ▼
     ┌──────────┐
     │ Chatwoot │
     │ Backend  │
     └────┬─────┘
          │
  [evento: message.created]
          │
          ▼
┌──────────────────────────────────┐
│ Webhook → Zattar                 │
│ POST /api/webhooks/chatwoot      │ ◄─── NextJS Route Handler
│                                  │
│ Body: {                          │
│   event: 'message.created',      │
│   data: {                        │
│     message: {                   │
│       id: 456,                   │
│       content: "...",            │
│       conversation_id: 123       │
│     }                            │
│   }                              │
│ }                                │
└──────────┬───────────────────────┘
           │ ✅ 200 OK (rápido)
           │
           ▼ (Background Job)
┌──────────────────────────────────┐
│ processarWebhookChatwoot()       │ ◄─── Função assíncrona
│                                  │
│ 1. Validar origem (signature)    │
│    └─ VALIDATE_WEBHOOK_SIGNATURE │
│                                  │
│ 2. Buscar conversa local         │
│    └─ SELECT FROM conversas_..   │
│       WHERE chatwoot_conv_id=123 │
│                                  │
│ 3. Criar nota/documento          │
│    └─ INSERT INTO notas          │
│       ├─ conteudo: "msg..."      │
│       ├─ autor_id: agent.id      │
│       ├─ chatwoot_message_id:456 │
│       └─ tipo: 'resposta_agent'  │
│                                  │
│ 4. Notificar usuários (SSE)      │
│    └─ sendNotification()         │
│       ├─ userId: cliente.usuario_id
│       ├─ tipo: 'nova_msg_chatwoot'
│       └─ payload: nota           │
│                                  │
│ 5. Atualizar cache               │
│    └─ INVALIDATE conversas:{id}  │
│                                  │
│ 6. Log auditoria                 │
│    └─ INSERT INTO audit_logs     │
│       ├─ acao: 'webhook_msg'     │
│       └─ origem: 'chatwoot'      │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Real-time Update → Cliente       │
│                                  │
│ 1. SSE: nova mensagem            │
│ 2. Sound notification (opt.)     │
│ 3. Badge count atualizado        │
│ 4. Chat aberto auto-scroll       │
└──────────────────────────────────┘

Tempo total: <2s
Confiabilidade: Retry automático se falhar
```

---

## 🗄️ Estrutura de Dados

### Tabela: `partes_chatwoot`

```sql
partes_chatwoot {
  id: BIGSERIAL PRIMARY KEY

  -- Identificação Zattar
  tipo_entidade: VARCHAR(50)           -- 'cliente'|'parte_contraria'|'terceiro'
  entidade_id: BIGINT                  -- PK de clientes|partes|terceiros

  -- Identificação Chatwoot
  chatwoot_contact_id: INTEGER NOT NULL
  chatwoot_account_id: INTEGER NOT NULL
  chatwoot_inbox_id: VARCHAR(255)

  -- Realtime
  pubsub_token: VARCHAR(500)            -- Para WebSocket

  -- Sync Metadata
  ultima_sincronizacao: TIMESTAMP
  dados_sincronizados: JSONB            -- Snapshot do último sync
  sincronizado: BOOLEAN DEFAULT true
  erro_sincronizacao: TEXT

  -- Auditoria
  created_at: TIMESTAMP DEFAULT now()
  updated_at: TIMESTAMP DEFAULT now()

  -- Indices
  UNIQUE(tipo_entidade, entidade_id)
  UNIQUE(chatwoot_contact_id)
  INDEX(sincronizado, tipo_entidade)
}
```

### Tabela: `conversas_chatwoot`

```sql
conversas_chatwoot {
  id: BIGSERIAL PRIMARY KEY

  -- Chatwoot
  chatwoot_conversation_id: INTEGER NOT NULL UNIQUE
  chatwoot_account_id: INTEGER NOT NULL

  -- Zattar
  tipo_entidade: VARCHAR(50)
  entidade_id: BIGINT
  cliente_id: BIGINT
  usuario_id: BIGINT                    --Agente atribuído

  -- Conteúdo
  titulo: VARCHAR(255)
  assunto: TEXT
  status: VARCHAR(50)                   -- 'open'|'resolved'|'on_hold'
  prioridade: VARCHAR(50)

  -- Sync
  ultima_atividade: TIMESTAMP
  mensagens_nao_lidas: INTEGER DEFAULT 0
  dados_sincronizados: JSONB
  sincronizado: BOOLEAN DEFAULT true

  -- Auditoria
  created_at: TIMESTAMP DEFAULT now()
  updated_at: TIMESTAMP DEFAULT now()

  -- Indices
  INDEX(cliente_id, ultima_atividade)
  INDEX(usuario_id, status)
  INDEX(sincronizado)
}
```

### Tabela: `audit_logs` (Adicionar coluna chatwoot)

```sql
ALTER TABLE audit_logs ADD COLUMN (
  origem_externa: VARCHAR(50),         -- 'chatwoot', 'whatsapp', etc
  id_externo: VARCHAR(255),            -- ID Chatwoot message/conv
  payload_externo: JSONB               -- Dados brutos do webhook
);
```

---

## 🔌 Interfaces TypeScript

### Interface: PartesChatwoot

```typescript
interface PartesChatwoot {
  id: number;
  tipo_entidade: "cliente" | "parte_contraria" | "terceiro";
  entidade_id: number;
  chatwoot_contact_id: number;
  chatwoot_account_id: number;
  chatwoot_inbox_id: string;
  pubsub_token: string;
  ultima_sincronizacao: Date;
  dados_sincronizados: {
    contact: ChatwootContact;
    pubsub_token: string;
    [key: string]: unknown;
  };
  sincronizado: boolean;
  erro_sincronizacao: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ConversaChatwoot {
  id: number;
  chatwoot_conversation_id: number;
  chatwoot_account_id: number;
  tipo_entidade: string;
  entidade_id: number;
  cliente_id?: number;
  usuario_id?: number;
  titulo?: string;
  status: "open" | "resolved" | "on_hold";
  ultima_atividade: Date;
  mensagens_nao_lidas: number;
  sincronizado: boolean;
  created_at: Date;
  updated_at: Date;
}
```

---

## 🔄 Padrões de API

### Service Layer (Biz Logic)

```typescript
// ✅ PADRÃO BOM
export async function sincronizarPartePara Chatwoot(
  params: SincronizarParteParams
): Promise<Result<PartesChatwoot>> {
  // Service nunca lança erro (sempre Result)
  // Service é responsável pela orquestração
}

// ✅ Repository Layer
export async function criarMapeamento(
  data: CreateMapeamentoInput
): Promise<PartesChatwoot> {
  // Repository pode lançar erro
  // Repository é responsável apenas por DB
}

// ✅ Action Layer
export async function sincronizarParte Action(params) {
  // Action valida auth + chamada service
}
```

---

## 🔐 Segurança & Validação

### Webhook Signature Validation

```typescript
import crypto from "crypto";

export function validateWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const hmac = crypto
    .createHmac("sha256", CHATWOOT_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}
```

### Rate Limiting

```typescript
// Limitar sincronizações por cliente
const SYNC_RATE_LIMITS = {
  cliente: 5, // 5 sync por minuto
  parte_contraria: 3,
  terceiro: 2,
};

// Implementar via Redis/cache
async function checkRateLimit(tipo: string): Promise<boolean> {
  const key = `sync:${tipo}:${usuario_id}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 60);
  }

  return count <= SYNC_RATE_LIMITS[tipo];
}
```

---

## 📐 Padrões de Erro

### Error Handling Consistente

```typescript
// Definir em um arquivo central
export const CHATWOOT_ERRORS = {
  CONTACT_NOT_FOUND: {
    code: 404,
    message: "Contato não encontrado no Chatwoot",
    retry: false,
  },
  INVALID_IDENTIFIER: {
    code: 400,
    message: "Identificador duplicado",
    retry: false,
  },
  API_TIMEOUT: {
    code: 504,
    message: "Timeout na chamada à API",
    retry: true,
    backoff: "exponencial",
  },
  RATE_LIMIT: {
    code: 429,
    message: "Rate limit excedido",
    retry: true,
    backoff: "exponencial",
  },
};

// Usar em service
if (error.response?.status === 429) {
  return err(appError("RATE_LIMIT", CHATWOOT_ERRORS.RATE_LIMIT.message));
}
```

---

## 🔍 Monitoramento & Logging

### Estrutura de Logs

```typescript
// Usar logger estruturado (Pino)
logger.info({
  event: "chatwoot_sync_started",
  tipo_entidade: "cliente",
  entidade_id: 123,
  timestamp: new Date(),
  usuario_id: req.user.id,
});

logger.error({
  event: "chatwoot_sync_failed",
  error: error.message,
  stack: error.stack,
  chatwoot_response: response.data,
  retry_attempts: retries,
});

// Dashboard: /admin/chatwoot/monitor
// - Total syncs por hora
// - Taxa de sucesso/erro
// - API response times
// - Webhook latency
```

---

## 📋 Checklist de Implementação por Fase

### ✅ Fase 1: Infraestrutura

- [ ] Migrations BD (partes_chatwoot, conversas_chatwoot)
- [ ] Types TypeScript
- [ ] Repositories (CRUD)
- [ ] Service layer básico
- [ ] Testes unitários

### ✅ Fase 2: Sync Unidirecional

- [ ] Sincronizar Zattar → Chatwoot (contatos)
- [ ] MCP tools para sync
- [ ] Webhooks listener setup
- [ ] UI para trigger manual

### ✅ Fase 3: Sync Bidirecional

- [ ] Webhook validation
- [ ] procesarWebhookChatwoot
- [ ] Realtime updates via SSE/WebSocket
- [ ] Resolução de conflitos

### ✅ Fase 4: Automações

- [ ] Auto-assignment
- [ ] Auto-responders
- [ ] Status síncrono
- [ ] Dashboard

---

## 🧪 Exemplo de Teste

```typescript
describe('sincronizarPartePara Chatwoot', () => {
  it('deve criar contato no Chatwoot e mapeamento local', async () => {
    // Arrange
    const cliente = await createTestCliente();

    // Act
    const result = await sincronizarPartePara Chatwoot({
      tipo_entidade: 'cliente',
      entidade_id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.chatwoot_contact_id).toBeDefined();
    expect(result.data.sincronizado).toBe(true);

    // Verificar DB
    const mapeamento = await db.partes_chatwoot.findUnique({
      where: { chatwoot_contact_id: result.data.chatwoot_contact_id }
    });
    expect(mapeamento).toBeDefined();
  });

  it('deve retornar mapeamento existente se já sincronizado', async () => {
    // Arrange
    const mapeamento = await createTestMapeamento();

    // Act
    const result = await sincronizarPartePara Chatwoot({
      tipo_entidade: mapeamento.tipo_entidade,
      entidade_id: mapeamento.entidade_id,
      nome: 'Novo Nome'  // dados podem ter mudado
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(mapeamento.id);  // Mesmo mapeamento
  });
});
```

---

## 📱 Deployment Considerations

### Variáveis de Ambiente

```env
CHATWOOT_API_URL=https://seu-chatwoot.com
CHATWOOT_API_KEY=xxx
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_DEFAULT_INBOX_ID=abc
CHATWOOT_WEBHOOK_SECRET=xxx
CHATWOOT_PLATFORM_API_KEY=xxx
SYNC_BATCH_SIZE=50
SYNC_TIMEOUT_MS=30000
WEBHOOK_RETRY_ATTEMPTS=3
```

### Migrations Sequence

```sql
1. CREATE TABLE partes_chatwoot
2. CREATE TABLE conversas_chatwoot
3. ALTER TABLE audit_logs ADD origem_externa
4. CREATE INDICES
5. Verify constraints
6. Run backfill job (se necessário)
```

---

## 🎓 Documentação para Subagentes

**Quando um subagente for implementar uma tarefa:**

1. **Ler este documento** para entender a arquitetura
2. **Referenciar CHATWOOT_API_OFFICIAL.md** para detalhes de API
3. **Usar INTEGRATION_PLAN.md** para sequência de tarefas
4. **Testar offline** antes de integrar
5. **Enviar PR** com cobertura de testes

**Padrão de implementação:**

- `src/lib/chatwoot/` - Client + tipos
- `src/features/chatwoot/` - Service + actions + repository
- `src/app/api/webhooks/chatwoot/` - Webhook handlers
- `src/components/` - UI components
- `tests/` - Testes E2E

---

**Arquitetura mantida por:** Jordan Medeiros  
**Baseada em:** Documentação oficial Chatwoot via Context7  
**Versão:** 1.0 (17/02/2026)
