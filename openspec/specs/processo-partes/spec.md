# processo-partes Specification

## Purpose
TBD - created by archiving change refatoracao-sistema-partes. Update Purpose after archive.
## Requirements
### Requirement: Relacionamento N:N entre processos e partes
The system SHALL provide a junction table and services to link partes to processos.

#### Scenario: Vincular cliente a processo
**Given** cliente com ID 10 e processo com ID 500
**When** `processoPartesService.vincular({ processo_id: 500, tipo_entidade: 'cliente', entidade_id: 10, polo: 'ativo', tipo_parte: 'AUTOR', ordem: 1 })` é chamado
**Then** relacionamento é criado
**And** constraint UNIQUE impede duplicação

#### Scenario: Buscar todas as partes de um processo com dados completos
**Given** processo 500 com cliente, parte contrária e terceiro
**When** `processoPartesService.getByProcesso(500)` é chamado
**Then** retorna array com 3 itens
**And** cada item tem: { polo, tipo_parte, ordem, nome, cpf/cnpj, tipo_entidade }
**And** query usa JOINs otimizados com índices

#### Scenario: Buscar todos os processos de uma entidade
**Given** cliente 10 participa de processos 500, 501, 502
**When** `processoPartesService.getByEntidade('cliente', 10)` é chamado
**Then** retorna array com 3 relacionamentos
**And** cada item mostra polo e tipo_parte específicos daquele processo

---

### Requirement: API REST de processo-partes
The API SHALL provide endpoints para gestão de relacionamentos.

#### Scenario: Endpoints disponíveis
**Then** endpoints disponíveis:
- GET /api/processos/[id]/partes (partes de um processo)
- GET /api/partes/:tipo/:id/processos (processos de uma parte)
- POST /api/processo-partes (vincular)
- PUT /api/processo-partes/[id] (atualizar participação)
- DELETE /api/processo-partes/[id] (desvincular)

---

