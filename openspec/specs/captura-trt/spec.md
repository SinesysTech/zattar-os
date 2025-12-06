# Capability: Captura de Dados do PJE-TRT

## Purpose
Sistema de captura automatizada de dados do Processo Judicial Eletrônico dos Tribunais Regionais do Trabalho (PJE-TRT). Realiza autenticação via SSO com suporte a 2FA (OTP) e captura acervo geral, processos arquivados, audiências e pendências de manifestação através de web scraping automatizado.
## Requirements
### Requirement: Autenticação SSO com 2FA
O sistema MUST autenticar usuários no sistema PJE-TRT através de Single Sign-On (SSO) com suporte a autenticação de dois fatores (2FA) via OTP.

#### Scenario: Autenticação com credenciais válidas sem 2FA
- **WHEN** um usuário fornece CPF e senha válidos
- **THEN** o sistema deve obter cookies de sessão e permitir acesso ao PJE
- **AND** as credenciais devem ser cacheadas para uso futuro

#### Scenario: Autenticação com 2FA habilitado
- **WHEN** um usuário com 2FA habilitado fornece credenciais válidas
- **THEN** o sistema deve solicitar o código OTP
- **AND** autenticar com o código fornecido
- **AND** armazenar os cookies de sessão

#### Scenario: Credenciais inválidas
- **WHEN** um usuário fornece credenciais inválidas
- **THEN** o sistema deve retornar erro de autenticação
- **AND** não deve cachear as credenciais inválidas

### Requirement: Captura de Acervo Geral
O sistema MUST capturar a lista completa de processos do acervo geral do advogado no PJE-TRT.

#### Scenario: Captura bem-sucedida de acervo
- **WHEN** uma captura de acervo é solicitada com credenciais válidas
- **THEN** o sistema deve acessar a página de acervo geral do PJE
- **AND** extrair dados de todos os processos listados
- **AND** persistir os dados no banco de dados
- **AND** registrar log da captura com timestamp

#### Scenario: Captura com paginação
- **WHEN** o acervo possui mais de uma página de resultados
- **THEN** o sistema deve navegar por todas as páginas
- **AND** capturar dados de todos os processos

#### Scenario: Atualização de processos existentes
- **WHEN** um processo já existe no banco de dados
- **THEN** o sistema deve atualizar os dados existentes
- **AND** manter o histórico de alterações

### Requirement: Captura de Processos Arquivados
O sistema MUST capturar processos que foram arquivados no PJE-TRT.

#### Scenario: Captura de processos arquivados
- **WHEN** uma captura de arquivados é solicitada
- **THEN** o sistema deve acessar a área de processos arquivados
- **AND** extrair dados de todos os processos arquivados
- **AND** marcar os processos como arquivados no banco de dados

### Requirement: Captura de Audiências
O sistema MUST capturar informações sobre audiências agendadas dos processos.

#### Scenario: Captura de audiências futuras
- **WHEN** uma captura de audiências é solicitada
- **THEN** o sistema deve acessar a lista de audiências do PJE
- **AND** extrair data, hora, tipo e detalhes de cada audiência
- **AND** vincular audiências aos processos correspondentes
- **AND** persistir no banco de dados

#### Scenario: Audiências sem processo vinculado
- **WHEN** uma audiência não possui processo correspondente no banco
- **THEN** o sistema deve criar um registro de processo temporário
- **AND** vincular a audiência a este processo

### Requirement: Captura de Pendências de Manifestação
O sistema MUST capturar pendências que requerem manifestação do advogado.

#### Scenario: Captura de pendências ativas
- **WHEN** uma captura de pendências é solicitada
- **THEN** o sistema deve acessar a lista de pendências de manifestação
- **AND** extrair tipo, prazo e detalhes de cada pendência
- **AND** vincular pendências aos processos correspondentes
- **AND** calcular prazo restante baseado na data limite

#### Scenario: Pendências vencidas
- **WHEN** uma pendência possui prazo expirado
- **THEN** o sistema deve marcar a pendência como vencida
- **AND** destacar visualmente na interface

