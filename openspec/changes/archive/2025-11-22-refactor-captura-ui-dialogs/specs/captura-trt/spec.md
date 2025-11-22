# Spec Deltas: Captura de Dados do PJE-TRT

## MODIFIED Requirements

### Requirement: Interface de Usuário para Captura de Dados
O sistema SHALL fornecer uma interface de usuário web baseada em dialogs (modais) que permita aos usuários iniciar e monitorar capturas de dados do PJE-TRT através dos endpoints REST disponíveis.

#### Scenario: Acesso à página de captura
- **WHEN** um usuário autenticado acessa a página de captura
- **THEN** o sistema deve exibir tabs principais: Histórico e Agendamentos
- **AND** deve exibir botão "Nova Captura" visível no header da página
- **AND** deve exibir histórico de capturas na primeira tab (Histórico)

#### Scenario: Abrir dialog de nova captura
- **WHEN** um usuário clica no botão "Nova Captura"
- **THEN** o sistema deve abrir um dialog (modal) com formulário de captura
- **AND** deve exibir dropdown para seleção de tipo de captura
- **AND** deve incluir opções: Acervo Geral, Arquivados, Audiências e Expedientes

#### Scenario: Selecionar tipo de captura no dialog
- **WHEN** um usuário seleciona um tipo de captura no dropdown
- **THEN** o sistema deve renderizar o formulário específico para aquele tipo
- **AND** deve incluir campos comuns: seleção de advogado e credenciais
- **AND** deve incluir campos específicos do tipo (ex: datas para Audiências, filtro de prazo para Expedientes)

#### Scenario: Iniciar captura de acervo geral via dialog
- **WHEN** um usuário preenche o formulário de acervo geral no dialog com advogado_id e credencial_ids válidos
- **AND** clica no botão de captura
- **THEN** o sistema deve enviar requisição POST para `/api/captura/trt/acervo-geral`
- **AND** deve exibir indicador de loading durante a requisição
- **AND** deve fechar o dialog e exibir resultado na lista de histórico após conclusão
- **AND** deve mostrar quantidade de processos capturados quando bem-sucedida

#### Scenario: Iniciar captura de processos arquivados via dialog
- **WHEN** um usuário preenche o formulário de arquivados no dialog com parâmetros válidos
- **AND** clica no botão de captura
- **THEN** o sistema deve enviar requisição POST para `/api/captura/trt/arquivados`
- **AND** deve exibir feedback visual durante e após a operação
- **AND** deve fechar o dialog e atualizar histórico com resultado
- **AND** deve mostrar total de processos arquivados capturados

#### Scenario: Iniciar captura de audiências com período via dialog
- **WHEN** um usuário seleciona tipo "Audiências" no dropdown
- **AND** preenche advogado_id e credencial_ids
- **AND** opcionalmente fornece dataInicio e dataFim
- **AND** clica no botão de captura
- **THEN** o sistema deve enviar requisição POST para `/api/captura/trt/audiencias`
- **AND** deve incluir datas fornecidas no corpo da requisição
- **AND** deve usar datas padrão (hoje até +365 dias) se não fornecidas
- **AND** deve fechar dialog e exibir resultado com total de audiências capturadas

#### Scenario: Iniciar captura de pendências com filtro de prazo via dialog
- **WHEN** um usuário seleciona tipo "Expedientes" no dropdown
- **AND** preenche parâmetros válidos
- **AND** seleciona filtroPrazo (no_prazo ou sem_prazo)
- **AND** clica no botão de captura
- **THEN** o sistema deve enviar requisição POST para `/api/captura/trt/pendentes-manifestacao`
- **AND** deve incluir filtroPrazo no corpo da requisição
- **AND** deve usar "sem_prazo" como padrão se não fornecido
- **AND** deve fechar dialog e exibir resultado com total de pendências capturadas

#### Scenario: Cancelar dialog de nova captura
- **WHEN** um usuário clica em "Cancelar" ou fora do dialog
- **THEN** o sistema deve fechar o dialog sem executar captura
- **AND** não deve perder dados já preenchidos no formulário (opcional: manter estado)

#### Scenario: Tratamento de erros de autenticação no dialog
- **WHEN** uma requisição de captura retorna status 401 (Não autenticado)
- **THEN** o sistema deve exibir mensagem de erro no dialog
- **AND** deve permitir correção sem fechar o dialog
- **AND** pode redirecionar para página de login se sessão expirou

#### Scenario: Tratamento de credenciais não encontradas no dialog
- **WHEN** uma requisição de captura retorna status 404 com mensagem de credencial não encontrada
- **THEN** o sistema deve exibir mensagem de erro clara no dialog
- **AND** deve indicar que é necessário cadastrar credenciais
- **AND** deve manter dialog aberto para correção

#### Scenario: Tratamento de parâmetros inválidos no dialog
- **WHEN** uma requisição de captura retorna status 400 (Parâmetros inválidos)
- **THEN** o sistema deve exibir mensagem de erro específica no dialog
- **AND** deve destacar quais campos estão incorretos
- **AND** deve permitir correção e nova tentativa

