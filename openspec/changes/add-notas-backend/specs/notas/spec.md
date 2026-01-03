## ADDED Requirements

### Requirement: Gerenciamento de notas
O sistema SHALL permitir que usuários autenticados criem, visualizem, atualizem, arquivem e removam suas próprias notas no módulo `/notas`.

#### Scenario: Listar notas do usuário
- **WHEN** o usuário acessa `/notas`
- **THEN** o sistema retorna as notas pertencentes ao usuário autenticado
- **AND** o usuário consegue buscar por título (e/ou conteúdo) na UI

#### Scenario: Criar nota
- **WHEN** o usuário cria uma nota com título e conteúdo
- **THEN** a nota é persistida vinculada ao `usuario_id`
- **AND** a listagem é atualizada sem recarregar a página inteira

#### Scenario: Arquivar nota
- **WHEN** o usuário arquiva uma nota
- **THEN** a nota deixa de aparecer na listagem principal (não arquivadas)

#### Scenario: Excluir nota
- **WHEN** o usuário exclui uma nota
- **THEN** a nota é removida do sistema (somente do escopo do usuário)

### Requirement: Gerenciamento de etiquetas (labels)
O sistema SHALL permitir que usuários autenticados criem, editem e removam etiquetas, e associem etiquetas às suas notas.

#### Scenario: Listar etiquetas
- **WHEN** o usuário acessa `/notas`
- **THEN** o sistema retorna as etiquetas pertencentes ao usuário autenticado

#### Scenario: Criar etiqueta
- **WHEN** o usuário cria uma etiqueta com título e cor
- **THEN** a etiqueta é persistida vinculada ao `usuario_id`

#### Scenario: Remover etiqueta
- **WHEN** o usuário remove uma etiqueta
- **THEN** a etiqueta é removida
- **AND** seus vínculos com notas são removidos


