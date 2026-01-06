## ADDED Requirements

### Requirement: Tabs de Navegação com Animated Tabs
O sistema MUST padronizar tabs de navegação (troca de seção/visualização) usando um componente de Animated Tabs.

#### Scenario: Visual consistente
- **WHEN** uma tela usa tabs para alternar seções/visualizações
- **THEN** a barra de tabs deve usar container com `bg-white` e borda
- **AND** a tab ativa deve usar `bg-primary`

#### Scenario: Comportamento de expansão
- **WHEN** uma tab é selecionada
- **THEN** somente a tab ativa deve expandir e exibir o label
- **AND** as tabs inativas devem permanecer recolhidas (ícone-only)

#### Scenario: Navegação não deve ser quebrada
- **WHEN** a navegação por tabs depende de URL (query param/pathname)
- **THEN** a troca de tabs MUST manter o mesmo comportamento de roteamento existente
