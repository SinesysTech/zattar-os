# terceiros Specification

## Purpose
TBD - created by archiving change refatoracao-sistema-partes. Update Purpose after archive.
## Requirements
### Requirement: Entidade Terceiro para interessados processuais
The system SHALL provide a table and services for peritos, MP and other third parties.

#### Scenario: Criar terceiro tipo PERITO
**Given** dados de perito do PJE
**When** terceiro é criado com `tipo_parte='PERITO'`
**Then** registro é salvo em `terceiros`
**And** relacionamento com processo via `processo_id`

#### Scenario: Filtrar terceiros por tipo
**Given** existem peritos, MP e assistentes
**When** `terceirosService.list({ tipo_parte: 'PERITO' })` é chamado
**Then** retorna apenas peritos

---

### Requirement: API REST de terceiros
The API SHALL provide endpoints para gestão de terceiros.

#### Scenario: Endpoints disponíveis
**Then** endpoints disponíveis:
- GET /api/terceiros (listar com filtro por tipo_parte)
- POST /api/terceiros (criar)
- GET /api/terceiros/[id] (buscar)
- PUT /api/terceiros/[id] (atualizar)
- DELETE /api/terceiros/[id] (deletar)
- GET /api/terceiros/processo/[id] (terceiros de um processo)

---

