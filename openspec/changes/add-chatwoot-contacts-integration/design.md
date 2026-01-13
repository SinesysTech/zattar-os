# Design: Integracao Chatwoot Contacts

## Context

O Chatwoot e a plataforma de comunicacao escolhida para centralizar conversas com clientes e partes envolvidas em processos juridicos. A integracao deve permitir que o modulo de partes do sistema sincronize automaticamente com os contatos do Chatwoot, mantendo consistencia e permitindo que o AI assistant (via MCP) gerencie contatos.

### Stakeholders
- Advogados e equipe juridica (usuarios finais)
- AI Assistant (consumidor das MCP tools)
- Sistema Chatwoot (integracao externa)

### Constraints
- API Chatwoot usa autenticacao via header `api_access_token`
- Paginacao fixa de 15 itens por pagina
- Rate limiting da API Chatwoot (a verificar)
- Contatos precisam de inbox_id na criacao

## Goals / Non-Goals

### Goals
- Sincronizar partes (clientes, partes contrarias, terceiros) com contatos do Chatwoot
- Permitir operacoes de contatos via MCP tools
- Manter mapeamento entre IDs locais e IDs do Chatwoot
- Categorizar contatos por tipo usando labels
- Armazenar dados relevantes em custom_attributes

### Non-Goals
- Sincronizacao de conversas (sera outra integracao)
- Sincronizacao de inboxes ou agentes
- Webhooks para sincronizacao em tempo real (futuro)
- UI dedicada para gestao de contatos Chatwoot

## Decisions

### 1. Estrutura do Cliente HTTP

**Decisao:** Criar modulo `src/lib/chatwoot/` com cliente HTTP usando fetch nativo.

**Alternativas Consideradas:**
- Usar axios: Rejeitado - adiciona dependencia desnecessaria
- SDK oficial: Nao existe para Node.js/TypeScript

**Estrutura:**
```
src/lib/chatwoot/
├── client.ts           # Cliente HTTP base com autenticacao
├── contacts.ts         # Operacoes de contatos
├── contact-labels.ts   # Operacoes de labels
├── types.ts            # Tipos TypeScript
└── index.ts            # Barrel exports
```

### 2. Tabela de Mapeamento

**Decisao:** Criar tabela `partes_chatwoot` com mapeamento polimorfico.

**Alternativas Consideradas:**
- Adicionar coluna `chatwoot_contact_id` em cada tabela de partes: Rejeitado - aumenta acoplamento
- Usar tabela unica com JSON: Rejeitado - dificulta queries

**Schema:**
```sql
CREATE TABLE partes_chatwoot (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Referencia polimorfica para a parte local
  tipo_entidade text NOT NULL CHECK (tipo_entidade IN ('cliente', 'parte_contraria', 'terceiro')),
  entidade_id bigint NOT NULL,

  -- Referencia para o Chatwoot
  chatwoot_contact_id bigint NOT NULL,
  chatwoot_account_id integer NOT NULL,

  -- Metadata de sincronizacao
  ultima_sincronizacao timestamptz DEFAULT now(),
  dados_sincronizados jsonb DEFAULT '{}',

  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT uq_partes_chatwoot_entidade UNIQUE (tipo_entidade, entidade_id),
  CONSTRAINT uq_partes_chatwoot_contact UNIQUE (chatwoot_account_id, chatwoot_contact_id)
);

CREATE INDEX idx_partes_chatwoot_entidade ON partes_chatwoot(tipo_entidade, entidade_id);
CREATE INDEX idx_partes_chatwoot_contact ON partes_chatwoot(chatwoot_contact_id);
```

### 3. Estrategia de Sincronizacao

**Decisao:** Sincronizacao sob demanda com cache de mapeamento.

**Fluxo de Criacao:**
1. Usuario cria/atualiza parte no sistema
2. Hook no repository verifica se existe mapeamento
3. Se nao existe, cria contato no Chatwoot
4. Salva mapeamento na tabela `partes_chatwoot`
5. Retorna resultado com IDs

