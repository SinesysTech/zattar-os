# partes-contrarias Specification

## Purpose
TBD - created by archiving change refatoracao-sistema-partes. Update Purpose after archive.
## Requirements
### Requirement: Entidade ParteContraria com estrutura idêntica a Cliente
The entity SHALL ParteContraria replica completamente a estrutura de Cliente.

#### Scenario: CRUD de parte contrária
**Given** estrutura idêntica a clientes (60 campos)
**When** operações create, read, update, delete são executadas
**Then** comportamento é idêntico a clientes
**And** validações, índices e tipos são os mesmos

#### Scenario: Deduplicação por id_pessoa_pje
**Given** parte contrária com `id_pessoa_pje=789`
**When** tentativa de criar duplicata
**Then** constraint UNIQUE impede duplicação
**And** serviço oferece método `upsertByIdPessoa()`

---

### Requirement: API REST completa
The API SHALL provide endpoints REST para partes_contrarias seguem mesma estrutura de clientes.

#### Scenario: Endpoints disponíveis
**Given** API implementada
**Then** endpoints disponíveis:
- GET /api/partes-contrarias (listar)
- POST /api/partes-contrarias (criar)
- GET /api/partes-contrarias/[id] (buscar)
- PUT /api/partes-contrarias/[id] (atualizar)
- DELETE /api/partes-contrarias/[id] (deletar)

**And** validações idênticas a clientes
**And** documentação Swagger atualizada

---

