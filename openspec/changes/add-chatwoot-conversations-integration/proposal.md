# Change: Integrar Conversations e Messages do Chatwoot

## Why
O sistema Zattar ja possui integracao com contatos do Chatwoot, mas nao permite visualizar o historico de conversas e mensagens dos clientes/partes. Essa integracao permitira aos usuarios ver o historico completo de comunicacao com cada cliente diretamente no sistema, alem de possibilitar ao AI assistant acesso ao contexto de conversas para melhor atendimento.

## What Changes
- **ADDED** Tipos TypeScript para Conversations e Messages da API Chatwoot
- **ADDED** Funcoes de API para listar/criar conversas e buscar mensagens
- **ADDED** Tabela `partes_chatwoot_conversas` para vincular conversas a processos/clientes
- **ADDED** Servico de integracao para buscar conversas de um contato
- **ADDED** MCP Tools para AI assistant consultar historico de conversas

## Impact
- Affected specs: chatwoot-contacts (referencia), nova spec chatwoot-conversations
- Affected code:
  - `src/lib/chatwoot/types.ts` - novos tipos
  - `src/lib/chatwoot/conversations.ts` - novo modulo
  - `src/lib/chatwoot/messages.ts` - novo modulo
  - `src/lib/chatwoot/index.ts` - exports
  - `src/features/chatwoot/` - servicos e repositorio
  - `src/lib/mcp/registries/chatwoot-tools.ts` - novas tools
  - Supabase migrations - nova tabela

## Out of Scope
- UI/Frontend para visualizacao de conversas (sera uma change separada)
- Envio de mensagens pela API (apenas leitura nesta fase)
- Webhooks de eventos de conversas
- Integracao com inbox/teams management
