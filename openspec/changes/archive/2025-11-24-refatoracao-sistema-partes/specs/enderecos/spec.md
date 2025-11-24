# Spec: Endereços (Backend)

## ADDED Requirements

### Requirement: Serviço de endereços polimórficos
The service SHALL gerencia endereços de clientes, partes_contrarias e terceiros.

#### Scenario: Buscar endereços de uma entidade
**Given** cliente com ID 123 possui 3 endereços
**When** `enderecosService.getByEntidade('cliente', 123)` é chamado
**Then** retorna array com 3 endereços
**And** cada endereço tem dados completos do PJE

#### Scenario: Criar endereço vinculado
**Given** cliente com ID 123
**When** `enderecosService.create({ entidade_tipo: 'cliente', entidade_id: 123, ... })` é chamado
**Then** endereço é criado e vinculado ao cliente
**And** relacionamento polimórfico está correto

#### Scenario: Definir endereço principal
**Given** cliente com múltiplos endereços
**When** `enderecosService.setPrincipal(enderecoId)` é chamado
**Then** campo `situacao='P'` é definido nesse endereço
**And** outros endereços do cliente perdem flag principal

---

### Requirement: API REST de endereços
The API SHALL provide endpoints para gestão de endereços.

#### Scenario: Endpoints por entidade
**Given** API implementada
**Then** endpoints disponíveis:
- GET /api/enderecos/entidade/:tipo/:id (endereços de uma entidade)
- POST /api/enderecos (criar)
- PUT /api/enderecos/[id] (atualizar)
- DELETE /api/enderecos/[id] (deletar)
- PATCH /api/enderecos/[id]/principal (definir como principal)

---

## Cross-References

- **Depends on**: `database-partes` (tabela enderecos criada)
- **Related**: `clientes`, `partes-contrarias`, `terceiros` (entidades relacionadas)
