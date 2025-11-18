## ADDED Requirements

### Requirement: Gerenciamento de Advogados
O sistema MUST fornecer serviços backend e endpoints API para gerenciar advogados do sistema.

#### Scenario: Criar novo advogado
- **WHEN** uma requisição POST é enviada para /api/advogados com dados do advogado
- **THEN** o sistema deve validar dados obrigatórios (nome_completo, cpf, oab, uf_oab)
- **AND** verificar se CPF já existe (deve ser único)
- **AND** criar registro do advogado no banco de dados
- **AND** retornar advogado criado com ID gerado

#### Scenario: Listar advogados
- **WHEN** uma requisição GET é enviada para /api/advogados
- **THEN** o sistema deve retornar lista paginada de advogados
- **AND** suportar filtros opcionais (busca por nome, OAB, CPF)
- **AND** incluir informações básicas (id, nome_completo, cpf, oab, uf_oab)
- **AND** retornar paginação (pagina, limite, total, totalPaginas)

#### Scenario: Buscar advogado por ID
- **WHEN** uma requisição GET é enviada para /api/advogados/:id
- **THEN** o sistema deve retornar dados completos do advogado
- **AND** incluir lista de credenciais associadas se solicitado
- **AND** retornar erro 404 se advogado não encontrado

#### Scenario: Atualizar advogado
- **WHEN** uma requisição PATCH é enviada para /api/advogados/:id
- **THEN** o sistema deve validar dados fornecidos
- **AND** atualizar apenas campos fornecidos (partial update)
- **AND** validar unicidade de CPF se alterado
- **AND** atualizar campo updated_at automaticamente
- **AND** retornar advogado atualizado

#### Scenario: Listar advogados com credenciais ativas
- **WHEN** uma requisição GET é enviada para /api/advogados?com_credenciais=true
- **THEN** o sistema deve retornar apenas advogados que possuem credenciais ativas
- **AND** facilitar seleção de advogado na interface de captura

