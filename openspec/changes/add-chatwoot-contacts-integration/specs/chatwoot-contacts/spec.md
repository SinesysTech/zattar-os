## ADDED Requirements

### Requirement: Chatwoot HTTP Client
O sistema SHALL fornecer um cliente HTTP para comunicacao com a API do Chatwoot.

#### Scenario: Autenticacao com API
- **WHEN** uma requisicao e feita para a API do Chatwoot
- **THEN** o header `api_access_token` SHALL ser incluido com o token configurado
- **AND** o header `Content-Type` SHALL ser `application/json` para requisicoes com body

#### Scenario: Tratamento de erros HTTP
- **WHEN** a API retorna erro 4xx ou 5xx
- **THEN** o cliente SHALL retornar um Result com erro contendo codigo e mensagem
- **AND** erros 429 (rate limit) SHALL acionar retry com exponential backoff

#### Scenario: Configuracao via variaveis de ambiente
- **WHEN** o cliente e inicializado
- **THEN** SHALL usar `CHATWOOT_API_URL` como base URL
- **AND** SHALL usar `CHATWOOT_API_KEY` como token de autenticacao
- **AND** SHALL usar `CHATWOOT_ACCOUNT_ID` como account_id padrao

---

### Requirement: Listar Contatos do Chatwoot
O sistema SHALL permitir listar contatos do Chatwoot com paginacao.

#### Scenario: Listagem com paginacao
- **WHEN** usuario solicita lista de contatos
- **THEN** o sistema SHALL retornar lista paginada com 15 itens por pagina
- **AND** SHALL incluir metadados de paginacao (count, current_page)

#### Scenario: Ordenacao de contatos
- **WHEN** usuario especifica campo de ordenacao (name, email, phone_number, last_activity_at)
- **THEN** o sistema SHALL retornar contatos ordenados pelo campo
- **AND** SHALL suportar ordenacao ascendente e descendente (prefixo -)

---

### Requirement: Criar Contato no Chatwoot
O sistema SHALL permitir criar novos contatos no Chatwoot.

#### Scenario: Criacao com dados minimos
- **WHEN** usuario fornece inbox_id e nome
- **THEN** o sistema SHALL criar contato no Chatwoot
- **AND** SHALL retornar o contato criado com ID gerado

#### Scenario: Criacao com dados completos
- **WHEN** usuario fornece nome, email, telefone, identifier e custom_attributes
- **THEN** o sistema SHALL criar contato com todos os dados
- **AND** SHALL aplicar labels se fornecidas

#### Scenario: Validacao de inbox_id
- **WHEN** inbox_id nao e fornecido
- **THEN** o sistema SHALL usar `CHATWOOT_DEFAULT_INBOX_ID`
- **AND** SHALL retornar erro se inbox_id padrao nao estiver configurado

---

### Requirement: Buscar Contato no Chatwoot
O sistema SHALL permitir buscar contatos por ID ou termo de pesquisa.

#### Scenario: Busca por ID
- **WHEN** usuario fornece ID do contato
- **THEN** o sistema SHALL retornar o contato completo com inboxes vinculados

#### Scenario: Busca por termo
- **WHEN** usuario fornece termo de busca (nome, email, telefone, identifier)
- **THEN** o sistema SHALL retornar lista de contatos que correspondem ao termo
- **AND** SHALL suportar paginacao nos resultados

---

### Requirement: Atualizar Contato no Chatwoot
O sistema SHALL permitir atualizar dados de contatos existentes.

#### Scenario: Atualizacao parcial
- **WHEN** usuario fornece ID e campos para atualizar
- **THEN** o sistema SHALL atualizar apenas os campos fornecidos
- **AND** SHALL manter campos nao fornecidos inalterados

#### Scenario: Atualizacao de custom_attributes
- **WHEN** usuario fornece novos custom_attributes
- **THEN** o sistema SHALL mesclar com custom_attributes existentes

---

### Requirement: Excluir Contato do Chatwoot
O sistema SHALL permitir excluir contatos do Chatwoot.

#### Scenario: Exclusao por ID
- **WHEN** usuario fornece ID do contato para excluir
- **THEN** o sistema SHALL remover o contato do Chatwoot
- **AND** SHALL remover o mapeamento local se existir

---

### Requirement: Gerenciar Labels de Contato
O sistema SHALL permitir listar e atualizar labels de contatos.

#### Scenario: Listar labels
- **WHEN** usuario solicita labels de um contato
- **THEN** o sistema SHALL retornar array de labels associadas

#### Scenario: Atualizar labels
- **WHEN** usuario fornece nova lista de labels
- **THEN** o sistema SHALL substituir todas as labels do contato
- **AND** labels podem incluir: cliente, parte_contraria, terceiro, testemunha, perito

---

### Requirement: Mesclar Contatos Duplicados
O sistema SHALL permitir mesclar dois contatos em um unico registro.

#### Scenario: Merge de contatos
- **WHEN** usuario fornece base_contact_id e mergee_contact_id
- **THEN** o sistema SHALL mesclar dados do mergee no base contact
- **AND** SHALL excluir o mergee contact apos merge
- **AND** SHALL atualizar mapeamento local para apontar para base contact