**Fluxo de Busca:**
1. MCP tool recebe solicitacao
2. Verifica cache de mapeamento
3. Se existe, busca dados atualizados do Chatwoot
4. Se nao existe, cria contato e mapeamento

### 4. Mapeamento de Campos

**Decisao:** Mapear campos com custom_attributes para dados extras.

| Campo Local | Campo Chatwoot |
|-------------|----------------|
| nome | name |
| emails[0] | email |
| telefone_celular | phone_number |
| cpf/cnpj | identifier |
| tipo_pessoa | custom_attributes.tipo_pessoa |
| tipo_entidade | custom_attributes.tipo_entidade |
| - | custom_attributes.sistema_origem = 'zattar' |

### 5. Labels para Categorização

**Decisao:** Usar labels do Chatwoot para categorizar por tipo de parte.

**Labels Padrao:**
- `cliente` - Clientes do escritorio
- `parte_contraria` - Partes contrarias
- `terceiro` - Terceiros em geral
- `testemunha` - Testemunhas
- `perito` - Peritos
- `representante` - Advogados/procuradores

### 6. MCP Tools

**Decisao:** Criar tools especificas seguindo padrao existente.

**Tools:**
```typescript
// Listagem e busca
chatwoot_listar_contatos(limite, offset, sort)
chatwoot_buscar_contato(id?, email?, phone?, identifier?)

// CRUD
chatwoot_criar_contato(nome, email?, telefone?, identifier?, inbox_id?)
chatwoot_atualizar_contato(id, dados)
chatwoot_excluir_contato(id)

// Sincronizacao
chatwoot_sincronizar_parte(tipo_entidade, entidade_id)
chatwoot_vincular_parte_contato(tipo_entidade, entidade_id, chatwoot_contact_id)

// Labels
chatwoot_listar_labels_contato(contact_id)
chatwoot_atualizar_labels_contato(contact_id, labels[])

// Merge
chatwoot_mesclar_contatos(base_contact_id, mergee_contact_id)
```

## Risks / Trade-offs

### Risk: Rate Limiting da API Chatwoot
**Mitigacao:** Implementar retry com exponential backoff e circuit breaker para operacoes em lote.

### Risk: Inconsistencia de dados em caso de falha
**Mitigacao:** Usar transacoes quando possivel e marcar registros com flag `sincronizado = false` em caso de falha.

### Risk: Dados desatualizados entre sistemas
**Mitigacao:** Sempre buscar dados frescos do Chatwoot quando solicitado via MCP, usando cache apenas para mapeamento de IDs.

### Trade-off: Sem sincronizacao em tempo real
**Justificativa:** Webhooks do Chatwoot requerem endpoint publico e configuracao adicional. Sera implementado em fase posterior.

## Migration Plan

### Fase 1: Infraestrutura (este change)
1. Criar cliente HTTP do Chatwoot
2. Criar tabela de mapeamento
3. Implementar MCP tools basicas

### Fase 2: Sincronizacao Automatica (futuro)
1. Adicionar hooks nos repositories de partes
2. Sincronizar ao criar/atualizar partes

### Fase 3: Webhooks (futuro)
1. Criar endpoint para receber webhooks do Chatwoot
2. Atualizar partes locais quando contatos mudarem no Chatwoot

### Rollback
1. Remover MCP tools do registro
2. Manter tabela de mapeamento (nao destrutivo)
3. Remover cliente HTTP

## Open Questions

1. Qual inbox_id usar como padrao para novos contatos? (Resposta: variavel de ambiente `CHATWOOT_DEFAULT_INBOX_ID`)
2. Devemos sincronizar representantes (advogados) tambem? (Sugestao: nao neste momento, apenas partes)
3. Limite de contatos para sincronizacao inicial em lote? (Sugestao: 100 por execucao)