### Requirement: Cache de Credenciais
O sistema MUST manter cache de credenciais de autenticação para otimizar capturas frequentes.

#### Scenario: Uso de credenciais cacheadas
- **WHEN** credenciais válidas estão em cache
- **THEN** o sistema deve reutilizar os cookies de sessão existentes
- **AND** evitar nova autenticação SSO

#### Scenario: Renovação de credenciais expiradas
- **WHEN** os cookies de sessão expiram
- **THEN** o sistema deve detectar a expiração
- **AND** realizar nova autenticação automaticamente
- **AND** atualizar o cache

### Requirement: Suporte Multi-Tribunal
O sistema MUST suportar captura de dados de múltiplos Tribunais Regionais do Trabalho (TRT1 a TRT24) através de configurações dinâmicas armazenadas no banco de dados.

#### Scenario: Captura em tribunal específico
- **WHEN** uma captura é solicitada para um TRT específico
- **THEN** o sistema deve buscar configuração daquele TRT na tabela `tribunais_config`
- **AND** deve acessar a URL correspondente ao TRT
- **AND** deve aplicar configurações e timeouts específicos do tribunal
- **AND** deve capturar dados usando a estrutura HTML específica

#### Scenario: Adaptação a diferenças entre tribunais
- **WHEN** tribunais possuem estruturas HTML diferentes ou timeouts específicos
- **THEN** o sistema deve buscar configurações customizadas do banco
- **AND** deve adaptar timeouts conforme configuração `customTimeouts`
- **AND** deve garantir captura consistente

#### Scenario: Listar tribunais disponíveis
- **WHEN** o sistema precisa listar todos os tribunais configurados
- **THEN** o sistema deve consultar tabela `tribunais_config` via join com `tribunais`
- **AND** deve retornar apenas tribunais com configuração ativa
- **AND** deve incluir informações de tribunal (código, nome, região, UF)

### Requirement: Registro de Logs de Captura
O sistema MUST registrar logs detalhados de todas as operações de captura.

#### Scenario: Log de captura bem-sucedida
- **WHEN** uma captura é concluída com sucesso
- **THEN** o sistema deve registrar timestamp, usuário, tipo de captura e quantidade de registros
- **AND** persistir o log no banco de dados

#### Scenario: Log de erros de captura
- **WHEN** uma captura falha
- **THEN** o sistema deve registrar o erro com stack trace
- **AND** identificar o ponto de falha
- **AND** permitir diagnóstico e correção

### Requirement: API REST para Captura
O sistema MUST fornecer endpoints REST para iniciar capturas de dados do PJE-TRT usando credenciais identificadas por ID.

#### Scenario: Endpoint POST /api/captura/trt/acervo-geral com credencial_id
- **WHEN** uma requisição POST é enviada com `advogado_id` e `credencial_ids[]`
- **THEN** o sistema deve buscar credenciais pelos IDs fornecidos
- **AND** extrair tribunal e grau de cada credencial
- **AND** iniciar captura de acervo geral para cada credencial
- **AND** retornar status da operação com identificador de captura
- **AND** registrar captura no histórico com status "in_progress"

#### Scenario: Endpoint POST /api/captura/trt/arquivados com credencial_id
- **WHEN** uma requisição POST é enviada com `advogado_id` e `credencial_ids[]`
- **THEN** o sistema deve buscar credenciais pelos IDs fornecidos
- **AND** iniciar captura de processos arquivados para cada credencial
- **AND** retornar resultado da operação

#### Scenario: Endpoint POST /api/captura/trt/audiencias com credencial_id
- **WHEN** uma requisição POST é enviada com `advogado_id` e `credencial_ids[]`
- **THEN** o sistema deve buscar credenciais pelos IDs fornecidos
- **AND** iniciar captura de audiências para cada credencial
- **AND** retornar lista de audiências capturadas

#### Scenario: Endpoint POST /api/captura/trt/pendentes-manifestacao com credencial_id
- **WHEN** uma requisição POST é enviada com `advogado_id` e `credencial_ids[]`
- **THEN** o sistema deve buscar credenciais pelos IDs fornecidos
- **AND** iniciar captura de pendências para cada credencial
- **AND** retornar lista de pendências capturadas

