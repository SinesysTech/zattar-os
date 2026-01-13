# Change: Integrar Chatwoot Contacts com Modulo de Partes

## Why

O escritorio precisa centralizar a comunicacao com clientes, partes contrarias, testemunhas e outros terceiros atraves do Chatwoot. Atualmente, os contatos existem apenas no sistema interno, sem vinculo com a plataforma de comunicacao. Isso causa duplicacao de cadastros, inconsistencia de dados e perda de historico de conversas vinculado ao contexto juridico.

## What Changes

### Nova Capability: chatwoot-contacts
- Cliente HTTP para API do Chatwoot Contacts (CRUD completo)
- Tabela de mapeamento `partes_chatwoot` para vincular entidades locais com contatos do Chatwoot
- Service de sincronizacao bidirecional entre partes e Chatwoot contacts
- MCP tools para operacoes de contatos via AI assistant
- Suporte a labels do Chatwoot para categorizar contatos por tipo de parte

### Endpoints Chatwoot Implementados
- `GET /contacts` - Listar contatos com paginacao
- `POST /contacts` - Criar contato
- `GET /contacts/{id}` - Buscar contato por ID
- `PUT /contacts/{id}` - Atualizar contato
- `DELETE /contacts/{id}` - Excluir contato
- `GET /contacts/search` - Buscar contatos por termo
- `POST /actions/contact_merge` - Mesclar contatos duplicados
- `GET /contacts/{id}/labels` - Listar labels do contato
- `POST /contacts/{id}/labels` - Atualizar labels do contato

### MCP Tools Adicionadas
- `chatwoot_listar_contatos` - Lista contatos do Chatwoot
- `chatwoot_buscar_contato` - Busca contato por ID ou termo
- `chatwoot_criar_contato` - Cria novo contato
- `chatwoot_atualizar_contato` - Atualiza contato existente
- `chatwoot_sincronizar_parte` - Sincroniza parte local com Chatwoot
- `chatwoot_vincular_parte_contato` - Vincula parte existente a contato Chatwoot

### Sincronizacao
- Ao criar/atualizar cliente, parte contraria ou terceiro, sincronizar automaticamente com Chatwoot
- Mapear campos: nome, email, telefone, CPF/CNPJ (como identifier)
- Custom attributes para tipo de parte, processos vinculados
- Labels automaticas baseadas no tipo (cliente, parte_contraria, terceiro, testemunha, perito)

## Impact

### Affected Specs
- Nova capability: `chatwoot-contacts`

### Affected Code
- `src/lib/chatwoot/` - Novo cliente HTTP e types
- `src/features/partes/` - Hooks de sincronizacao nos repositories
- `src/lib/mcp/registries/` - Novo registro de tools
- `supabase/migrations/` - Nova tabela de mapeamento

### New Dependencies
- Nenhuma - usa fetch nativo para chamadas HTTP

### Environment Variables
- `CHATWOOT_API_URL` - URL base da instancia Chatwoot
- `CHATWOOT_API_KEY` - Token de acesso da API
- `CHATWOOT_ACCOUNT_ID` - ID da conta no Chatwoot
- `CHATWOOT_DEFAULT_INBOX_ID` - Inbox padrao para novos contatos