---

### Requirement: Tabela de Mapeamento Partes-Chatwoot
O sistema SHALL manter mapeamento entre partes locais e contatos do Chatwoot.

#### Scenario: Estrutura da tabela
- **WHEN** tabela partes_chatwoot e consultada
- **THEN** SHALL conter tipo_entidade (cliente, parte_contraria, terceiro)
- **AND** SHALL conter entidade_id referenciando a parte local
- **AND** SHALL conter chatwoot_contact_id referenciando o contato no Chatwoot
- **AND** SHALL conter chatwoot_account_id para suporte multi-tenant

#### Scenario: Unicidade de mapeamento
- **WHEN** mapeamento e criado
- **THEN** SHALL garantir que cada parte local tenha apenas um contato Chatwoot
- **AND** SHALL garantir que cada contato Chatwoot esteja vinculado a apenas uma parte local

---

### Requirement: Sincronizar Parte com Chatwoot
O sistema SHALL permitir sincronizar uma parte local com o Chatwoot.

#### Scenario: Sincronizacao de cliente novo
- **WHEN** cliente sem mapeamento e sincronizado
- **THEN** o sistema SHALL criar contato no Chatwoot com dados do cliente
- **AND** SHALL aplicar label "cliente"
- **AND** SHALL criar mapeamento na tabela partes_chatwoot
- **AND** SHALL usar CPF/CNPJ como identifier do contato

#### Scenario: Sincronizacao de cliente existente
- **WHEN** cliente com mapeamento e sincronizado
- **THEN** o sistema SHALL atualizar contato existente no Chatwoot
- **AND** SHALL atualizar timestamp de ultima_sincronizacao

#### Scenario: Sincronizacao de parte contraria
- **WHEN** parte contraria e sincronizada
- **THEN** o sistema SHALL criar/atualizar contato com label "parte_contraria"

#### Scenario: Sincronizacao de terceiro
- **WHEN** terceiro e sincronizado
- **THEN** o sistema SHALL criar/atualizar contato com label apropriada (terceiro, testemunha, perito)

---

### Requirement: Vincular Parte a Contato Existente
O sistema SHALL permitir vincular uma parte local a um contato ja existente no Chatwoot.

#### Scenario: Vinculacao manual
- **WHEN** usuario fornece tipo_entidade, entidade_id e chatwoot_contact_id
- **THEN** o sistema SHALL criar mapeamento entre a parte e o contato
- **AND** SHALL atualizar custom_attributes do contato com dados da parte

#### Scenario: Validacao de existencia
- **WHEN** vinculacao e solicitada
- **THEN** o sistema SHALL verificar se a parte local existe
- **AND** SHALL verificar se o contato Chatwoot existe
- **AND** SHALL retornar erro se algum nao existir

---

### Requirement: MCP Tools para Chatwoot Contacts
O sistema SHALL expor operacoes de contatos como MCP tools para o AI assistant.

#### Scenario: Tool de listagem
- **WHEN** AI solicita `chatwoot_listar_contatos`
- **THEN** o sistema SHALL retornar lista de contatos formatada para o contexto de conversa

#### Scenario: Tool de criacao
- **WHEN** AI solicita `chatwoot_criar_contato` com dados
- **THEN** o sistema SHALL criar contato e retornar confirmacao com ID

#### Scenario: Tool de sincronizacao
- **WHEN** AI solicita `chatwoot_sincronizar_parte` com tipo e ID
- **THEN** o sistema SHALL sincronizar a parte e retornar status da operacao

#### Scenario: Tool de busca
- **WHEN** AI solicita `chatwoot_buscar_contato` com termo
- **THEN** o sistema SHALL buscar e retornar contatos encontrados

---

### Requirement: Mapeamento de Campos Parte-Contato
O sistema SHALL mapear campos das partes locais para campos do contato Chatwoot.

#### Scenario: Mapeamento de pessoa fisica
- **WHEN** parte PF e sincronizada
- **THEN** nome SHALL mapear para name
- **AND** emails[0] SHALL mapear para email
- **AND** telefone celular SHALL mapear para phone_number (formato +55DDDNUMERO)
- **AND** CPF SHALL mapear para identifier
- **AND** tipo_pessoa='pf' SHALL ir para custom_attributes.tipo_pessoa

#### Scenario: Mapeamento de pessoa juridica
- **WHEN** parte PJ e sincronizada
- **THEN** nome SHALL mapear para name
- **AND** nome_social_fantasia SHALL ir para custom_attributes.nome_fantasia
- **AND** CNPJ SHALL mapear para identifier
- **AND** tipo_pessoa='pj' SHALL ir para custom_attributes.tipo_pessoa

#### Scenario: Custom attributes padrao
- **WHEN** qualquer parte e sincronizada
- **THEN** custom_attributes SHALL incluir sistema_origem='zattar'
- **AND** custom_attributes SHALL incluir tipo_entidade (cliente, parte_contraria, terceiro)
- **AND** custom_attributes SHALL incluir entidade_id local
