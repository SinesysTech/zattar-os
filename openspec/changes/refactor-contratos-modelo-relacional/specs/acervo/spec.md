## ADDED Requirements
### Requirement: Tags em Processos do Acervo
O sistema MUST suportar tags em processos, usando um sistema unificado de tags compartilhado com contratos.

#### Scenario: Exibir tags de um processo
- **WHEN** o usuário visualiza um processo
- **THEN** o sistema deve exibir as tags associadas ao processo

### Requirement: Herança de Tags do Contrato para Processos
O sistema MUST propagar tags de contratos para processos vinculados ao contrato.

#### Scenario: Processo vinculado herda tags do contrato
- **WHEN** um processo é vinculado a um contrato
- **THEN** o sistema deve associar automaticamente ao processo todas as tags do contrato
- **AND** a propagação deve evitar duplicidades

#### Scenario: Tag adicionada ao contrato propaga para processos já vinculados
- **WHEN** uma tag é adicionada a um contrato que já possui processos vinculados
- **THEN** o sistema deve associar automaticamente a tag a todos os processos já vinculados ao contrato
- **AND** a propagação deve evitar duplicidades
