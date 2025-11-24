# pje-partes-api Specification

## Purpose
TBD - created by archiving change captura-partes-pje. Update Purpose after archive.
## Requirements
### Requirement: Obter Partes de um Processo
O sistema MUST fornecer função para buscar todas as partes envolvidas em um processo específico via API REST do PJE.

#### Scenario: Buscar partes de processo com múltiplas partes
- **WHEN** `obterPartesProcesso(page, idProcesso)` é chamado com ID de processo válido
- **THEN** o sistema deve fazer requisição GET para endpoint de partes do PJE
- **AND** deve retornar array de partes com dados estruturados
- **AND** deve incluir para cada parte: idParte, idPessoa, nome, tipoParte, polo, tipoDocumento, numeroDocumento
- **AND** deve incluir contatos: emails, telefones
- **AND** deve incluir flag principal (parte principal do polo)
- **AND** deve incluir dados completos em formato JSON

#### Scenario: Processo sem partes cadastradas
- **WHEN** `obterPartesProcesso(page, idProcesso)` é chamado para processo sem partes
- **THEN** o sistema deve retornar array vazio `[]`
- **AND** não deve lançar erro

#### Scenario: Processo não encontrado
- **WHEN** `obterPartesProcesso(page, idProcesso)` é chamado com ID inválido
- **THEN** o sistema deve retornar array vazio ou lançar erro específico
- **AND** deve logar erro com detalhes do processo

### Requirement: Obter Representantes de uma Parte
O sistema MUST fornecer função para buscar representantes legais (advogados, defensores, procuradores) de uma parte específica.

#### Scenario: Buscar representantes de parte com múltiplos advogados
- **WHEN** `obterRepresentantesParte(page, idParte)` é chamado com ID de parte válido
- **THEN** o sistema deve fazer requisição GET para endpoint de representantes do PJE
- **AND** deve retornar array de representantes com dados estruturados
- **AND** deve incluir para cada representante: idPessoa, nome, tipoDocumento, numeroDocumento (CPF/CNPJ)
- **AND** deve incluir dados OAB: numeroOAB, ufOAB, situacaoOAB
- **AND** deve incluir tipo: ADVOGADO, DEFENSOR_PUBLICO, PROCURADOR, etc.
- **AND** deve incluir contatos: email, telefones

#### Scenario: Parte sem representantes
- **WHEN** `obterRepresentantesParte(page, idParte)` é chamado para parte sem representação
- **THEN** o sistema deve retornar array vazio `[]`
- **AND** deve logar warning (parte sem representação é caso incomum)

#### Scenario: Representantes com dados incompletos
- **WHEN** representante não possui CPF ou numeroOAB
- **THEN** o sistema deve incluir o representante na resposta
- **AND** deve marcar campos ausentes como `null`
- **AND** deve incluir dados disponíveis

### Requirement: Tratamento de Erros e Timeouts
O sistema MUST tratar adequadamente erros de rede, timeouts e respostas inválidas da API do PJE.

#### Scenario: Timeout de requisição ao PJE
- **WHEN** requisição à API do PJE excede tempo limite configurado
- **THEN** o sistema deve tentar novamente até 3 vezes com backoff exponencial (1s, 2s, 4s)
- **AND** se todas as tentativas falharem, deve lançar erro `TimeoutError`
- **AND** deve logar cada tentativa e erro final

#### Scenario: Resposta HTTP 500 do PJE
- **WHEN** API do PJE retorna status 500 (erro interno)
- **THEN** o sistema deve tentar novamente até 2 vezes
- **AND** se falhar, deve lançar erro `PJEServerError` com mensagem descritiva
- **AND** deve incluir código de status e corpo da resposta no erro

#### Scenario: Resposta HTTP 401 (não autenticado)
- **WHEN** API do PJE retorna status 401
- **THEN** o sistema deve lançar erro `AuthenticationError`
- **AND** deve indicar que autenticação expirou ou é inválida
- **AND** não deve fazer retry (autenticação deve ser refeita)

#### Scenario: Resposta com JSON inválido
- **WHEN** API do PJE retorna resposta com JSON mal-formado
- **THEN** o sistema deve logar erro de parsing
- **AND** deve lançar erro `ParseError` com corpo da resposta
- **AND** deve incluir URL e headers da requisição para debug

### Requirement: Estrutura de Dados Padronizada
O sistema MUST retornar dados de partes e representantes em estrutura TypeScript padronizada.

#### Scenario: Mapear resposta PJE para tipo PartePJE
- **WHEN** resposta da API do PJE contém parte pessoa física
- **THEN** o sistema deve mapear para tipo `PartePJE` com:
  - `idParte: number`
  - `idPessoa: number` (id_pessoa_pje)
  - `nome: string`
  - `tipoParte: string` (ex: 'AUTOR', 'REU', 'PERITO')
  - `polo: 'ATIVO' | 'PASSIVO' | 'OUTROS'`
  - `principal: boolean`
  - `tipoDocumento: 'CPF' | 'CNPJ' | 'OUTRO'`
  - `numeroDocumento: string`
  - `emails: string[]`
  - `telefones: { ddd: string; numero: string }[]`
  - `dadosCompletos: Record<string, unknown>` (JSON original)

#### Scenario: Mapear resposta PJE para tipo RepresentantePJE
- **WHEN** resposta da API do PJE contém representante
- **THEN** o sistema deve mapear para tipo `RepresentantePJE` com:
  - `idPessoa: number`
  - `nome: string`
  - `tipoDocumento: 'CPF' | 'CNPJ'`
  - `numeroDocumento: string`
  - `numeroOAB: string | null`
  - `ufOAB: string | null`
  - `situacaoOAB: string | null`
  - `tipo: string` (ADVOGADO, DEFENSOR_PUBLICO, PROCURADOR)
  - `email: string | null`
  - `telefones: { ddd: string; numero: string }[]`
  - `dadosCompletos: Record<string, unknown>`

### Requirement: Logging e Debugging
O sistema MUST fornecer logs detalhados para facilitar debugging e monitoramento.

#### Scenario: Log de requisições bem-sucedidas
- **WHEN** requisição à API do PJE é concluída com sucesso
- **THEN** o sistema deve logar:
  - URL chamada
  - Método HTTP
  - Parâmetros da query
  - Tempo de resposta (ms)
  - Quantidade de itens retornados
- **AND** deve usar nível de log `debug` ou `info`

#### Scenario: Log de erros com contexto
- **WHEN** requisição à API do PJE falha
- **THEN** o sistema deve logar:
  - URL chamada e parâmetros
  - Código de status HTTP
  - Corpo da resposta (limitado a 500 chars)
  - Mensagem de erro
  - Stack trace
- **AND** deve usar nível de log `error`

### Requirement: Autenticação via Cookies de Sessão
O sistema MUST usar cookies de sessão existentes (obtidos via autenticação prévia) para fazer requisições autenticadas.

#### Scenario: Requisição com cookies de sessão válidos
- **WHEN** função é chamada com `page` (Puppeteer Page) já autenticada
- **THEN** o sistema deve reutilizar cookies de sessão da página
- **AND** não deve fazer nova autenticação
- **AND** requisição deve incluir headers apropriados (User-Agent, Accept)

#### Scenario: Requisição sem autenticação prévia
- **WHEN** função é chamada com `page` sem cookies de sessão
- **THEN** o sistema deve lançar erro `NotAuthenticatedError`
- **AND** deve orientar que autenticação deve ser feita primeiro via `autenticarPJE()`