#### Scenario: Resposta assíncrona para capturas longas
- **WHEN** uma captura é iniciada e pode levar vários minutos
- **THEN** o sistema deve retornar resposta imediata com status "in_progress"
- **AND** incluir identificador de captura para consulta posterior
- **AND** registrar captura no histórico para acompanhamento

### Requirement: Tratamento de Erros e Rate Limiting
O sistema MUST tratar adequadamente erros de rede, timeouts e rate limiting do PJE.

#### Scenario: Timeout de requisição
- **WHEN** uma requisição ao PJE excede o tempo limite
- **THEN** o sistema deve tentar novamente até 3 vezes
- **AND** registrar o erro se todas as tentativas falharem

#### Scenario: Rate limiting do PJE
- **WHEN** o PJE retorna erro de muitas requisições
- **THEN** o sistema deve aguardar período de espera
- **AND** retomar a captura automaticamente

#### Scenario: Erro de rede
- **WHEN** ocorre erro de conexão de rede
- **THEN** o sistema deve retornar erro apropriado
- **AND** não corromper dados parcialmente capturados

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

### Requirement: Histórico de Capturas
O sistema MUST manter histórico de todas as capturas realizadas para consulta e auditoria.

#### Scenario: Listar histórico de capturas
- **WHEN** um usuário acessa o endpoint GET /api/captura/historico
- **THEN** o sistema deve retornar lista de capturas realizadas
- **AND** incluir status, tipo de captura, advogado, credenciais utilizadas
- **AND** incluir resultado ou erro se disponível
- **AND** ordenar por data de início (mais recentes primeiro)

#### Scenario: Consultar status de captura específica
- **WHEN** um usuário consulta uma captura pelo ID
- **THEN** o sistema deve retornar status atual (pending, in_progress, completed, failed)
- **AND** incluir resultado completo se concluída
- **AND** incluir mensagem de erro se falhou

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

### Requirement: Configuração de Tribunais via Banco de Dados
O sistema MUST buscar configurações de tribunais (URLs e timeouts) a partir da tabela `tribunais_config` no banco de dados PostgreSQL, em vez de usar valores hardcoded.

#### Scenario: Buscar configuração existente no banco
- **WHEN** o sistema precisa obter configuração para um tribunal e grau específicos
- **THEN** o sistema deve consultar a tabela `tribunais_config` via relacionamento com `tribunais`
- **AND** deve retornar objeto com `codigo`, `nome`, `grau`, `loginUrl`, `baseUrl`, `apiUrl` e `customTimeouts`
- **AND** deve cachear o resultado em memória por 5 minutos para reduzir queries

#### Scenario: Configuração não encontrada no banco
- **WHEN** uma configuração não existe na tabela `tribunais_config`
- **THEN** o sistema deve retornar erro indicando tribunal/grau não configurado
- **AND** deve logar o erro para diagnóstico
- **AND** não deve tentar fallback para configuração hardcoded

#### Scenario: Atualização de configuração no banco
- **WHEN** uma configuração de tribunal é atualizada na tabela `tribunais_config`
- **THEN** o sistema deve invalidar o cache para aquele tribunal/grau
- **AND** deve buscar nova configuração na próxima requisição
- **AND** não deve requerer restart da aplicação

#### Scenario: Cache de configurações
- **WHEN** múltiplas capturas são executadas para o mesmo tribunal/grau em sequência
- **THEN** o sistema deve reutilizar configuração cacheada em memória
- **AND** deve evitar queries repetidas ao banco de dados
- **AND** deve respeitar TTL de 5 minutos antes de revalidar

#### Scenario: Timeouts customizados por tribunal
- **WHEN** um tribunal possui timeouts customizados no campo `customTimeouts` (JSONB)
- **THEN** o sistema deve aplicar esses timeouts específicos em vez dos padrões
- **AND** deve validar estrutura do objeto JSON antes de usar
- **AND** deve usar timeout padrão se customTimeout for inválido ou null

