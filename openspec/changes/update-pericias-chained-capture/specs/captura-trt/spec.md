## ADDED Requirements
### Requirement: Captura de Perícias com Sincronização Encadeada
O sistema MUST, ao capturar perícias, sincronizar também os dados relacionados dos processos envolvidos (acervo, partes, timeline e documentos da timeline), garantindo integridade referencial na persistência.

#### Scenario: Captura de perícias atualiza dados relacionados do processo
- **WHEN** uma captura de perícias é iniciada para um conjunto de credenciais
- **THEN** o sistema deve capturar a lista de perícias do PJE
- **AND** deve extrair os IDs únicos de processo presentes na lista
- **AND** deve atualizar/persistir os processos do acervo correspondentes
- **AND** deve capturar e persistir timeline e partes para esses processos
- **AND** deve persistir as perícias por último, vinculando-as aos processos persistidos

#### Scenario: Ordem de persistência garante integridade referencial
- **WHEN** a captura de perícias persiste dados relacionados
- **THEN** o sistema MUST persistir na ordem: acervo → timeline → partes → perícias
- **AND** MUST garantir que as perícias persistidas referenciem o `acervo.id` correto