#### Scenario: Validação de formulários no dialog
- **WHEN** um usuário tenta submeter formulário no dialog sem campos obrigatórios preenchidos
- **THEN** o sistema deve impedir o envio da requisição
- **AND** deve destacar campos obrigatórios não preenchidos
- **AND** deve exibir mensagens de validação apropriadas
- **AND** deve manter dialog aberto para correção

#### Scenario: Feedback visual durante captura no dialog
- **WHEN** uma captura está em andamento após submissão no dialog
- **THEN** o sistema deve exibir indicador de loading no botão de captura
- **AND** deve desabilitar botão de captura para evitar requisições duplicadas
- **AND** deve desabilitar botão de cancelar durante processamento

#### Scenario: Responsividade do dialog em dispositivos móveis
- **WHEN** um usuário acessa o dialog em dispositivo com tela pequena
- **THEN** o sistema deve ajustar layout do dialog para tela mobile
- **AND** deve manter usabilidade de todos os campos
- **AND** deve permitir scroll interno se necessário

## ADDED Requirements

### Requirement: Dropdown de Tipo de Captura
O sistema SHALL fornecer um componente dropdown para seleção de tipo de captura que substitui a navegação por tabs.

#### Scenario: Exibir opções de tipo de captura
- **WHEN** o dropdown de tipo de captura é renderizado
- **THEN** o sistema deve exibir opções: Acervo Geral, Arquivados, Audiências e Expedientes
- **AND** deve exibir ícone ou descrição breve de cada tipo
- **AND** deve ter primeiro tipo selecionado por padrão (Acervo Geral)

#### Scenario: Mudança de tipo de captura
- **WHEN** um usuário seleciona um tipo diferente no dropdown
- **THEN** o sistema deve trocar o formulário renderizado imediatamente
- **AND** deve limpar campos específicos do tipo anterior
- **AND** deve manter campos comuns (advogado, credenciais) preenchidos

#### Scenario: Acessibilidade do dropdown
- **WHEN** um usuário navega pelo dropdown usando teclado
- **THEN** o sistema deve permitir abertura com Enter ou Space
- **AND** deve permitir navegação entre opções com setas
- **AND** deve permitir seleção com Enter
- **AND** deve incluir ARIA labels apropriados

### Requirement: Dialog de Nova Captura
O sistema SHALL fornecer um dialog (modal) reutilizável que encapsula o formulário de captura com dropdown de tipo.

#### Scenario: Abrir dialog via botão "Nova Captura"
- **WHEN** o botão "Nova Captura" é clicado
- **THEN** o sistema deve abrir dialog centralizado na tela
- **AND** deve aplicar overlay escuro no background
- **AND** deve focar no primeiro campo editável
- **AND** deve incluir título "Nova Captura"

#### Scenario: Fechar dialog com ESC
- **WHEN** um usuário pressiona tecla ESC enquanto dialog está aberto
- **THEN** o sistema deve fechar o dialog
- **AND** deve retornar foco ao botão que abriu o dialog
- **AND** não deve executar captura

#### Scenario: Prevenir fechamento acidental durante captura
- **WHEN** uma captura está em andamento (estado loading)
- **AND** usuário tenta fechar o dialog (ESC, clique fora, botão X)
- **THEN** o sistema deve exibir confirmação antes de fechar
- **AND** deve avisar que captura em andamento será cancelada

#### Scenario: Animação de abertura e fechamento
- **WHEN** o dialog é aberto ou fechado
- **THEN** o sistema deve aplicar animação suave (fade in/out)
- **AND** deve aplicar animação de scale no dialog
- **AND** deve ter duração máxima de 200ms

### Requirement: Dialog de Novo Agendamento
O sistema SHALL fornecer um dialog para criação de agendamentos de captura com dropdown de tipo.

#### Scenario: Abrir dialog via botão "Novo Agendamento"
- **WHEN** um usuário clica no botão "Novo Agendamento" na tab Agendamentos
- **THEN** o sistema deve abrir dialog de novo agendamento
- **AND** deve incluir dropdown de tipo de captura
- **AND** deve incluir campos de periodicidade (diário, a cada N dias)
- **AND** deve incluir campo de horário de execução

#### Scenario: Criar agendamento via dialog
- **WHEN** um usuário preenche todos os campos obrigatórios
- **AND** clica em "Criar Agendamento"
- **THEN** o sistema deve enviar requisição para criar agendamento
- **AND** deve fechar dialog após sucesso
- **AND** deve atualizar lista de agendamentos na tab

#### Scenario: Validar campos de agendamento
- **WHEN** um usuário tenta criar agendamento sem preencher campos obrigatórios
- **THEN** o sistema deve impedir submissão
- **AND** deve destacar campos obrigatórios vazios
- **AND** deve validar formato de horário (HH:mm)
- **AND** deve validar que dias_intervalo > 0 quando periodicidade = "a_cada_N_dias"
