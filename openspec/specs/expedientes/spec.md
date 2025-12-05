# expedientes Specification

## Purpose
TBD - created by archiving change add-comunica-cnj-integration. Update Purpose after archive.
## Requirements
### Requirement: Tabela de Expedientes com Origem

The system MUST support expedientes from multiple origins with unified table structure.

#### Scenario: Estrutura da tabela expedientes

```
GIVEN a tabela expedientes (anteriormente pendentes_manifestacao)
THEN MUST conter a coluna origem:
  | Coluna | Tipo              | Default   | Descrição                      |
  |--------|-------------------|-----------|--------------------------------|
  | origem | origem_expediente | 'captura' | Fonte do expediente            |
```

#### Scenario: Valores do enum origem_expediente

```
GIVEN o enum origem_expediente
THEN MUST aceitar os valores:
  - 'captura' (capturado do PJE)
  - 'manual' (criado manualmente)
  - 'comunica_cnj' (criado a partir de comunicação CNJ)
```

---

### Requirement: Consolidação de Expedientes

The system MUST consolidate expedientes_manuais into the expedientes table.

#### Scenario: Migração de dados de expedientes_manuais

```
GIVEN dados existentes em expedientes_manuais
WHEN a migração é executada
THEN todos os registros MUST ser copiados para expedientes
AND origem MUST ser setada como 'manual'
AND tabela expedientes_manuais MUST ser removida
```

---

### Requirement: Tipo de Captura Comunica CNJ

The system MUST support comunica_cnj as a valid capture type.

#### Scenario: Novo valor no enum tipo_captura

```
GIVEN o enum tipo_captura
THEN MUST incluir o valor 'comunica_cnj'
AND permitir agendamentos com este tipo
```

