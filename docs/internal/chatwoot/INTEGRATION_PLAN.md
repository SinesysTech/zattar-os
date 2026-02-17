# 🚀 Plano de Integração Chatwoot - Full Stack

**Objetivo:** Integração total entre Zattar e Chatwoot para gerenciamento de comunicação omnichannel  
**Data:** 17/02/2026  
**Status:** Planejamento → Implementação

---

## ⚙️ Setup & Configuração

### Pré-requisitos

1. **Instância Chatwoot ativa** com credenciais de acesso
2. **Contrato de tenant** ativo no Zattar
3. **Permissões de admin** para configurar integrações

### Configurar Chatwoot

**Via Tabela Integracoes** (recomendado):

1. Acessa **Configurações → Integrações**
2. Clica **"+ Nova Integração"**
3. Tipo: **"Chatwoot"**
4. Preencha os campos:
   - `api_url`: Sua instância Chatwoot (ex: https://chatwoot.seu-dominio.com)
   - `api_key`: Token gerado em **Chatwoot Settings → Account → API**
   - `account_id`: Número da conta Chatwoot
   - `default_inbox_id`: ID da inbox padrão (opcional)

**Via Variáveis de Ambiente** (deprecado, em transição):

```bash
CHATWOOT_API_URL=https://seu-chatwoot.com
CHATWOOT_API_KEY=seu_api_access_token
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_DEFAULT_INBOX_ID=abc123
```

> **Nota:** O sistema faz fallback automático para env vars durante transição.

### Validar Conexão

```bash
# Testar apenas com API Key
curl -H "api_access_token: {seu_api_key}" \
  https://seu-chatwoot.com/api/v1/accounts/1/conversations

# Se retornar { conversations: [...] }, está OK!
```

---

## 📋 Fases da Integração

### Fase 1: Sincronização de Contatos (Bi-direcional)

### Fase 2: Gerenciamento de Conversas em Tempo Real

### Fase 3: Dashboard Integrado & Notificações

### Fase 4: Automações & Fluxos de Trabalho

---

## 🔄 Fase 1: Sincronização de Contatos (Bi-direcional)

### 1.1 Mapeamento de Dados

```
Zattar                          Chatwoot
├─ clientes                     ├─ contacts (inbox)
├─ partes_contrarias      →     ├─ custom_attributes
├─ terceiros                    └─ identifier (unique)
│
├─ usuário_id                   pubsub_token (realtime)
├─ nome/email/telefone          name/email/phone_number
└─ documento (CPF/CNPJ)         custom_attributes.documento
```

### 1.2 Estrutura Mapeamento (Banco de Dados)

**Tabela: `partes_chatwoot` (já em migração)**

```sql
partes_chatwoot {
  id: integer
  tipo_entidade: 'cliente'|'parte_contraria'|'terceiro'     -- Tipo
  entidade_id: integer                                     -- ID local
  chatwoot_contact_id: integer                             -- ID Chatwoot
  chatwoot_account_id: integer                             -- Account
  chatwoot_inbox_id: string                                -- Inbox
  pubsub_token: string                                      -- WebSocket token
  ultima_sincronizacao: timestamp
  dados_sincronizados: jsonb                              -- Last state
  sincronizado: boolean
  erro_sincronizacao: string | null
  created_at: timestamp
  updated_at: timestamp
}
```

### 1.3 Ações de Sincronização

#### A. Criar Contato no Chatwoot (Zaztar → Chatwoot)

```typescript
// src/lib/chatwoot/contacts.ts - Função NOVA

interface SincronizarParteParams {
  tipo_entidade: 'cliente' | 'parte_contraria' | 'terceiro';
  entidade_id: number;
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  ativo?: boolean;
}

export async function sincronizarPartePara Chatwoot(
  params: SincronizarParteParams
): Promise<Result<PartesChatwoot>> {
  try {
    // 1. Verificar se já existe mapeamento
    const mapeamentoExistente = await findMapeamento(
      params.tipo_entidade,
      params.entidade_id
    );

    if (mapeamentoExistente?.sincronizado) {
      return ok(mapeamentoExistente);
    }

    // 2. Criar identifica único para o contato
    const identifier = `zattar_${params.tipo_entidade}_${params.entidade_id}`;

    // 3. Criar contato no Chatwoot via Public API
    const contactResponse = await fetch(
      `${CHATWOOT_API_URL}/public/api/v1/inboxes/${CHATWOOT_DEFAULT_INBOX_ID}/contacts`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          name: params.nome,
          email: params.email || undefined,
          phone_number: params.telefone || undefined,
          custom_attributes: {
            tipo_entidade: params.tipo_entidade,
            entidade_id: params.entidade_id,
            sistema_origem: 'zattar',
            ativo: params.ativo ?? true,
            documento: params.cpf_cnpj
          }
        })
      }
    );

    if (!contactResponse.ok) {
      throw new Error(`Chatwoot creation failed: ${await contactResponse.text()}`);
    }

    const chatwootData = await contactResponse.json();

    // 4. Armazenar mapeamento no banco
    const mapeamento = await criarMapeamento({
      tipo_entidade: params.tipo_entidade,
      entidade_id: params.entidade_id,
      chatwoot_contact_id: chatwootData.contact.id,
      chatwoot_account_id: CHATWOOT_ACCOUNT_ID,
      chatwoot_inbox_id: CHATWOOT_DEFAULT_INBOX_ID,
      pubsub_token: chatwootData.pubsub_token,
      dados_sincronizados: chatwootData,
      sincronizado: true
    });

    return ok(mapeamento);
  } catch (error) {
    logger.error('erro-sincronizar-parte-chatwoot', error);
    return err(appError('EXTERNAL_SERVICE_ERROR', error.message));
  }
}
```

#### B. Atualizar Contato no Chatwoot

```typescript
export async function atualizarContatoChatwoot(
  tipo_entidade: string,
  entidade_id: number,
  updates: {
    nome?: string;
    email?: string;
    telefone?: string;
  },
): Promise<Result<void>> {
  try {
    // 1. Buscar mapeamento
    const mapeamento = await findMapeamento(tipo_entidade, entidade_id);
    if (!mapeamento) {
      return err(appError("NOT_FOUND", "Mapeamento não encontrado"));
    }

    // 2. Atualizar via API (future implementation)
    // Para agora, será via webhook quando o contato é atualizado no Zattar

    return ok(void 0);
  } catch (error) {
    return err(appError("EXTERNAL_SERVICE_ERROR", error.message));
  }
}
```

#### C. Desincronizar (Soft-delete)

```typescript
export async function removerMapeamentoChatwoot(
  tipo_entidade: string,
  entidade_id: number,
): Promise<Result<void>> {
  try {
    const mapeamento = await findMapeamento(tipo_entidade, entidade_id);
    if (!mapeamento) {
      return err(appError("NOT_FOUND", "Mapeamento não encontrado"));
    }

    // Marcar como não sincronizado (não deletar)
    await updateMapeamento(mapeamento.id, { sincronizado: false });

    return ok(void 0);
  } catch (error) {
    return err(appError("EXTERNAL_SERVICE_ERROR", error.message));
  }
}
```

### 1.4 Hooks de Sincronização (Automática)

```typescript
// src/features/partes/hooks/useSyncChatwoot.ts - NOVO

export function useSyncChatwoot(tipoEntidade: 'cliente' | 'parte_contraria' | 'terceiro') {
  const { executeMutation } = useServerAction();

  const syncContact = useCallback(
    async (parte: Parte) => {
      const result = await sincronizarPartePara Chatwoot({
        tipo_entidade: tipoEntidade,
        entidade_id: parte.id,
        nome: parte.nome_razao_social,
        email: parte.email,
        telefone: parte.telefone,
        cpf_cnpj: parte.tipo_pessoa === 'pf' ? parte.cpf : parte.cnpj,
        ativo: parte.ativo
      });

      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    [tipoEntidade]
  );

  return { syncContact };
}
```

### 1.5 Sincronização em Lote

```typescript
// src/features/chatwoot/actions.ts - Função EXISTENTE (melhorar)

export async function sincronizarChatwootParaApp(
  params: {
    tipoEntidade?: "cliente" | "parte_contraria" | "terceiro" | "todos";
    apenasAtivos?: boolean;
    delayEntreSync?: number;
  } = {},
): Promise<Result<SincronizarChatwootParaAppResult>> {
  // Implementar busca de contatos no Chatwoot → mapeamento local
}

export async function sincronizarAppParaChatwoot(
  params: {
    tipoEntidade?: "cliente" | "parte_contraria" | "terceiro" | "todos";
    apenasAtivos?: boolean;
    delayEntreSync?: number;
  } = {},
): Promise<Result<SincronizarAppParaChatwootResult>> {
  // Implementar sync de partes → Chatwoot
}
```

---

## 💬 Fase 2: Gerenciamento de Conversas em Tempo Real

### 2.1 Estrutura de Conversas Síncronizadas

```
Zattar                              Chatwoot
├─ conversas_chatwoot (nova)        ├─ conversations (API)
│  ├─ id (PK)                       ├─ id
│  ├─ chatwoot_id                   ├─ uuid
│  ├─ tipo_entidade                 ├─ contact_id
│  ├─ entidade_id                   ├─ inbox_id
│  ├─ cliente_id                    ├─ status
│  ├─ usuario_id (assignee)         ├─ assignee_id
│  ├─ titulo/assunto                ├─ custom_attributes
│  ├─ status                        └─ created_at
│  ├─ ultima_atividade
│  ├─ mensagens_nao_lidas
│  └─ dados_sincronizados
```

### 2.2 Nova Tabela: conversas_chatwoot

```sql
CREATE TABLE conversas_chatwoot (
  id BIGSERIAL PRIMARY KEY,
  chatwoot_conversation_id INTEGER NOT NULL,
  chatwoot_account_id INTEGER NOT NULL,
  tipo_entidade VARCHAR(50) NOT NULL, -- 'cliente', 'parte_contraria', 'terceiro'
  entidade_id BIGINT NOT NULL,
  cliente_id BIGINT,
  usuario_id BIGINT, -- Agente atribuído
  titulo VARCHAR(255),
  status VARCHAR(50), -- 'open', 'resolved', 'on_hold'
  ultima_atividade TIMESTAMP,
  dados_sincronizados JSONB,
  sincronizado BOOLEAN DEFAULT true,
  UNIQUE(chatwoot_conversation_id),
  FOREIGN KEY(cliente_id) REFERENCES clientes(id),
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### 2.3 Criar Conversa Integrada

```typescript
// src/features/chatwoot/actions.ts - Função NOVA

interface CriarConversaIntegradaParams {
  tipo_entidade: 'cliente' | 'parte_contraria' | 'terceiro';
  entidade_id: number;
  titulo: string;
  primeira_mensagem: string;
  usuario_atribuido_id?: number;
  prioridade?: 'normal' | 'alta' | 'baixa';
}

export async function criarConversaIntegrada(
  params: CriarConversaIntegradaParams
): Promise<Result<ConversaChatwoot>> {
  try {
    // 1. Buscar mapeamento do contato
    const mapeamento = await findMapeamento(
      params.tipo_entidade,
      params.entidade_id
    );

    if (!mapeamento?.sincronizado) {
      // Criar contato se não existir
      const syncResult = await sincronizarPartePara Chatwoot({
        tipo_entidade: params.tipo_entidade,
        entidade_id: params.entidade_id,
        // ... dados do cliente
      });

      if (!syncResult.success) {
        return err(syncResult.error);
      }
    }

    // 2. Criar no Chatwoot
    const conversationResponse = await fetch(
      `${CHATWOOT_API_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations`,
      {
        method: 'POST',
        headers: {
          'api_access_token': CHATWOOT_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_id: `zattar_conv_${Date.now()}_${Math.random()}`,
          inbox_id: CHATWOOT_DEFAULT_INBOX_ID,
          contact_id: mapeamento.chatwoot_contact_id,
          status: 'open',
          assignee_id: params.usuario_atribuido_id,
          custom_attributes: {
            tipo_entidade: params.tipo_entidade,
            entidade_id: params.entidade_id,
            prioridade: params.prioridade || 'normal'
          },
          message: {
            content: params.primeira_mensagem,
            message_type: 'incoming'
          }
        })
      }
    );

    if (!conversationResponse.ok) {
      throw new Error(`Failed to create Chatwoot conversation`);
    }

    const chatwootConv = await conversationResponse.json();

    // 3. Armazenar mapeamento localmente
    const conversaChatwoot = await db.conversas_chatwoot.create({
      data: {
        chatwoot_conversation_id: chatwootConv.id,
        chatwoot_account_id: CHATWOOT_ACCOUNT_ID,
        tipo_entidade: params.tipo_entidade,
        entidade_id: params.entidade_id,
        usuario_id: params.usuario_atribuido_id,
        titulo: params.titulo,
        status: 'open',
        dados_sincronizados: chatwootConv,
        sincronizado: true
      }
    });

    return ok(conversaChatwoot);
  } catch (error) {
    logger.error('criar-conversa-integrada-erro', error);
    return err(appError('EXTERNAL_SERVICE_ERROR', error.message));
  }
}
```

### 2.4 Service Layer - Sincronização & Atribuição Inteligente (✅ IMPLEMENTADO)

**Arquivo:** `src/features/chatwoot/service.ts` (linhas 1310-1680)

#### 2.4.1 Sincronização de Conversas (conversas_chatwoot)

```typescript
// Sincronizar conversa do Chatwoot para banco local
export async function sincronizarConversaChatwoot(
  params: SincronizarConversaParams,
) {
  // Verifica se conversa já existe
  const contatoExistente = await findConversaPorChatwootId(
    params.chatwoot_conversation_id,
    params.chatwoot_account_id,
  );

  if (contatoExistente.data) {
    // Atualiza conversa existente com novos dados
    return atualizarConversa(contatoExistente.data.id, {
      status: params.status,
      assignee_id: params.assignee_id,
      message_count: params.message_count,
      unread_count: params.unread_count,
      ultima_sincronizacao: new Date(),
    });
  }

  // Cria nova conversa se não existe
  return criarConversa({
    chatwoot_conversation_id: params.chatwoot_conversation_id,
    chatwoot_account_id: params.chatwoot_account_id,
    chatwoot_inbox_id: params.chatwoot_inbox_id,
    status: params.status || "open",
    sincronizado: true,
    ultima_sincronizacao: new Date(),
  });
}
```

#### 2.4.2 Atribuição Inteligente (Smart Assignment)

**Algoritmo:** Distribuição de carga com filtro por habilidades

```typescript
// Seleciona agente disponível com menor carga de trabalho
export async function atribuirConversaInteligente(
  params: AtribuirConversaInteligentParams,
) {
  // 1. Lista agentes disponíveis (disponível=true)
  const agentes = await listarAgentesDisponíveis(
    params.chatwoot_account_id,
    params.habilidades_requeridas, // Opcional
  );

  // 2. Retorna agente com MENOR contador_conversas_ativas
  const agenteSelecionado = agentes[0];

  // 3. Atualiza conversa com agente
  if (params.conversacao_id) {
    await atualizarConversa(params.conversacao_id, {
      assignee_id: agenteSelecionado.chatwoot_agent_id,
    });
  }

  return ok(agenteSelecionado);
}
```

**Fluxo de Seleção:**

```
Todos os agentes da conta
  ↓ (Filter by disponível=true)
