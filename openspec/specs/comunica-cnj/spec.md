# comunica-cnj Specification

## Purpose
TBD - created by archiving change add-comunica-cnj-integration. Update Purpose after archive.
## Requirements
### Requirement: Tabela comunica_cnj

The system MUST armazenar comunicações capturadas da API do CNJ na tabela `comunica_cnj`.

#### Scenario: Estrutura da tabela

```
GIVEN a tabela comunica_cnj existe
THEN MUST conter as seguintes colunas:
  | Coluna                   | Tipo                      | Nullable | Descrição                           |
  |--------------------------|---------------------------|----------|-------------------------------------|
  | id                       | bigint (identity)         | NOT NULL | PK                                  |
  | id_cnj                   | bigint                    | NOT NULL | ID da comunicação na API CNJ        |
  | hash                     | text                      | NOT NULL | Hash único da certidão (UNIQUE)     |
  | numero_comunicacao       | integer                   | NULL     | Número da comunicação               |
  | numero_processo          | text                      | NOT NULL | Número do processo                  |
  | numero_processo_mascara  | text                      | NULL     | Número com máscara CNJ              |
  | sigla_tribunal           | text                      | NOT NULL | Sigla do tribunal (TRT1, TJSP)      |
  | orgao_id                 | integer                   | NULL     | ID do órgão no CNJ                  |
  | nome_orgao               | text                      | NULL     | Nome do órgão julgador              |
  | tipo_comunicacao         | text                      | NULL     | Tipo (Intimação, Citação)           |
  | tipo_documento           | text                      | NULL     | Tipo do documento                   |
  | nome_classe              | text                      | NULL     | Nome da classe judicial             |
  | codigo_classe            | text                      | NULL     | Código da classe judicial           |
  | meio                     | meio_comunicacao          | NOT NULL | 'E' (Edital) ou 'D' (Diário)        |
  | meio_completo            | text                      | NULL     | Descrição completa do meio          |
  | texto                    | text                      | NULL     | Texto da comunicação                |
  | link                     | text                      | NULL     | Link de validação                   |
  | data_disponibilizacao    | date                      | NOT NULL | Data de publicação                  |
  | ativo                    | boolean                   | DEFAULT true | Status ativo                     |
  | status                   | text                      | NULL     | Status ('P' = Pendente)             |
  | motivo_cancelamento      | text                      | NULL     | Motivo se cancelada                 |
  | data_cancelamento        | timestamptz               | NULL     | Data do cancelamento                |
  | destinatarios            | jsonb                     | NULL     | Array de destinatários              |
  | destinatarios_advogados  | jsonb                     | NULL     | Array de advogados                  |
  | expediente_id            | bigint (FK)               | NULL     | Referência ao expediente (UNIQUE)   |
  | advogado_id              | bigint (FK)               | NULL     | Advogado que capturou               |
  | metadados                | jsonb                     | NULL     | JSON completo da API                |
  | created_at               | timestamptz               | DEFAULT now() |                              |
  | updated_at               | timestamptz               | DEFAULT now() |                              |
```

---

### Requirement: Enum `meio_comunicacao`

The system MUST ter um enum para o meio de comunicação.

#### Scenario: Valores do enum

```
GIVEN o enum meio_comunicacao
THEN MUST aceitar os valores:
  - 'E' (Edital)
  - 'D' (Diário Eletrônico)
```

---

### Requirement: Cliente HTTP para API CNJ

The system MUST ter um cliente HTTP para comunicação com a API do CNJ.

#### Scenario: Consultar comunicações

```
GIVEN parâmetros de busca válidos
WHEN o método consultarComunicacoes é chamado
THEN MUST retornar lista de comunicações paginada
AND MUST respeitar rate limiting da API
```

#### Scenario: Obter certidão PDF

```
GIVEN um hash válido de comunicação
WHEN o método obterCertidao é chamado
THEN MUST retornar o PDF da certidão como ArrayBuffer
```

#### Scenario: Rate limiting

```
GIVEN uma resposta com status 429
WHEN o cliente recebe a resposta
THEN MUST aguardar 60 segundos antes de retry
AND MUST aplicar backoff exponencial em retries subsequentes
```

---

### Requirement: Busca Manual de Comunicações

Authenticated users MUST poder buscar comunicações na API do CNJ.

#### Scenario: Busca com filtros

```
GIVEN um usuário autenticado
AND pelo menos um filtro preenchido (siglaTribunal, texto, nomeParte, nomeAdvogado, numeroOab, numeroProcesso ou itensPorPagina=5)
WHEN o usuário executa a busca
THEN o system must consultar a API do CNJ em tempo real
AND retornar os resultados sem persistir no banco
```

#### Scenario: Busca sem filtros obrigatórios

```
GIVEN um usuário autenticado
AND nenhum filtro preenchido
WHEN o usuário tenta executar a busca
THEN o system must retornar erro de validação
```

---

### Requirement: Captura de Comunicações

The system MUST capturar e persistir comunicações do CNJ.

