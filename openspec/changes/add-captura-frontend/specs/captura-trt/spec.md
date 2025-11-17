## ADDED Requirements

### Requirement: Interface de Usuário para Captura de Dados
O sistema SHALL fornecer uma interface de usuário web que permita aos usuários iniciar e monitorar capturas de dados do PJE-TRT através dos endpoints REST disponíveis.

#### Scenario: Acesso à página de captura
- **WHEN** um usuário autenticado acessa a página de captura
- **THEN** o sistema deve exibir formulários para cada tipo de captura disponível
- **AND** deve permitir seleção de advogado, TRT e grau
- **AND** deve exibir instruções claras sobre cada tipo de captura

#### Scenario: Iniciar captura de acervo geral
- **WHEN** um usuário preenche o formulário de acervo geral com advogado_id, trt_codigo e grau válidos
- **AND** clica no botão de captura
- **THEN** o sistema deve enviar requisição POST para `/api/captura/trt/acervo-geral`
- **AND** deve exibir indicador de loading durante a requisição
- **AND** deve exibir resultado da captura (sucesso ou erro) após conclusão
- **AND** deve mostrar quantidade de processos capturados quando bem-sucedida

#### Scenario: Iniciar captura de processos arquivados
- **WHEN** um usuário preenche o formulário de arquivados com parâmetros válidos
- **AND** clica no botão de captura
- **THEN** o sistema deve enviar requisição POST para `/api/captura/trt/arquivados`
- **AND** deve exibir feedback visual durante e após a operação
- **AND** deve mostrar total de processos arquivados capturados

#### Scenario: Iniciar captura de audiências com período
- **WHEN** um usuário preenche o formulário de audiências com advogado_id, trt_codigo, grau
- **AND** opcionalmente fornece dataInicio e dataFim
- **AND** clica no botão de captura
- **THEN** o sistema deve enviar requisição POST para `/api/captura/trt/audiencias`
- **AND** deve incluir datas fornecidas no corpo da requisição
- **AND** deve usar datas padrão (hoje até +365 dias) se não fornecidas
- **AND** deve exibir total de audiências capturadas e período utilizado

#### Scenario: Iniciar captura de pendências com filtro de prazo
- **WHEN** um usuário preenche o formulário de pendências com parâmetros válidos
- **AND** seleciona filtroPrazo (no_prazo ou sem_prazo)
- **AND** clica no botão de captura
- **THEN** o sistema deve enviar requisição POST para `/api/captura/trt/pendentes-manifestacao`
- **AND** deve incluir filtroPrazo no corpo da requisição
- **AND** deve usar "sem_prazo" como padrão se não fornecido
- **AND** deve exibir total de pendências capturadas e filtro utilizado

#### Scenario: Tratamento de erros de autenticação
- **WHEN** uma requisição de captura retorna status 401 (Não autenticado)
- **THEN** o sistema deve exibir mensagem de erro apropriada
- **AND** deve redirecionar para página de login se necessário

#### Scenario: Tratamento de credenciais não encontradas
- **WHEN** uma requisição de captura retorna status 404 com mensagem de credencial não encontrada
- **THEN** o sistema deve exibir mensagem de erro clara
- **AND** deve indicar que é necessário cadastrar credenciais para o advogado/TRT/grau especificado

#### Scenario: Tratamento de parâmetros inválidos
- **WHEN** uma requisição de captura retorna status 400 (Parâmetros inválidos)
- **THEN** o sistema deve exibir mensagem de erro específica
- **AND** deve destacar quais campos estão incorretos
- **AND** deve permitir correção e nova tentativa

#### Scenario: Tratamento de erros de servidor
- **WHEN** uma requisição de captura retorna status 500 (Erro interno)
- **THEN** o sistema deve exibir mensagem de erro genérica
- **AND** deve sugerir tentar novamente mais tarde
- **AND** deve registrar o erro para diagnóstico

#### Scenario: Validação de formulários no cliente
- **WHEN** um usuário tenta submeter formulário sem campos obrigatórios preenchidos
- **THEN** o sistema deve impedir o envio da requisição
- **AND** deve destacar campos obrigatórios não preenchidos
- **AND** deve exibir mensagens de validação apropriadas

#### Scenario: Feedback visual durante captura
- **WHEN** uma captura está em andamento
- **THEN** o sistema deve exibir indicador de loading
- **AND** deve desabilitar botão de captura para evitar requisições duplicadas
- **AND** deve mostrar mensagem informando que a captura está em progresso

#### Scenario: Exibição de resultados de captura
- **WHEN** uma captura é concluída com sucesso
- **THEN** o sistema deve exibir toast de sucesso
- **AND** deve mostrar resumo dos dados capturados (total de processos/audiências/pendências)
- **AND** deve exibir informações de persistência quando disponíveis (total, atualizados, erros)

### Requirement: Desacoplamento Front-end e Back-end
O front-end SHALL comunicar-se exclusivamente com o back-end através de chamadas HTTP REST para os endpoints de API, sem importações diretas de código do back-end.

#### Scenario: Comunicação via API REST apenas
- **WHEN** o front-end precisa executar uma captura
- **THEN** o sistema deve fazer requisição HTTP POST para o endpoint apropriado
- **AND** não deve importar serviços ou funções diretamente do diretório `backend/`
- **AND** deve usar apenas tipos TypeScript compartilhados quando necessário

#### Scenario: Cliente API isolado
- **WHEN** o front-end precisa chamar endpoints de captura
- **THEN** o sistema deve usar um cliente API centralizado em `lib/api/captura.ts`
- **AND** este cliente deve encapsular todas as chamadas HTTP
- **AND** deve tratar autenticação e formatação de requisições/respostas

#### Scenario: Tipos compartilhados
- **WHEN** o front-end precisa usar tipos de dados de captura
- **THEN** o sistema deve importar tipos de `backend/types/captura/` apenas para definições TypeScript
- **AND** não deve importar implementações ou lógica de negócio do back-end

