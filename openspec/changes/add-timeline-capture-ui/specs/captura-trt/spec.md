## ADDED Requirements

### Requirement: Interface de Captura de Timeline de Processo
O sistema SHALL fornecer interface de usuário que permita aos usuários capturar a timeline completa (movimentos e documentos) de um processo específico do PJE-TRT através do endpoint REST `/api/captura/trt/timeline`.

#### Scenario: Selecionar tipo "Timeline" no dropdown de captura
- **WHEN** um usuário autenticado acessa a página de captura
- **AND** abre o dialog "Nova Captura"
- **THEN** o sistema deve exibir "Timeline do Processo" como opção no dropdown de tipos de captura
- **AND** deve exibir ícone FileText ao lado do label
- **AND** deve exibir descrição "Capturar movimentos e documentos do processo"

#### Scenario: Preencher formulário de captura de timeline
- **WHEN** um usuário seleciona tipo "Timeline do Processo"
- **THEN** o sistema deve exibir formulário com os seguintes campos:
  - Advogado (obrigatório, combobox)
  - Credenciais (obrigatórias, multi-select baseado no advogado)
  - Número do Processo (obrigatório, text input)
  - Baixar Documentos (checkbox, default: true)
  - Filtros Avançados (seção collapsible):
    - Apenas Assinados (checkbox, default: true)
    - Apenas Não Sigilosos (checkbox, default: true)
    - Tipos de Documento (multi-select, opcional)
    - Data Inicial (date picker, opcional)
    - Data Final (date picker, opcional)

#### Scenario: Iniciar captura de timeline com configuração mínima
- **WHEN** um usuário preenche advogado, credencial e número do processo
- **AND** mantém "Baixar Documentos" marcado (padrão)
- **AND** não altera filtros avançados
- **AND** clica no botão "Iniciar Captura de Timeline"
- **THEN** o sistema deve enviar requisição POST para `/api/captura/trt/timeline` com:
  - trtCodigo e grau extraídos da primeira credencial selecionada
  - processoId do campo número do processo
  - advogadoId do advogado selecionado
  - baixarDocumentos: true
  - filtroDocumentos: { apenasAssinados: true, apenasNaoSigilosos: true }
- **AND** deve exibir indicador de loading durante a requisição
- **AND** deve desabilitar botão durante execução

#### Scenario: Iniciar captura de timeline sem baixar documentos
- **WHEN** um usuário preenche campos obrigatórios
- **AND** desmarca checkbox "Baixar Documentos"
- **AND** clica no botão de captura
- **THEN** o sistema deve enviar requisição com baixarDocumentos: false
- **AND** não deve incluir filtroDocumentos no corpo da requisição

#### Scenario: Iniciar captura de timeline com filtros avançados
- **WHEN** um usuário preenche campos obrigatórios
- **AND** expande seção "Filtros Avançados"
- **AND** seleciona tipos de documento específicos (ex: ["Certidão", "Petição"])
- **AND** define data inicial e final
- **AND** clica no botão de captura
- **THEN** o sistema deve enviar requisição com filtroDocumentos contendo:
  - apenasAssinados conforme checkbox
  - apenasNaoSigilosos conforme checkbox
  - tipos: array com tipos selecionados
  - dataInicial: ISO 8601 string da data selecionada
  - dataFinal: ISO 8601 string da data selecionada

#### Scenario: Captura de timeline concluída com sucesso
- **WHEN** requisição de captura retorna status 200 com sucesso
- **THEN** o sistema deve exibir toast/alert de sucesso
- **AND** deve mostrar resumo dos dados capturados:
  - Total de itens na timeline
  - Total de documentos
  - Total de movimentos
  - Total de documentos baixados com sucesso
  - Total de erros (se houver)
  - ID do documento MongoDB (se salvo)
- **AND** deve habilitar botão de captura novamente

#### Scenario: Validação de campos obrigatórios
- **WHEN** um usuário tenta iniciar captura sem preencher advogado
- **THEN** o sistema deve impedir envio da requisição
- **AND** deve destacar campo advogado como obrigatório
- **AND** deve exibir mensagem de validação

#### Scenario: Validação de número do processo
- **WHEN** um usuário tenta iniciar captura com número do processo vazio
- **THEN** o sistema deve impedir envio da requisição
- **AND** deve destacar campo número do processo como obrigatório
- **AND** deve exibir mensagem de validação

#### Scenario: Tratamento de erro de processo não encontrado
- **WHEN** requisição retorna erro indicando que processo não foi encontrado
- **THEN** o sistema deve exibir mensagem de erro clara
- **AND** deve indicar que o processo pode não existir no PJE ou não estar acessível com as credenciais fornecidas
- **AND** deve sugerir verificar número do processo e credenciais

#### Scenario: Tratamento de erro de credenciais inválidas
- **WHEN** requisição retorna status 401 ou erro de autenticação
- **THEN** o sistema deve exibir mensagem indicando problema com credenciais
- **AND** deve sugerir verificar se credenciais estão ativas e válidas

#### Scenario: Tratamento de timeout na captura
- **WHEN** requisição excede tempo limite (captura demorada)
- **THEN** o sistema deve exibir mensagem informando que a captura está demorando
- **AND** deve sugerir aguardar ou verificar status no histórico de capturas
- **AND** deve permitir nova tentativa

#### Scenario: Múltiplas credenciais selecionadas
- **WHEN** um usuário seleciona múltiplas credenciais para o mesmo advogado
- **THEN** o sistema deve usar a primeira credencial da lista para extrair trtCodigo e grau
- **AND** deve incluir todas as credenciais no registro de histórico (se aplicável)
- **OR** alternativamente, deve restringir seleção a uma única credencial para captura de timeline

#### Scenario: Feedback visual durante captura longa
- **WHEN** captura de timeline está em andamento por mais de 10 segundos
- **THEN** o sistema deve manter indicador de loading ativo
- **AND** deve exibir mensagem informando que downloads de documentos podem demorar
- **AND** não deve permitir fechamento acidental do dialog durante execução
