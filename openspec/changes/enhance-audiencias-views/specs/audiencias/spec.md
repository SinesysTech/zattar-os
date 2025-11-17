## ADDED Requirements

### Requirement: Múltiplas Visualizações de Audiências
O sistema MUST fornecer múltiplas formas de visualizar as audiências agendadas, permitindo ao usuário escolher entre visualização de tabela, semana, mês ou ano.

#### Scenario: Seleção de visualização
- **WHEN** usuário acessa a página de audiências
- **THEN** sistema deve exibir controle para alternar entre visualizações
- **AND** visualizações disponíveis: Atual (tabela), Semana, Mês, Ano
- **AND** preservar visualização selecionada durante a sessão

#### Scenario: Visualização por semana
- **WHEN** usuário seleciona visualização por semana
- **THEN** sistema deve exibir tabs para Segunda, Terça, Quarta, Quinta e Sexta
- **AND** cada tab deve mostrar tabela de audiências do dia correspondente
- **AND** permitir navegação entre semanas

#### Scenario: Visualização por mês
- **WHEN** usuário seleciona visualização por mês
- **THEN** sistema deve exibir calendário mensal tamanho da página
- **AND** mostrar audiências nos dias correspondentes
- **AND** permitir navegação entre meses

#### Scenario: Visualização por ano
- **WHEN** usuário seleciona visualização por ano
- **THEN** sistema deve exibir grid com 12 meses pequenos
- **AND** marcar dias que possuem audiências
- **AND** permitir navegação entre anos
- **AND** permitir clicar em mês para abrir visualização mensal

### Requirement: Reorganização de Colunas da Tabela
O sistema MUST reorganizar as colunas da tabela de audiências para melhor exibir informações relevantes em formato composto.

#### Scenario: Coluna de Hora
- **WHEN** tabela de audiências é exibida
- **THEN** primeira coluna deve mostrar apenas hora inicial
- **AND** formato: HH:mm
- **AND** não mostrar data

#### Scenario: Coluna composta de Processo
- **WHEN** tabela de audiências é exibida
- **THEN** coluna "Processo" deve conter:
  - Classe processual + número do processo (sem separação)
  - Badge com TRT
  - Badge com grau (1º Grau ou 2º Grau)
  - Órgão julgador
- **AND** informações devem ser organizadas verticalmente

#### Scenario: Coluna composta de Tipo/Local
- **WHEN** tabela de audiências é exibida
- **THEN** coluna deve conter tipo de audiência e sala
- **AND** informações devem ser organizadas verticalmente

#### Scenario: Remoção de colunas desnecessárias
- **WHEN** tabela de audiências é exibida
- **THEN** não deve exibir coluna "Fim" (hora final)
- **AND** não deve exibir coluna "Status"

### Requirement: Filtro de Status como Dropdown
O sistema MUST mover o filtro de status da tabela para um dropdown separado após filtros avançados.

#### Scenario: Posicionamento do filtro
- **WHEN** página de audiências é carregada
- **THEN** dropdown de status deve aparecer após botão de filtros avançados
- **AND** antes da tabela

#### Scenario: Opções de status
- **WHEN** usuário clica no dropdown de status
- **THEN** sistema deve mostrar opções: Marcada, Realizada, Cancelada
- **AND** permitir seleção de uma opção

#### Scenario: Status default
- **WHEN** página é carregada pela primeira vez
- **THEN** dropdown deve estar com "Marcada" selecionado
- **AND** tabela deve mostrar apenas audiências marcadas

#### Scenario: Aplicação do filtro
- **WHEN** usuário seleciona status diferente
- **THEN** sistema deve recarregar audiências com novo filtro
- **AND** resetar para primeira página
- **AND** manter outros filtros ativos

## MODIFIED Requirements

### Requirement: Listagem de Audiências
O sistema MUST fornecer endpoint para listar audiências com suporte a paginação, ordenação, filtros e incluir dados relacionados de órgão julgador e classe judicial.

#### Scenario: GET /api/audiencias com paginação
- **WHEN** uma requisição GET é enviada com parâmetros page e limit
- **THEN** o sistema deve retornar página de audiências solicitada
- **AND** incluir total de registros e total de páginas
- **AND** limitar resultados ao valor de limit

#### Scenario: Ordenação por data
- **WHEN** parâmetros orderBy=data_hora e orderDirection são fornecidos
- **THEN** o sistema deve ordenar audiências pela data e hora
- **AND** aplicar direção ascendente ou descendente

#### Scenario: Listagem padrão
- **WHEN** nenhum parâmetro é fornecido
- **THEN** o sistema deve retornar primeira página com 10 registros
- **AND** ordenar por data_hora ascendente (próximas audiências primeiro)

#### Scenario: Inclusão de dados relacionados
- **WHEN** audiências são listadas
- **THEN** sistema deve incluir via JOIN:
  - Descrição do órgão julgador (tabela orgao_julgador)
  - Classe judicial (tabela acervo via processo_id)
- **AND** campos devem estar disponíveis em cada registro de audiência