Agentes disponíveis
  ↓ (Filter by habilidades se requeridas)
Agentes com habilidades
  ↓ (Order by contador_conversas_ativas ASC)
Lista ordenada por carga
  ↓ (Select [0])
Agente com MENOR carga
```

#### 2.4.3 Sincronização de Agentes (usuarios_chatwoot)

```typescript
// Sincronizar agente do Chatwoot para banco local
export async function sincronizarAgenteChatwoot(
  params: SincronizarAgenteParams,
) {
  const agente = await findUsuarioPorChatwootId(
    params.chatwoot_agent_id,
    params.chatwoot_account_id,
  );

  if (agente.data) {
    // Atualiza agente existente
    return atualizarUsuario(agente.data.id, {
      email: params.email,
      nome_chatwoot: params.nome_chatwoot,
      role: params.role, // 'agent'|'supervisor'|'admin'
      disponivel: params.disponivel,
      habilidades: params.habilidades,
      max_conversas_simultaneas: params.max_conversas_simultaneas,
      ultima_sincronizacao: new Date(),
    });
  }

  // Cria novo agente
  return criarUsuario({
    chatwoot_agent_id: params.chatwoot_agent_id,
    chatwoot_account_id: params.chatwoot_account_id,
    email: params.email,
    nome_chatwoot: params.nome_chatwoot,
    role: params.role,
    disponivel: params.disponivel ?? true,
    habilidades: params.habilidades || [],
    max_conversas_simultaneas: params.max_conversas_simultaneas || 10,
    sincronizado: true,
  });
}
```

#### 2.4.4 Atualizar Disponibilidade

```typescript
// Sincronizar status do agente (online/offline)
export async function atualizarDisponibilidadeAgente(
  usuario_id: string,
  disponivel: boolean,
  disponivel_em?: Date,
) {
  return atualizarUsuarioPorUUID(usuario_id, {
    disponivel,
    disponivel_em: disponivel ? undefined : new Date(),
    ultima_sincronizacao: new Date(),
  });
}
```

---

### 2.5 Webhook: Sincronizar Eventos Chatwoot

```typescript
// src/app/api/webhooks/chatwoot/route.ts - NOVO

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    switch (event.event) {
      case 'message.created':
        await processar MessageCreated(event.data);
        break;

      case 'conversation.status_changed':
        await processarConversationStatusChanged(event.data);
        break;

      case 'assignee.changed':
        await processarAssigneeChanged(event.data);
        break;

      case 'contact.created':
        await processarContactCreated(event.data);
        break;

      default:
        logger.debug('webhook-evento-ignorado', event.event);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('webhook-chatwoot-erro', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processarMessageCreated(data: any) {
  // 1. Buscar conversa local via chatwoot_conversation_id
  const conversaChatwoot = await db.conversas_chatwoot.findUnique({
    where: { chatwoot_conversation_id: data.conversation.id }
  });

  if (!conversaChatwoot) {
    logger.warn('conversa-nao-mapeada', { chatwootConvId: data.conversation.id });
    return;
  }

  // 2. Criar documento/nota local com a mensagem
  await db.notas.create({
    data: {
      chatwoot_message_id: data.message.id,
      conversade_chatwoot_id: conversaChatwoot.id,
      conteudo: data.message.content,
      autor_id: data.message.sender?.id,
      tipo: data.message.message_type === 'outgoing' ? 'resposta_agent' : 'cliente',
      created_at: new Date(data.message.created_at),
      dados_originais: data.message
    }
  });

  // 3. Notificar usuários interessados
  await enviarNotificacao({
    tipo: 'nova_mensagem_chatwoot',
    conversaChatwootId: conversaChatwoot.id,
    usuario_id: conversaChatwoot.usuario_id
  });
}

async function processarConversationStatusChanged(data: any) {
  const conversaChatwoot = await db.conversas_chatwoot.findUnique({
    where: { chatwoot_conversation_id: data.conversation.id }
  });

  if (!conversaChatwoot) return;

  // Atualizar status
  await db.conversas_chatwoot.update({
    where: { id: conversaChatwoot.id },
    data: {
      status: data.conversation.status,
      updated_at: new Date()
    }
  });

  // Notificar sobre resolução
  if (data.conversation.status === 'resolved') {
    await enviarNotificacao({
      tipo: 'conversa_resolvida',
      conversaChatwootId: conversaChatwoot.id
    });
  }
}
```

#### 2.5.1 Webhook Handlers Unificados (✅ IMPLEMENTADO)

**Arquivo:** `src/features/chatwoot/service.ts` (linhas 1570-1680)

Os três handlers principais para processar eventos do Chatwoot:

```typescript
// Router genérico - direciona para handler específico
export async function processarWebhook(
  event: WebhookEventType,
  payload: WebhookPayload,
) {
  if (event.startsWith("conversation")) {
    return processarWebhookConversa(event, payload);
  } else if (event.startsWith("agent")) {
    return processarWebhookAgente(event, payload);
  }
  // Outros eventos apenas logados
  return ok(undefined);
}

// Handler de eventos de conversa
export async function processarWebhookConversa(
  event: WebhookEventType,
  payload: WebhookPayload,
) {
  const conversationId = payload.data?.id;
  const accountId = payload.account_id;

  if (event === "conversation.created") {
    // 1. Sincroniza nova conversa para DB
    const syncResult = await sincronizarConversaChatwoot({
      chatwoot_conversation_id: conversationId,
      chatwoot_account_id: accountId,
      chatwoot_inbox_id: payload.data?.inbox_id,
      status: payload.data?.status || "open",
    });

    // 2. Se não tiver agente, atribui automaticamente
    if (!payload.data?.assignee_id && syncResult.success) {
      await atribuirConversaInteligente({
        conversacao_id: syncResult.data.id,
        chatwoot_conversation_id: conversationId,
        chatwoot_account_id: accountId,
      });
    }
  } else if (event === "conversation.status_changed") {
    // Atualiza status no banco local
    await atualizarStatusConversa(
      conversationId,
      accountId,
      payload.data?.status,
    );
  }
}

// Handler de eventos de agente
export async function processarWebhookAgente(
  event: WebhookEventType,
  payload: WebhookPayload,
) {
  if (event === "agent.status_changed") {
    const agentId = payload.data?.id;
    const accountId = payload.account_id;

    // Busca usuário local e atualiza disponibilidade
    const usuario = await findUsuarioPorChatwootId(agentId, accountId);

    if (usuario.data) {
      const disponivel =
        payload.data?.availability_status === "available" &&
        payload.data?.presence_status !== "offline";

      await atualizarDisponibilidadeAgente(
        usuario.data.usuario_id,
        disponivel,
        disponivel ? undefined : new Date(),
      );
    }
  }
}
```

**Fluxo de Processamento:**

```
Webhook Recebido (POST /api/webhooks/chatwoot)
  ↓
processarWebhook(event, payload)
  ↓
  ├─→ conversation.* → processarWebhookConversa()
  │    ↓
  │    ├─ conversation.created
  │    │   ├→ sincronizarConversaChatwoot()  [Criar em DB]
  │    │   └→ atribuirConversaInteligente()   [Smart assign]
  │    │
  │    ├─ conversation.updated
  │    │   └→ sincronizarConversaChatwoot()  [Atualizar DB]
  │    │
  │    └─ conversation.status_changed
  │        └→ atualizarStatusConversa()      [Sync status]
  │
  └─→ agent.* → processarWebhookAgente()
       ↓
       └─ agent.status_changed
           ├→ findUsuarioPorChatwootId()     [Buscar local]
           └→ atualizarDisponibilidadeAgente() [Sync status]
```

### 2.6 Action Layer - HTTP Endpoints (✅ IMPLEMENTADO)

**Arquivos:**

- `src/app/api/webhooks/chatwoot/route.ts` - Webhook handler
- `src/app/api/chatwoot/conversas/[id]/route.ts` - Conversation endpoints
- `src/features/chatwoot/actions.ts` - Server actions (linhas 828-1050)

#### 2.6.1 Webhook Endpoint

**POST /api/webhooks/chatwoot**

Recebe eventos do Chatwoot e roteia para handlers específicos.

```bash
curl -X POST http://localhost:3000/api/webhooks/chatwoot \
  -H "Content-Type: application/json" \
  -d '{
    "event": "conversation.created",
    "account_id": 1,
    "data": {
      "id": 123,
      "inbox_id": 456,
      "status": "open",
      "messages_count": 0,
      "unread_count": 1
    }
  }'
```

**Response:**

```json
{
  "ok": true,
  "processed": true,
  "event": "conversation.created"
}
```

**Comportamento:**

- Válida presença do campo `event`
- Loga evento com conta e timestamp
- Processa via `processarWebhookChatwoot()`
- Retorna 200 mesmo em erro (evita retry infinito)

**Health Check:**

```bash
GET /api/webhooks/chatwoot
```

#### 2.6.2 Sincronizar Conversa (Manual)

**PUT /api/chatwoot/conversas/:id?accountId=1**

Sincroniza uma conversa específica manualmente para o banco local.

```bash
curl -X PUT http://localhost:3000/api/chatwoot/conversas/123?accountId=1 \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "sincronizado": true
}
```

**Parâmetros:**

- `:id` (URL path) - ID da conversa no Chatwoot
- `accountId` (query param) - ID da conta no Chatwoot

**Fluxo:**

1. Busca details da conversa no Chatwoot via API
2. Valida se conversa existe
3. Sincroniza para tabela `conversas_chatwoot`
4. Retorna status

#### 2.6.3 Atualizar Status da Conversa

**PATCH /api/chatwoot/conversas/:id**

Atualiza status de uma conversa no Chatwoot e no banco local.

```bash
curl -X PATCH http://localhost:3000/api/chatwoot/conversas/123 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "accountId": 1
  }'
