# identificacao-cliente Specification

## Purpose
TBD - created by archiving change captura-partes-pje. Update Purpose after archive.
## Requirements
### Requirement: Identificar Tipo de Parte
O sistema MUST classificar cada parte de um processo em um dos três tipos: cliente, parte_contraria ou terceiro.

#### Scenario: Parte representada por advogado do escritório é cliente
- **WHEN** `identificarTipoParte(parte, advogado)` é chamado
- **AND** parte possui representantes
- **AND** algum representante possui CPF igual ao CPF do advogado da credencial
- **THEN** o sistema deve retornar `'cliente'`
- **AND** deve logar identificação: "Parte {nome} identificada como CLIENTE (representada por {advogado})"

#### Scenario: Parte não representada por nosso advogado é parte contrária
- **WHEN** `identificarTipoParte(parte, advogado)` é chamado
- **AND** parte possui representantes
- **AND** nenhum representante possui CPF do nosso advogado
- **AND** tipo_parte não é especial (PERITO, MP, etc.)
- **THEN** o sistema deve retornar `'parte_contraria'`

#### Scenario: Parte com tipo especial é terceiro
- **WHEN** `identificarTipoParte(parte, advogado)` é chamado
- **AND** parte tem tipo_parte em lista de tipos especiais
- **THEN** o sistema deve retornar `'terceiro'` independente dos representantes
- **AND** tipos especiais devem incluir:
  - PERITO, PERITO_CONTADOR, PERITO_MEDICO
  - MINISTERIO_PUBLICO, MINISTERIO_PUBLICO_TRABALHO
  - ASSISTENTE, ASSISTENTE_TECNICO
  - TESTEMUNHA
  - CUSTOS_LEGIS
  - AMICUS_CURIAE
  - PREPOSTO, CURADOR, INVENTARIANTE, SINDICO

### Requirement: Verificação de CPF de Representantes
O sistema MUST comparar CPF dos representantes com CPF do advogado de forma robusta.

#### Scenario: Comparação com CPF formatado vs não formatado
- **WHEN** CPF do advogado é "12345678900" (sem máscara)
- **AND** CPF do representante é "123.456.789-00" (com máscara)
- **THEN** o sistema deve remover caracteres não numéricos antes de comparar
- **AND** deve considerar como match

#### Scenario: Representante sem CPF
- **WHEN** representante não possui campo `cpf` ou é null
- **THEN** o sistema deve pular esse representante
- **AND** não deve lançar erro
- **AND** deve logar warning

#### Scenario: Múltiplos representantes com nosso CPF
- **WHEN** parte tem 2 representantes do nosso escritório
- **THEN** o sistema deve retornar `'cliente'` na primeira ocorrência
- **AND** não precisa verificar demais representantes (early return)

### Requirement: Lógica de Prioridade na Classificação
O sistema MUST seguir ordem de prioridade na classificação: tipo especial > nosso representante > parte contrária.

#### Scenario: Perito representado por nosso advogado
- **WHEN** parte tem tipo_parte='PERITO'
- **AND** parte possui representante com CPF do nosso advogado
- **THEN** o sistema deve retornar `'terceiro'` (tipo especial tem prioridade)
- **AND** deve logar: "Perito identificado como TERCEIRO (mesmo representado por nós)"

#### Scenario: Autor sem representantes
- **WHEN** parte tem tipo_parte='AUTOR'
- **AND** parte não possui representantes (array vazio)
- **THEN** o sistema deve retornar `'parte_contraria'` (caso padrão)
- **AND** deve logar warning: "Parte sem representantes classificada como parte contrária"

#### Scenario: Réu representado por nosso advogado
- **WHEN** parte tem tipo_parte='REU'
- **AND** parte possui representante com nosso CPF
- **THEN** o sistema deve retornar `'cliente'` (somos defesa)

### Requirement: Suporte a Múltiplos Advogados do Escritório
O sistema MUST suportar identificação quando escritório possui múltiplos advogados com credenciais no PJE.

#### Scenario: Verificar contra lista de CPFs do escritório
- **WHEN** `identificarTipoParte(parte, cpfsEscritorio[])` é chamado com array de CPFs
- **AND** qualquer representante possui CPF na lista
- **THEN** o sistema deve retornar `'cliente'`

#### Scenario: Parte representada por dois advogados do escritório
- **WHEN** parte tem 2 representantes do escritório
- **THEN** o sistema deve retornar `'cliente'` no primeiro match
- **AND** deve logar ambos os representantes do escritório

### Requirement: Logging e Rastreabilidade
O sistema MUST fornecer logs detalhados de cada decisão de classificação para auditoria.

#### Scenario: Log de classificação como cliente
- **WHEN** parte é classificada como `'cliente'`
- **THEN** o sistema deve logar:
  - Nome da parte
  - CPF/CNPJ da parte
  - Nome do representante que causou match
  - CPF do representante
  - Número OAB do representante
- **AND** deve usar nível `info`

#### Scenario: Log de classificação como terceiro
- **WHEN** parte é classificada como `'terceiro'`
- **THEN** o sistema deve logar:
  - Nome da parte
  - Tipo da parte (PERITO, MP, etc.)
  - Razão: "Tipo especial"
- **AND** deve usar nível `info`

#### Scenario: Log de classificação como parte contrária
- **WHEN** parte é classificada como `'parte_contraria'`
- **THEN** o sistema deve logar:
  - Nome da parte
  - Total de representantes
  - Razão: "Nenhum representante do escritório"
- **AND** deve usar nível `info`

### Requirement: Validação e Sanitização de Dados
O sistema MUST validar e sanitizar dados antes de comparação.

#### Scenario: CPF com caracteres especiais
- **WHEN** CPF contém pontos, hífens ou espaços
- **THEN** o sistema deve remover usando regex `/\D/g`
- **AND** deve comparar apenas dígitos

#### Scenario: CPF inválido (todos zeros)
- **WHEN** representante possui CPF "000.000.000-00"
- **THEN** o sistema deve logar warning
- **AND** deve pular esse representante (não considerar match)
- **AND** não deve lançar erro

#### Scenario: Dados faltantes
- **WHEN** parte não possui campo `representantes` (undefined)
- **THEN** o sistema deve tratar como array vazio
- **AND** deve classificar como `'parte_contraria'`

### Requirement: Type Guards e Type Safety
O sistema MUST usar TypeScript type guards para garantir type safety.

#### Scenario: Type guard para PartePJE
- **WHEN** função recebe objeto como parte
- **THEN** o sistema deve validar que possui campos obrigatórios:
  - `idParte: number`
  - `nome: string`
  - `tipoParte: string`
  - `representantes?: array`
- **AND** deve lançar erro se campos obrigatórios ausentes

#### Scenario: Type guard para Advogado
- **WHEN** função recebe objeto como advogado
- **THEN** o sistema deve validar que possui:
  - `id: number`
  - `cpf: string`
- **AND** deve lançar erro se CPF ausente ou vazio

