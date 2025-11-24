# captura-partes-service Specification

## Purpose
TBD - created by archiving change captura-partes-pje. Update Purpose after archive.
## Requirements
### Requirement: Capturar Partes de Processo
O sistema MUST fornecer serviço para capturar todas as partes de um processo específico, processá-las e persist

ir no banco.

#### Scenario: Captura de processo com cliente e parte contrária
- **WHEN** `capturarPartesProcesso(processoId, credencial)` é chamado
- **THEN** o sistema deve buscar partes via `obterPartesProcesso()`
- **AND** deve identificar tipo de cada parte (cliente/parte_contraria/terceiro)
- **AND** deve fazer upsert de entidades correspondentes
- **AND** deve criar vínculos em `processo_partes`
- **AND** deve retornar resultado com contadores: `{ clientes: 1, partesContrarias: 1, terceiros: 0 }`

#### Scenario: Captura de processo com terceiros
- **WHEN** processo possui peritos, MP ou outros terceiros
- **THEN** o sistema deve identificá-los como `terceiro` baseado em `tipo_parte`
- **AND** deve fazer upsert na tabela `terceiros`
- **AND** deve criar vínculo em `processo_partes` com `entidade_tipo: 'terceiro'`

#### Scenario: Captura com falha parcial
- **WHEN** uma das partes falha ao ser processada
- **THEN** o sistema deve logar erro específico da parte
- **AND** deve continuar processando demais partes
- **AND** deve incluir erros no resultado: `{ erros: [{ parte_id, erro }] }`
- **AND** não deve abortar captura completa

### Requirement: Processamento de Parte Individual
O sistema MUST fornecer função para processar uma parte específica, incluindo upsert de entidade e representantes.

#### Scenario: Processar parte pessoa física como cliente
- **WHEN** `processarParte(parte, processoId, 'cliente', advogado)` é chamado
- **AND** parte é pessoa física (tipoDocumento='CPF')
- **THEN** o sistema deve fazer upsert em tabela `clientes` usando `id_pessoa_pje` como chave
- **AND** deve mapear campos: nome, cpf, emails, telefones, dados_pje_completo
- **AND** deve retornar entidade criada/atualizada com ID

#### Scenario: Processar parte pessoa jurídica como parte contrária
- **WHEN** `processarParte(parte, processoId, 'parte_contraria', advogado)` é chamado
- **AND** parte é pessoa jurídica (tipoDocumento='CNPJ')
- **THEN** o sistema deve fazer upsert em tabela `partes_contrarias`
- **AND** deve mapear campos: nome (razão social), cnpj, emails, telefones
- **AND** deve definir tipo_pessoa='pj'

#### Scenario: Processar parte com dados incompletos
- **WHEN** parte não possui email ou telefone
- **THEN** o sistema deve salvar parte com campos nulos
- **AND** não deve lançar erro de validação
- **AND** deve logar warning sobre dados incompletos

### Requirement: Processamento de Representantes
O sistema MUST capturar e salvar representantes (advogados) de cada parte.

#### Scenario: Salvar múltiplos representantes de uma parte
- **WHEN** parte possui 3 representantes
- **THEN** o sistema deve fazer upsert de cada representante na tabela `representantes`
- **AND** deve vincular cada representante à parte via `parte_tipo` e `parte_id`
- **AND** deve usar composite key `(id_pessoa_pje, parte_tipo, parte_id, numero_processo)` para upsert
- **AND** deve mapear campos: nome, cpf, numero_oab, uf_oab, situacao_oab

#### Scenario: Representante com mesmo CPF em múltiplas partes
- **WHEN** mesmo advogado representa múltiplas partes no processo
- **THEN** o sistema deve criar registros separados em `representantes` para cada parte
- **AND** cada registro deve ter `parte_id` diferente
- **AND** deve manter `id_pessoa_pje` igual

#### Scenario: Representante sem número OAB
- **WHEN** representante não possui numero_oab (ex: defensor público)
- **THEN** o sistema deve salvar representante com `numero_oab: null`
- **AND** não deve lançar erro de validação
- **AND** deve incluir `tipo: 'DEFENSOR_PUBLICO'` ou tipo apropriado

### Requirement: Criação de Vínculos Processo-Partes
O sistema MUST criar relacionamento N:N entre processos e partes na tabela `processo_partes`.

#### Scenario: Criar vínculo processo-cliente
- **WHEN** parte é identificada como cliente
- **THEN** o sistema deve inserir registro em `processo_partes` com:
  - `processo_id`: ID do processo na tabela `acervo`
  - `entidade_tipo: 'cliente'`
  - `entidade_id`: ID do cliente
  - `polo`: extraído da parte ('ativo' ou 'passivo')
  - `tipo_parte`: tipo da parte no PJE ('AUTOR', 'REU', etc.)
  - `principal`: boolean indicando parte principal
  - `ordem`: índice da parte na lista
  - `dados_pje_completo`: JSON completo da parte