```

**Request Body:**

```json
{
  "status": "open | resolved | pending | snoozed",
  "accountId": 1
}
```

**Response:**

```json
{
  "ok": true,
  "conversationId": 123,
  "status": "resolved"
}
```

**Parâmetros:**

- `:id` (URL path) - ID da conversa
- `status` (body) - Novo status (validado contra enum)
- `accountId` (body) - ID da conta

**Fluxo:**

1. Valida `status` (deve ser um dos valores permitidos)
2. Valida `accountId`
3. Atualiza status no Chatwoot via API
4. Atualiza status no banco local
5. Não falha se atualização local falhar (prioritiza remoto)

---

## 👥 Fase 3: Dashboard Integrado & Perfil do Cliente

### 3.1 Componente: Histórico de Conversas (Perfil)

```typescript
// src/components/cliente/historico-conversas-chatwoot.tsx

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function HistoricoConversasChatwoot({ clienteId, tipoEntidade }) {
  const [conversas, setConversas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConversas() {
      const res = await fetch(
        `/api/clientes/${clienteId}/chatwoot/conversas?tipo=${tipoEntidade}`
      );
      const data = await res.json();
      setConversas(data);
      setLoading(false);
    }

    fetchConversas();
  }, [clienteId, tipoEntidade]);

  if (loading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Conversas Chatwoot
          <Badge variant="outline">{conversas.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {conversas.map((conversa) => (
          <div
            key={conversa.id}
            className="border rounded-lg p-3 hover:bg-accent cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold">{conversa.titulo}</h4>
                <p className="text-sm text-muted-foreground">
                  {conversa.resumo}
                </p>
              </div>
              <Badge
                variant={
                  conversa.status === 'open' ? 'default' : 'secondary'
                }
              >
                {conversa.status === 'open' ? 'Aberta' : 'Resolvida'}
              </Badge>
            </div>

            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
              <span>Últimas mensagens: {conversas.mensagens_nao_lidas}</span>
              <span>{new Date(conversa.ultima_atividade).toLocaleDateString()}</span>
            </div>

            {/* Chat inline */}
            <ChatInlineChatwoot conversaId={conversa.chatwoot_conversation_id} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### 3.2 Endpoint: Listar Conversas do Cliente

```typescript
// src/app/api/clientes/[id]/chatwoot/conversas/route.ts

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clienteId = parseInt(params.id);
    const tipoEntidade = req.nextUrl.searchParams.get("tipo") || "cliente";

    // 1. Buscar conversas mapeadas
    const conversas = await db.conversas_chatwoot.findMany({
      where: {
        entidade_id: clienteId,
        tipo_entidade: tipoEntidade,
        sincronizado: true,
      },
      orderBy: { ultima_atividade: "desc" },
    });

    // 2. Buscar últimas mensagens para cada conversa
    const conversasComMensagens = await Promise.all(
      conversas.map(async (conv) => {
        const mensagens = await fetch(
          `${CHATWOOT_API_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conv.chatwoot_conversation_id}/messages`,
          {
            headers: {
              api_access_token: CHATWOOT_API_KEY,
            },
          },
        ).then((r) => r.json());

        return {
          ...conv,
          mensagens: mensagens.data,
          mensagens_nao_lidas: mensagens.data.filter((m) => !m.read).length,
          resumo: mensagens.data[0]?.content?.substring(0, 100) || "",
        };
      }),
    );

    return NextResponse.json(conversasComMensagens);
  } catch (error) {
    logger.error("get-conversas-cliente-erro", erro);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 3.3 Dashboard: Conversas Atribuídas

```typescript
// src/app/(dashboard)/chatwoot/conversas.tsx

'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { useServerAction } from '@/hooks/use-server-action';

export default function ConversasAtribuidasPage() {
  const [conversas, setConversas] = useState([]);
  const { executeAction, loading } = useServerAction();

  useEffect(() => {
    async function loadConversas() {
      const result = await executeAction(async () => {
        const res = await fetch(
          '/api/chatwoot/conversas/minhas?status=open'
        );
        return res.json();
      });
      setConversas(result);
    }

    loadConversas();
  }, []);

  const columns = [
    {
      accessorKey: 'id',
      header: '#'
    },
    {
      accessorKey: 'cliente_nome',
      header: 'Cliente'
    },
    {
      accessorKey: 'titulo',
      header: 'Título'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.original.status} />
    },
    {
      accessorKey: 'mensagens_nao_lidas',
      header: 'Não Lidas'
    },
    {
      accessorKey: 'ultima_atividade',
      header: 'Última Atividade'
    }
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Minhas Conversas</h1>
      <DataTable
        columns={columns}
        data={conversas}
        loading={loading}
        onRowClick={(row) => {
          // Abrir chat inline
        }}
      />
    </div>
  );
}
```

---

## 🤖 Fase 4: Automações & Fluxos

### 4.1 Atribuição Automática de Agentes

```typescript
// src/lib/chatwoot/auto-assignment.ts

export async function atribuirAgenteAutomaticamente(
  conversaChatwootId: number,
  tipoEntidade: string,
  entidadeId: number,
): Promise<Result<void>> {
  try {
    // 1. Lógica de atribuição (round-robin, skills, disponibilidade, etc)
    const agenteIdeal = await findAgenteDisponivel({
      tipoEntidade,
      skills: ["lei_civil", "consultoria"], // exemplo
    });

    if (!agenteIdeal) {
      return err(appError("NO_AGENTS_AVAILABLE", "Nenhum agente disponível"));
    }

    // 2. Atualizar no Chatwoot
    await fetch(
      `${CHATWOOT_API_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversaChatwootId}`,
      {
        method: "PUT",
        headers: {
          api_access_token: CHATWOOT_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignee_id: agenteIdeal.chatwoot_agent_id,
        }),
      },
    );

    // 3. Notificar agente
    await sendNotificacao({
      userId: agenteIdeal.id,
      tipo: "conversa_atribuida",
      conversaChatwootId,
    });

    return ok(void 0);
  } catch (error) {
    return err(appError("EXTERNAL_SERVICE_ERROR", error.message));
  }
}
```

### 4.2 Respostas Automáticas

```typescript
// src/lib/chatwoot/auto-responses.ts

const AUTO_RESPONSES = {
  horario_fora:
    "Obrigado por sua mensagem! Estou offline no momento. Responderei assim que possível.",
  aguardando_docs: "Aguardando documentos. Envie para: docs@zattar.com.br",
  resolucao_padrao:
    "Caso resolvido. Você pode abrir uma nova conversa se tiver outras dúvidas.",
};

export async function enviarRespostaAutomatica(
  conversaChatwootId: number,
  tipoResposta: keyof typeof AUTO_RESPONSES,
): Promise<Result<void>> {
  try {
    const content = AUTO_RESPONSES[tipoResposta];

    await fetch(
      `${CHATWOOT_API_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversaChatwootId}/messages`,
      {
        method: "POST",
        headers: {
          api_access_token: CHATWOOT_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          message_type: "outgoing",
          private: false,
          content_type: "text",
        }),
      },
    );

    return ok(void 0);
  } catch (error) {
    return err(appError("EXTERNAL_SERVICE_ERROR", error.message));
  }
}
```

---

## 📊 Sincronização de Usuários/Agentes

### Mapeamento Usuário Zattar ↔ Agente Chatwoot

```sql
CREATE TABLE usuarios_chatwoot (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL UNIQUE,
  chatwoot_agent_id INTEGER,
  chatwoot_email VARCHAR(255),
  chatwoot_name VARCHAR(255),
  sincronizado BOOLEAN DEFAULT true,
  dados_sincronizados JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
);
```

### Sincronizar Agentes

```typescript
export async function sincronizarAgentesParaChatwoot(): Promise<
  Result<number>
> {
  try {
    // 1. Listar todos os usuários que podem ser agentes
    const usuarios = await db.usuarios.findMany({
      where: {
        ativo: true,
        role: { in: ["advogado", "supervisor", "admin"] },
      },
    });

    // 2. Para cada usuário, criar/atualizar agente no Chatwoot
    let count = 0;
    for (const usuario of usuarios) {
      try {
        // Verificar se já existe
        let mapeamento = await db.usuarios_chatwoot.findUnique({
          where: { usuario_id: usuario.id },
        });

        if (!mapeamento) {
          // Criar novo agente no Chatwoot
          const agentResponse = await fetch(
            `${CHATWOOT_API_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/agents`,
            {
              method: "POST",
              headers: {
                api_access_token: CHATWOOT_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: usuario.nome,
                email: usuario.email,
                role: "agent",
                ...mapRoleToPermissions(usuario.role),
              }),
            },
          );

          if (agentResponse.ok) {
            const agentData = await agentResponse.json();

            mapeamento = await db.usuarios_chatwoot.create({
              data: {
                usuario_id: usuario.id,
                chatwoot_agent_id: agentData.id,
                chatwoot_email: agentData.email,
                chatwoot_name: agentData.name,
                dados_sincronizados: agentData,
                sincronizado: true,
              },
            });

            count++;
          }
        }
      } catch (error) {
        logger.warn("sync-agent-erro", { usuarioId: usuario.id, error });
      }
    }

    return ok(count);
  } catch (error) {
    return err(appError("EXTERNAL_SERVICE_ERROR", error.message));
  }
}
```

---

## 📅 Timeline de Implementação

| Fase      | Tarefas                  | Tempo        |
| --------- | ------------------------ | ------------ |
| **1**     | Sincronização Contatos   | 2 semanas    |
| **2**     | Conversas em Realtime    | 2 semanas    |
| **3**     | Dashboard & Notificações | 1.5 semanas  |
| **4**     | Automações & Refinamento | 1 semana     |
| **Total** | Integração Full-Stack    | ~6.5 semanas |

---

## 🔄 Ciclo de Sincronização

```
Usuário Zattar
  ↓
  ├→ Criar/Editar Cliente
  │  └→ Hook: useSyncChatwoot
  │     └→ POST /public/api/v1/inboxes/contacts
  │        └→ Armazenar mapeamento
  │
  ├→ Enviar Mensagem em Conversa
  │  └→ Salvar localmente
  │     └→ POST /api/conversations/{id}/messages
  │        └→ Webhook: message.created
  │           └→ Sincronizar de volta
  │
  └→ Resolver Conversa
     └→ PUT /conversations/{id} status=resolved
        └→ Webhook: conversation.status_changed
           └→ Notificar usuário Zattar
```

---

## 📚 MCP Tools Necessárias (Registrer em Registry)

Além dos 17 tools já existentes:

```typescript
// src/lib/mcp/registries/chatwoot-tools.ts - ADICIONAR

// 18. Sincronizar contato completo
registerMcpTool({
  name: "chatwoot_sincronizar_completo",
  description: "Sincronização completa bidirecional com buscas por telefone",
  // ...
});

// 19-20. Conversas do usuário atribuído
registerMcpTool({
  name: "chatwoot_minhas_conversas",
  description: "List conversas atribuídas ao usuário atual",
  // ...
});

// 21-22. Histórico por cliente
registerMcpTool({
  name: "chatwoot_historico_cliente",
  description: "Todas as conversas de um cliente específico",
  // ...
});
```

---

## 🎯 Checklist de Implementação

- [x] Tabelas de banco criadas (`conversas_chatwoot`, `usuarios_chatwoot`) - Migrations criadas
- [x] API client Chatwoot expandido - 17 tools principais
- [x] Repository layer completo (CRUD para conversas e usuários)
- [x] Service layer sincronização implementado
- [x] Atribuição inteligente de conversas (smart assignment)
- [x] Webhook handlers criados (conversa e agente)
- [x] HTTP Endpoints criados (POST webhook, PUT/PATCH conversas)
- [ ] Webhooks configurados e testados em produção
- [ ] Sincronização bidirecional funcionando ponta-a-ponta
- [ ] UI components criados (histórico conversas, dashboard)
- [ ] Notificações em realtime (novos eventos)
- [ ] Testes de E2E (integração completa)
- [x] Documentação interna atualizada
- [ ] Deploy para produção

### Tarefas Imediatas (Próximas)

1. **Action Layer** - Endpoints HTTP para sincronização
   - `POST /api/chatwoot/sync/conversa` - Trigger manual
   - `GET /api/chatwoot/conversas/minhas` - Listar conversas do usuário
   - `POST /api/webhooks/chatwoot` - Receber eventos

2. **Unit Tests**
   - `sincronizarConversaChatwoot()`
   - `atribuirConversaInteligente()`
   - `processarWebhook*()` handlers
   - Cobertura: 80%+

3. **React Hooks & UI**
   - `useChatwootConversas()` - Fetch conversas
   - `useListarAgentes()` - Load balancing display
   - `ChatwootHistoricoComponent` - Perfil do cliente
   - `DashboardConversasComponent` - Dashboard agente

---

**Documento mantido por:** Jordan Medeiros  
**Baseado em:** Documentação oficial Chatwoot via Context7 (1075 snippets)  
**Última atualização:** 17/02/2026
