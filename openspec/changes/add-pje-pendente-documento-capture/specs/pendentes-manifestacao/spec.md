# Capability Delta: Gestão de Pendências de Manifestação

## ADDED Requirements

### Requirement: Armazenamento de Documentos
O sistema MUST armazenar informações sobre documentos PDF associados a pendências de manifestação.

#### Scenario: Pendência com documento
- **WHEN** um documento PDF é capturado e associado a uma pendência
- **THEN** o sistema deve armazenar `arquivo_nome`, `arquivo_url_visualizacao` e `arquivo_url_download`
- **AND** permitir acesso ao documento via URL armazenada

#### Scenario: Pendência sem documento
- **WHEN** uma pendência não possui documento capturado
- **THEN** os campos `arquivo_nome`, `arquivo_url_visualizacao` e `arquivo_url_download` devem ser NULL
- **AND** interface deve exibir opção de buscar documento

#### Scenario: Listagem com documentos
- **WHEN** pendências são listadas
- **THEN** o sistema deve incluir campos de documento na resposta
- **AND** indicar claramente quais pendências possuem documento disponível

### Requirement: Captura de Documento do PJE
O sistema MUST fornecer endpoint para buscar documento PDF de uma pendência específica do PJE.

#### Scenario: POST /api/pje/pendente-manifestacao/documento com sucesso
- **WHEN** uma requisição POST é enviada com `pendenteId`, `processoId`, `documentoId` e credenciais válidas
- **THEN** o sistema deve autenticar no PJE
- **AND** buscar metadados do documento
- **AND** buscar conteúdo do documento (PDF base64)
- **AND** fazer upload para Google Drive via webhook
- **AND** atualizar banco de dados com informações do arquivo
- **AND** retornar `{ success: true, arquivoNome, urlVisualizacao, urlDownload }`

#### Scenario: Documento não encontrado no PJE
- **WHEN** documentoId não existe ou não está acessível
- **THEN** o sistema deve retornar erro 404
- **AND** incluir mensagem descritiva do erro

#### Scenario: Erro de autenticação PJE
- **WHEN** credenciais são inválidas ou sessão expira
- **THEN** o sistema deve retornar erro 401
- **AND** incluir mensagem "Erro de autenticação no PJE"

#### Scenario: Erro de upload Google Drive
- **WHEN** webhook Google Drive falha ou timeout
- **THEN** o sistema deve retornar erro 500
- **AND** incluir mensagem "Erro ao fazer upload do documento"
- **AND** não atualizar banco de dados

#### Scenario: Documento já existe
- **WHEN** pendência já possui `arquivo_nome` preenchido
- **THEN** o sistema deve permitir re-captura (sobrescrever)
- **AND** fazer novo upload com timestamp no nome do arquivo
- **AND** atualizar URLs no banco

### Requirement: Captura Automática de Documentos no Scraper
O sistema MUST permitir captura automática de documentos durante scraping de pendentes de manifestação.

#### Scenario: Scraper com capturarDocumentos=true
- **WHEN** scraper é executado com parâmetro `capturarDocumentos: true`
- **THEN** o sistema deve capturar documento de cada pendente após salvá-lo
- **AND** fazer upload para Google Drive
- **AND** atualizar banco com informações do arquivo

#### Scenario: Scraper com capturarDocumentos=false
- **WHEN** scraper é executado com `capturarDocumentos: false` ou parâmetro omitido
- **THEN** o sistema deve capturar apenas dados do pendente
- **AND** não buscar documentos

#### Scenario: Erro na captura de documento não bloqueia scraper
- **WHEN** captura de documento de um pendente falha
- **THEN** o sistema deve logar o erro
- **AND** continuar processamento dos próximos pendentes
- **AND** não falhar a captura inteira

#### Scenario: Scraper registra estatísticas de documentos
- **WHEN** scraper finaliza execução com `capturarDocumentos: true`
- **THEN** o sistema deve incluir estatísticas de documentos no resultado
- **AND** informar quantos documentos foram capturados com sucesso
- **AND** informar quantos falharam

### Requirement: Validação de Documento PDF
O sistema MUST validar que o documento obtido do PJE é um PDF válido antes de fazer upload.

#### Scenario: Documento é PDF válido
- **WHEN** metadados do documento indicam `mimetype: "application/pdf"`
- **THEN** o sistema deve prosseguir com o upload
- **AND** armazenar informações no banco

#### Scenario: Documento não é PDF
- **WHEN** mimetype é diferente de "application/pdf"
- **THEN** o sistema deve retornar erro 400
- **AND** incluir mensagem "Documento não é um PDF válido"
- **AND** não fazer upload

#### Scenario: Documento base64 inválido
- **WHEN** conteúdo base64 não pode ser decodificado
- **THEN** o sistema deve retornar erro 500
- **AND** incluir mensagem "Erro ao processar conteúdo do documento"

### Requirement: Padrão de Nomenclatura de Arquivos
O sistema MUST seguir padrão específico para nomear arquivos no storage.

#### Scenario: Geração de nome de arquivo
- **WHEN** documento é capturado
- **THEN** o sistema deve gerar path no formato: `pendentes/{trt}{grau}/{pendenteId}_{timestamp}.pdf`
- **AND** exemplo: `pendentes/trt3g1/12345_1705856400000.pdf`

#### Scenario: Arquivo com mesmo pendenteId
- **WHEN** documento de mesmo pendente é re-capturado
- **THEN** timestamp garante nome único
- **AND** versão anterior permanece no Google Drive (histórico)

### Requirement: Autenticação Obrigatória para Endpoint
O endpoint de captura de documento MUST exigir autenticação válida via Supabase Auth.

#### Scenario: Requisição sem autenticação
- **WHEN** requisição é feita sem token válido
- **THEN** o sistema deve retornar erro 401 Unauthorized
- **AND** não processar a requisição

#### Scenario: Requisição com autenticação válida
- **WHEN** requisição inclui token válido de usuário autenticado
- **THEN** o sistema deve processar normalmente
- **AND** registrar usuário que solicitou a captura no log de auditoria

### Requirement: Filtro por Disponibilidade de Documento
O sistema MUST permitir filtrar pendências por disponibilidade de documento.

#### Scenario: Filtro por pendências com documento
- **WHEN** parâmetro `com_documento=true` é fornecido
- **THEN** o sistema deve retornar apenas pendências com `arquivo_nome` não-NULL

#### Scenario: Filtro por pendências sem documento
- **WHEN** parâmetro `sem_documento=true` é fornecido
- **THEN** o sistema deve retornar apenas pendências com `arquivo_nome` NULL

#### Scenario: Sem filtro de documento
- **WHEN** nenhum parâmetro de filtro de documento é fornecido
- **THEN** o sistema deve retornar todas as pendências independente de terem documento