#### Scenario: Atualizar vínculo existente
- **WHEN** vínculo processo-parte já existe (mesmos processo_id, entidade_tipo, entidade_id)
- **THEN** o sistema deve atualizar campos mutáveis: polo, tipo_parte, principal, ordem
- **AND** deve atualizar `dados_pje_completo` com dados mais recentes
- **AND** deve atualizar `updated_at`

#### Scenario: Múltiplas partes do mesmo tipo no processo
- **WHEN** processo possui 2 autores (clientes)
- **THEN** o sistema deve criar 2 registros em `processo_partes`
- **AND** deve diferenciar por `ordem` (0, 1)
- **AND** deve marcar apenas um como `principal: true`

### Requirement: Deduplicação via id_pessoa_pje
O sistema MUST usar `id_pessoa_pje` + `trt` + `grau` como chave de deduplicação para evitar entidades duplicadas.

#### Scenario: Parte já existe no banco (recaptura)
- **WHEN** parte com mesmo `id_pessoa_pje`, `trt` e `grau` já existe
- **THEN** o sistema deve fazer UPDATE dos dados (upsert)
- **AND** deve atualizar campos: nome, emails, telefones, dados_pje_completo
- **AND** deve manter `id` e `created_at` originais
- **AND** deve atualizar `updated_at`

#### Scenario: Mesma pessoa em tribunais diferentes
- **WHEN** mesma pessoa (CPF) aparece em processos de TRT3 e TRT5
- **THEN** o sistema deve criar 2 registros (TRTs diferentes)
- **AND** cada registro deve ter `trt` diferente
- **AND** ambos podem ter mesmo `id_pessoa_pje` (dependendo do PJE) ou diferentes

#### Scenario: Mesma pessoa em graus diferentes do mesmo TRT
- **WHEN** mesma pessoa aparece em 1º grau e 2º grau do TRT3
- **THEN** o sistema deve criar 2 registros (graus diferentes)
- **AND** cada registro deve ter `grau` diferente
- **AND** podem ter `id_pessoa_pje` diferentes (PJE pode usar IDs diferentes)

### Requirement: Logging Detalhado
O sistema MUST fornecer logs estruturados para cada etapa do processamento.

#### Scenario: Log de início de captura
- **WHEN** captura é iniciada
- **THEN** o sistema deve logar:
  - Timestamp de início
  - `processo_id` e `numero_processo`
  - `advogado_id` e CPF do advogado
  - Total de processos a capturar
- **AND** deve usar nível `info`

#### Scenario: Log de parte processada
- **WHEN** cada parte é processada com sucesso
- **THEN** o sistema deve logar:
  - Tipo identificado (cliente/parte_contraria/terceiro)
  - Nome da parte
  - CPF/CNPJ
  - Quantidade de representantes
  - Se é parte principal
- **AND** deve usar nível `debug` ou `info`

#### Scenario: Log de erros de processamento
- **WHEN** ocorre erro ao processar parte
- **THEN** o sistema deve logar:
  - Dados da parte (JSON sanitizado)
  - Mensagem de erro completa
  - Stack trace
  - Contexto (processo_id, parte_index)
- **AND** deve usar nível `error`

#### Scenario: Log de resumo final
- **WHEN** captura é concluída
- **THEN** o sistema deve logar:
  - Total de processos processados
  - Total de partes por tipo (clientes, partes_contrarias, terceiros)
  - Total de representantes salvos
  - Total de vínculos criados
  - Total de erros
  - Tempo total de execução (ms)
- **AND** deve usar nível `info`

### Requirement: Tratamento de Transações
O sistema MUST usar transações de banco de dados para garantir consistência.

#### Scenario: Rollback em caso de erro fatal
- **WHEN** erro crítico ocorre durante processamento de parte
- **THEN** o sistema deve fazer rollback da transação atual
- **AND** não deve salvar parte parcialmente processada
- **AND** deve tentar continuar com próxima parte em nova transação

#### Scenario: Commit por parte processada
- **WHEN** parte é processada com sucesso (entidade + representantes + vínculo)
- **THEN** o sistema deve fazer commit da transação
- **AND** deve garantir atomicidade (tudo ou nada para aquela parte)

### Requirement: Performance e Otimização
O sistema MUST otimizar queries ao banco para captura de múltiplos processos.

#### Scenario: Batch upsert de representantes
- **WHEN** parte possui 5 representantes
- **THEN** o sistema deve fazer upsert em lote (single query)
- **AND** deve reduzir round-trips ao banco
- **AND** deve manter atomicidade (transação única)

#### Scenario: Cache de advogado por CPF
- **WHEN** múltiplas partes são processadas na mesma captura
- **THEN** o sistema deve cachear map `cpf → advogado_id` em memória
- **AND** deve evitar queries repetidas ao banco
- **AND** cache deve ser descartado ao final da captura

#### Scenario: Limite de processamento paralelo
- **WHEN** capturando partes de muitos processos
- **THEN** o sistema deve limitar paralelismo a 5 processos simultâneos
- **AND** deve evitar sobrecarregar PJE ou banco de dados
- **AND** deve usar fila de processamento