#### Scenario: Captura por OAB

```
GIVEN um agendamento de captura ativo
AND um advogado com OAB cadastrada
WHEN o scheduler executa a captura
THEN MUST buscar comunicações por OAB na API CNJ
AND persistir comunicações não existentes
AND vincular com expedientes correspondentes
```

#### Scenario: Comunicação já existente

```
GIVEN uma comunicação com hash X existe no banco
WHEN a captura encontra comunicação com mesmo hash X
THEN MUST ignorar (skip) a comunicação
```

---

### Requirement: Vinculação Comunicação ↔ Expediente

The system MUST vincular comunicações com expedientes existentes.

#### Scenario: Match encontrado

```
GIVEN uma comunicação com:
  - numero_processo = '0001234-56.2023.5.01.0001'
  - sigla_tribunal = 'TRT1'
  - data_disponibilizacao = '2025-12-04'
AND existe um expediente com:
  - numero_processo = '0001234-56.2023.5.01.0001'
  - trt = 'TRT1'
  - grau = (inferido da comunicação)
  - data_criacao_expediente entre '2025-12-01' e '2025-12-04'
  - sem comunicação vinculada
WHEN a captura processa a comunicação
THEN MUST vincular comunicacao_cnj.expediente_id = expediente.id
```

#### Scenario: Match não encontrado - criar expediente

```
GIVEN uma comunicação sem expediente correspondente
WHEN a captura processa a comunicação
THEN MUST criar um novo expediente com:
  - origem = 'comunica_cnj'
  - numero_processo = (da comunicação)
  - trt = sigla_tribunal
  - grau = (inferido do nome do órgão)
  - data_criacao_expediente = data_disponibilizacao
  - nome_parte_autora = (primeiro destinatário polo 'A')
  - nome_parte_re = (primeiro destinatário polo 'P')
  - descricao_orgao_julgador = nome_orgao
AND vincular a comunicação ao expediente criado
```

---

### Requirement: Inferência de Grau

The system MUST inferir o grau de jurisdição a partir do nome do órgão.

#### Scenario: Primeiro grau

```
GIVEN nome_orgao contém 'Vara', 'Comarca' ou 'Fórum'
WHEN o sistema infere o grau
THEN MUST retornar 'primeiro_grau'
```

#### Scenario: Segundo grau

```
GIVEN nome_orgao contém 'Turma', 'Gabinete' ou 'Segundo Grau'
WHEN o sistema infere o grau
THEN MUST retornar 'segundo_grau'
```

#### Scenario: Tribunal superior

```
GIVEN nome_orgao contém 'Ministro' ou sigla_tribunal = 'TST'
WHEN o sistema infere o grau
THEN MUST retornar 'tribunal_superior'
```

---

### Requirement: Extração de Partes

The system MUST extrair informações das partes dos destinatários.

#### Scenario: Extração de polo ativo e passivo

```
GIVEN uma comunicação com destinatarios:
  [
    { "nome": "João Silva", "polo": "A" },
    { "nome": "Empresa XYZ", "polo": "P" }
  ]
WHEN o sistema extrai as partes
THEN nome_parte_autora = 'João Silva'
AND nome_parte_re = 'Empresa XYZ'
```

#### Scenario: Múltiplos destinatários no mesmo polo

```
GIVEN uma comunicação com múltiplos destinatários no polo ativo
WHEN o sistema extrai as partes
THEN nome_parte_autora = (primeiro do polo 'A')
AND qtde_parte_autora = (total do polo 'A')
```

---

### Requirement: API Routes

The system MUST expor endpoints REST para Comunica CNJ.

#### Scenario: GET /api/comunica-cnj/consulta

```
GIVEN um usuário autenticado
WHEN faz GET /api/comunica-cnj/consulta com parâmetros válidos
THEN MUST retornar resultados da API CNJ
AND status 200
```

#### Scenario: GET /api/comunica-cnj/certidao/[hash]

```
GIVEN um hash válido
WHEN faz GET /api/comunica-cnj/certidao/{hash}
THEN MUST retornar PDF da certidão
AND Content-Type = application/pdf
```

#### Scenario: GET /api/comunica-cnj/tribunais

```
GIVEN um usuário autenticado
WHEN faz GET /api/comunica-cnj/tribunais
THEN MUST retornar lista de tribunais do banco de dados
```

#### Scenario: POST /api/comunica-cnj/captura

```
GIVEN um usuário com permissão de captura
AND parâmetros de captura (advogado_id ou OAB)
WHEN faz POST /api/comunica-cnj/captura
THEN MUST executar captura e persistência
AND retornar estatísticas (total, novos, vinculados, criados)
```

---

### Requirement: Agendamento de Captura

The system MUST permitir agendar capturas automáticas do CNJ.

#### Scenario: Criar agendamento

```
GIVEN um advogado com OAB cadastrada
WHEN um agendamento é criado com tipo_captura = 'comunica_cnj'
THEN MUST executar diariamente no horário configurado
AND buscar comunicações por OAB do advogado
```

