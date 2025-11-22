# Capability Delta: Captura de Dados do PJE-TRT

## MODIFIED Requirements

### Requirement: Captura de Pendências de Manifestação
O sistema MUST capturar pendências que requerem manifestação do advogado, opcionalmente incluindo os documentos PDF associados.

#### Scenario: Captura de pendências ativas
- **WHEN** uma captura de pendências é solicitada
- **THEN** o sistema deve acessar a lista de pendências de manifestação
- **AND** extrair tipo, prazo e detalhes de cada pendência
- **AND** vincular pendências aos processos correspondentes
- **AND** calcular prazo restante baseado na data limite

#### Scenario: Captura de pendências com documentos
- **WHEN** uma captura de pendências é solicitada com parâmetro `capturarDocumentos: true`
- **THEN** o sistema deve capturar dados da pendência
- **AND** buscar documento PDF associado do PJE
- **AND** fazer upload do documento para Google Drive
- **AND** armazenar informações do arquivo no banco de dados
- **AND** continuar captura mesmo se documento falhar

#### Scenario: Captura de pendências sem documentos
- **WHEN** uma captura de pendências é solicitada com `capturarDocumentos: false` ou parâmetro omitido
- **THEN** o sistema deve capturar apenas dados da pendência
- **AND** não buscar documentos PDF

#### Scenario: Erro na captura de documento não bloqueia pendência
- **WHEN** captura de documento de uma pendência falha
- **THEN** o sistema deve logar o erro
- **AND** salvar pendência sem documento
- **AND** continuar processamento das próximas pendências

#### Scenario: Estatísticas de documentos capturados
- **WHEN** captura finaliza com `capturarDocumentos: true`
- **THEN** o sistema deve incluir no resultado:
  - `documentosCapturados: number` - Total de documentos baixados com sucesso
  - `documentosFalhados: number` - Total de documentos que falharam
  - `errosDocumentos: string[]` - Lista de mensagens de erro

#### Scenario: Pendências vencidas
- **WHEN** uma pendência possui prazo expirado
- **THEN** o sistema deve marcar a pendência como vencida
- **AND** destacar visualmente na interface

## MODIFIED Requirements

### Requirement: Endpoint POST /api/captura/trt/pendentes-manifestacao com credencial_id
O sistema MUST fornecer endpoint REST para captura de pendências de manifestação com suporte opcional a captura de documentos.

#### Scenario: Captura de pendências sem documentos (default)
- **WHEN** uma requisição POST é enviada com `advogado_id` e `credencial_ids[]`
- **AND** campo `capturarDocumentos` não é fornecido ou é `false`
- **THEN** o sistema deve buscar credenciais pelos IDs fornecidos
- **AND** iniciar captura de pendências para cada credencial
- **AND** retornar lista de pendências capturadas sem documentos

#### Scenario: Captura de pendências com documentos
- **WHEN** uma requisição POST é enviada com `advogado_id`, `credencial_ids[]` e `capturarDocumentos: true`
- **THEN** o sistema deve buscar credenciais pelos IDs fornecidos
- **AND** iniciar captura de pendências para cada credencial
- **AND** para cada pendência capturada, buscar e fazer upload do documento PDF
- **AND** retornar lista de pendências com informações de documento incluídas
- **AND** incluir estatísticas de documentos (capturados, falhados)

#### Scenario: Captura de documentos com rate limiting
- **WHEN** múltiplas pendências são capturadas com `capturarDocumentos: true`
- **THEN** o sistema deve aplicar delay de 500ms entre capturas de documentos
- **AND** evitar sobrecarga da API PJE

#### Scenario: Resposta assíncrona para capturas longas
- **WHEN** uma captura é iniciada e pode levar vários minutos
- **THEN** o sistema deve retornar resposta imediata com status "in_progress"
- **AND** incluir identificador de captura para consulta posterior
- **AND** registrar captura no histórico para acompanhamento
