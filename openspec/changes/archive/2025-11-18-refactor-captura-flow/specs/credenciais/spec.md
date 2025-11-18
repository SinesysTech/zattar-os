## ADDED Requirements

### Requirement: Gerenciamento de Credenciais
O sistema MUST fornecer serviços backend e endpoints API para gerenciar credenciais de acesso aos tribunais associadas a advogados.

#### Scenario: Criar credencial para advogado
- **WHEN** uma requisição POST é enviada para /api/advogados/:id/credenciais
- **THEN** o sistema deve validar dados obrigatórios (tribunal, grau, senha)
- **AND** verificar se advogado existe
- **AND** verificar se já existe credencial ativa para mesmo tribunal e grau
- **AND** criar registro da credencial no banco de dados
- **AND** retornar credencial criada (sem senha) com ID gerado

#### Scenario: Listar credenciais de advogado
- **WHEN** uma requisição GET é enviada para /api/advogados/:id/credenciais
- **THEN** o sistema deve retornar lista de credenciais do advogado
- **AND** incluir informações (id, tribunal, grau, active)
- **AND** não incluir senha na resposta
- **AND** filtrar apenas credenciais ativas se solicitado

#### Scenario: Buscar credencial por ID
- **WHEN** uma requisição GET é enviada para /api/advogados/:id/credenciais/:credentialId
- **THEN** o sistema deve retornar dados da credencial
- **AND** não incluir senha na resposta
- **AND** retornar erro 404 se credencial não encontrada

#### Scenario: Atualizar credencial
- **WHEN** uma requisição PATCH é enviada para /api/advogados/:id/credenciais/:credentialId
- **THEN** o sistema deve validar dados fornecidos
- **AND** permitir atualizar senha, status ativo/inativo
- **AND** validar unicidade de tribunal+grau se alterado
- **AND** atualizar campo updated_at automaticamente
- **AND** retornar credencial atualizada (sem senha)

#### Scenario: Listar credenciais ativas para captura
- **WHEN** uma requisição GET é enviada para /api/advogados/:id/credenciais?active=true
- **THEN** o sistema deve retornar apenas credenciais ativas
- **AND** facilitar seleção de credenciais na interface de captura
- **AND** incluir tribunal e grau para exibição

