# Tasks: Integracao Chatwoot Contacts

## 1. Configuracao e Infraestrutura

- [x] 1.1 Adicionar variaveis de ambiente no `.env.example`
  - `CHATWOOT_API_URL`
  - `CHATWOOT_API_KEY`
  - `CHATWOOT_ACCOUNT_ID`
  - `CHATWOOT_DEFAULT_INBOX_ID`

- [x] 1.2 Criar migration para tabela `partes_chatwoot`
  - Schema polimorfico com tipo_entidade e entidade_id
  - Indices para queries frequentes
  - Constraints de unicidade

## 2. Cliente HTTP Chatwoot

- [x] 2.1 Criar estrutura base do modulo `src/lib/chatwoot/`
  - `types.ts` - Tipos TypeScript baseados na documentacao da API
  - `client.ts` - Cliente HTTP base com autenticacao e error handling
  - `index.ts` - Barrel exports

- [x] 2.2 Implementar operacoes de Contacts em `contacts.ts`
  - `listContacts(params)` - GET /contacts
  - `createContact(data)` - POST /contacts
  - `getContact(id)` - GET /contacts/{id}
  - `updateContact(id, data)` - PUT /contacts/{id}
  - `deleteContact(id)` - DELETE /contacts/{id}
  - `searchContacts(query, params)` - GET /contacts/search
  - `mergeContacts(baseId, mergeeId)` - POST /actions/contact_merge

- [x] 2.3 Implementar operacoes de Contact Labels em `contact-labels.ts`
  - `listContactLabels(contactId)` - GET /contacts/{id}/labels
  - `updateContactLabels(contactId, labels)` - POST /contacts/{id}/labels

- [x] 2.4 Implementar error handling e retry logic
  - Wrapper para erros da API
  - Retry com exponential backoff para erros 429/5xx
  - Logging de operacoes

## 3. Repository e Service de Mapeamento

- [x] 3.1 Criar `src/features/chatwoot/` com estrutura FSD
  - `domain.ts` - Tipos e schemas Zod
  - `repository.ts` - Operacoes no banco (tabela partes_chatwoot)
  - `service.ts` - Logica de sincronizacao
  - `index.ts` - Barrel exports

- [x] 3.2 Implementar repository `partes-chatwoot-repository.ts`
  - `findMapeamento(tipo_entidade, entidade_id)`
  - `findMapeamentoPorChatwootId(chatwoot_contact_id)`
  - `criarMapeamento(data)`
  - `atualizarMapeamento(id, data)`
  - `removerMapeamento(id)`
  - `listarMapeamentos(params)`

- [x] 3.3 Implementar service de sincronizacao
  - `sincronizarParteParaChatwoot(tipo_entidade, entidade_id)`
  - `vincularParteAContato(tipo_entidade, entidade_id, chatwoot_contact_id)`
  - `buscarOuCriarContato(parte)`
  - `mapearParteParaContato(parte)` - Converte campos
  - `mapearContatoParaParte(contato)` - Converte campos reverso

## 4. MCP Tools

- [x] 4.1 Criar registro de tools `src/lib/mcp/registries/chatwoot-tools.ts`

- [x] 4.2 Implementar tools de listagem e busca
  - `chatwoot_listar_contatos` - Lista com paginacao e filtros
  - `chatwoot_buscar_contato` - Busca por ID, email, telefone ou identifier

- [x] 4.3 Implementar tools de CRUD
  - `chatwoot_criar_contato` - Cria novo contato
  - `chatwoot_atualizar_contato` - Atualiza contato existente
  - `chatwoot_excluir_contato` - Remove contato

- [x] 4.4 Implementar tools de sincronizacao
  - `chatwoot_sincronizar_parte` - Sincroniza parte local com Chatwoot
  - `chatwoot_vincular_parte_contato` - Vincula parte existente a contato

- [x] 4.5 Implementar tools de labels
  - `chatwoot_listar_labels_contato` - Lista labels de um contato
  - `chatwoot_atualizar_labels_contato` - Atualiza labels

- [x] 4.6 Implementar tool de merge
  - `chatwoot_mesclar_contatos` - Mescla dois contatos

- [x] 4.7 Registrar tools no index `src/lib/mcp/registries/index.ts`

## 5. Integracao com Partes Existentes

- [x] 5.1 Adicionar funcoes utilitarias em `src/features/chatwoot/`
  - `prepararDadosContatoChatwoot(tipo_entidade, dados)` - em service.ts
  - `getLabelsForTipoEntidade(tipo_entidade, tipo_pessoa)` - em contact-labels.ts
  - `formatarTelefoneInternacional(ddd, numero)` - em domain.ts
  - `normalizarDocumentoParaIdentifier(documento)` - em domain.ts

- [x] 5.2 Criar hooks e actions para sincronizacao em `src/features/chatwoot/`
  - `saveClienteComSync(input)` - Wrapper que salva e sincroniza (sync-hooks.ts)
  - `updateClienteComSync(id, input)` - Wrapper que atualiza e sincroniza (sync-hooks.ts)
  - `sincronizarCliente(clienteId)` - Server action (actions.ts)
  - `sincronizarTodosClientes(params)` - Batch sync server action (actions.ts)
  - `sincronizarClientesPorIds(ids)` - Sync multiplos por IDs (actions.ts)

## 6. Sincronizacao Bidirecional por Telefone (Two-Phase Sync)

- [x] 6.1 Implementar extracao de telefone do formato Chatwoot
  - `extrairTelefone(telefone)` - Extrai DDD, numero9 e numero8 do formato internacional

- [x] 6.2 Implementar busca de parte por telefone no banco local
  - `buscarPartePorTelefone(ddd, numero9, numero8)` - Busca em clientes, partes_contrarias, terceiros
  - Busca por celular (9 digitos e 8 digitos)
  - Busca por comercial (9 digitos e 8 digitos)
  - Prioridade: clientes > partes_contrarias > terceiros

- [x] 6.3 Implementar sincronizacao Chatwoot -> App (Fase 1)
  - `sincronizarChatwootParaApp()` - Lista contatos do Chatwoot, busca por telefone, cria mapeamentos
  - Retorna estatisticas: total_contatos, vinculados, sem_match, erros

- [x] 6.4 Implementar sincronizacao completa em duas fases
  - `sincronizarCompletoComChatwoot(params)` - Executa Fase 1 (Chatwoot->App) e Fase 2 (App->Chatwoot)
  - Suporte a filtro por tipo de entidade ou todos
  - Resultado agregado com estatisticas de ambas as fases

- [x] 6.5 Criar componente ChatwootSyncButton
  - Botao de sync na toolbar das tabelas de partes
  - Dialog de confirmacao explicando as duas fases
  - Dialog de resultado com estatisticas detalhadas
  - Integrado nas paginas: clientes, partes_contrarias, terceiros

## 7. Normalizacao de Dados

- [x] 7.1 Implementar normalizacao de nome para Chatwoot
  - `normalizarNomeParaChatwoot(nome)` - Caixa alta sem acentos
  - `removerAcentos(str)` - Remove acentos usando NFD normalization

- [x] 7.2 Incluir cidade e pais nos additional_attributes
  - Cidade extraida do endereco da parte (municipio)
  - Pais padrao: "Brazil" com country_code "BR"

## 8. Documentacao

- [x] 8.1 Adicionar JSDoc nas funcoes publicas
- [x] 8.2 Documentar tipos e interfaces exportados
