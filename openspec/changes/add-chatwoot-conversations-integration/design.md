# Design: Integrar Conversations e Messages do Chatwoot

## Context
O Chatwoot e a plataforma de atendimento ao cliente usada pelo escritorio. A integracao de contatos ja foi implementada (spec chatwoot-contacts), permitindo sincronizar clientes/partes com contatos do Chatwoot. Esta mudanca adiciona a camada de conversas e mensagens, permitindo:
- Visualizar historico de comunicacao com clientes
- AI assistant ter contexto de conversas para melhor atendimento
- Correlacionar conversas com processos judiciais

## Goals / Non-Goals

### Goals
- Implementar cliente HTTP para endpoints de Conversations e Messages
- Expor funcionalidades via MCP Tools para AI assistant
- Manter consistencia com padrao existente em chatwoot-contacts
- Suportar busca de conversas por contato

### Non-Goals
- UI/Frontend para visualizacao (change separada)
- Envio de mensagens (API de criacao de mensagens - fase futura)
- Real-time/webhooks de conversas
- Gerenciamento de inbox/teams

## Decisions

### Estrutura de Modulos
Seguir o padrao existente:
```
src/lib/chatwoot/
  types.ts          # Adicionar tipos de Conversation/Message
  conversations.ts  # Novo - funcoes de API
  messages.ts       # Novo - funcoes de API
  index.ts          # Atualizar exports
```

**Rationale**: Manter consistencia com implementacao de contacts.

### Mapeamento Conversa-Processo (Opcional v1)
Tabela `partes_chatwoot_conversas` para vincular conversas a processos:
```sql
CREATE TABLE partes_chatwoot_conversas (
  id SERIAL PRIMARY KEY,
  chatwoot_conversation_id INTEGER NOT NULL,
  chatwoot_contact_id INTEGER NOT NULL,
  processo_id INTEGER REFERENCES processos(id),
  tipo_vinculo VARCHAR(50), -- 'atendimento', 'notificacao', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Alternativa considerada**: Nao criar tabela, apenas consultar API sob demanda.
**Decisao**: Implementar sem tabela na v1 (consulta sob demanda), adicionar tabela se necessario para performance ou funcionalidades futuras.

### Paginacao de Mensagens
API retorna todas as mensagens de uma conversa sem paginacao nativa.
- Para conversas longas, limitar a ultimas N mensagens por padrao
- Parametro opcional para buscar mais

### MCP Tools
Tools para AI assistant:
1. `chatwoot_listar_conversas` - overview de conversas
2. `chatwoot_buscar_conversas_contato` - conversas de contato especifico
3. `chatwoot_ver_mensagens` - conteudo de uma conversa
4. `chatwoot_metricas_conversas` - contagens por status

## Risks / Trade-offs

### Performance em Conversas Longas
- **Risco**: Conversas com muitas mensagens podem ser lentas
- **Mitigacao**: Limitar mensagens retornadas, paginacao manual

### Consistencia de Dados
- **Risco**: Dados de conversa podem mudar entre requests
- **Mitigacao**: Usar timestamps e IDs para ordenacao consistente

### Rate Limiting
- **Risco**: Muitas requests podem atingir rate limit do Chatwoot
- **Mitigacao**: Reuso do mecanismo de retry existente no client.ts

## Migration Plan
1. Adicionar tipos (sem breaking changes)
2. Adicionar modulos conversations.ts e messages.ts
3. Atualizar exports
4. Adicionar MCP tools
5. Testar integracao

Nao ha rollback necessario - mudancas sao aditivas.

## Open Questions
- Quantas mensagens retornar por padrao nas MCP tools? (sugestao: 50)
- Criar endpoint interno para cache de conversas frequentes?
