# Capability: Gestão de Pendências de Manifestação

## Purpose
API REST para gerenciamento de pendências de manifestação (expedientes) capturadas do PJE-TRT. Permite listagem com filtros, atribuição de responsáveis, baixa de expedientes e controle de prazos. Essencial para gestão de obrigações processuais do escritório.

## Requirements

### Requirement: Listagem de Pendências
O sistema MUST fornecer endpoint para listar pendências com suporte a paginação, ordenação e filtros.

#### Scenario: GET /api/pendentes-manifestacao com paginação
- **WHEN** uma requisição GET é enviada com parâmetros page e limit
- **THEN** o sistema deve retornar página de pendências solicitada
- **AND** incluir total de registros e total de páginas
- **AND** limitar resultados ao valor de limit

#### Scenario: Ordenação por prazo
- **WHEN** parâmetros orderBy=data_limite e orderDirection são fornecidos
- **THEN** o sistema deve ordenar pendências pela data limite
- **AND** aplicar direção ascendente ou descendente

#### Scenario: Listagem padrão
- **WHEN** nenhum parâmetro é fornecido
- **THEN** o sistema deve retornar primeira página com 10 registros
- **AND** ordenar por data_limite ascendente (prazos mais urgentes primeiro)

### Requirement: Filtros por Status
O sistema MUST permitir filtragem por status de baixa da pendência.

#### Scenario: Filtro por pendências ativas
- **WHEN** parâmetro status=ativa é fornecido
- **THEN** o sistema deve retornar apenas pendências não baixadas
- **AND** excluir pendências com data_baixa preenchida

#### Scenario: Filtro por pendências baixadas
- **WHEN** parâmetro status=baixada é fornecido
- **THEN** o sistema deve retornar apenas pendências já baixadas
- **AND** incluir data_baixa, usuario_baixa e motivo_baixa

#### Scenario: Todas as pendências
- **WHEN** parâmetro status não é fornecido
- **THEN** o sistema deve retornar todas as pendências (ativas e baixadas)

### Requirement: Filtros por Prazo
O sistema MUST permitir filtragem por situação de prazo da pendência.

#### Scenario: Pendências vencidas
- **WHEN** parâmetro vencidas=true é fornecido
- **THEN** o sistema deve retornar apenas pendências com data_limite passada
- **AND** que ainda não foram baixadas

#### Scenario: Pendências urgentes
- **WHEN** parâmetro urgentes=true é fornecido
- **THEN** o sistema deve retornar pendências com prazo menor ou igual a 3 dias
- **AND** que ainda não foram baixadas

#### Scenario: Filtro por período de prazo
- **WHEN** data_limite_inicio e data_limite_fim são fornecidos
- **THEN** o sistema deve retornar pendências cujo prazo está no intervalo

### Requirement: Filtros por Tribunal e Grau
O sistema MUST permitir filtragem por tribunal (TRT) e grau processual.

#### Scenario: Filtro por tribunal
- **WHEN** parâmetro trt é fornecido
- **THEN** o sistema deve retornar apenas pendências de processos do tribunal especificado

#### Scenario: Filtro por grau
- **WHEN** parâmetro grau é fornecido
- **THEN** o sistema deve retornar apenas pendências de processos do grau especificado

### Requirement: Filtro por Responsável
O sistema MUST permitir filtrar pendências por responsável atribuído.

#### Scenario: Filtro por responsável específico
- **WHEN** parâmetro responsavel_id é fornecido
- **THEN** o sistema deve retornar apenas pendências atribuídas ao usuário

#### Scenario: Pendências sem responsável
- **WHEN** parâmetro sem_responsavel=true é fornecido
- **THEN** o sistema deve retornar apenas pendências sem responsável atribuído

### Requirement: Busca Textual
O sistema MUST permitir busca textual em campos relevantes das pendências.

#### Scenario: Busca por número do processo
- **WHEN** parâmetro search contém número de processo
- **THEN** o sistema deve retornar pendências de processos cujo número corresponde

#### Scenario: Busca por tipo de expediente
- **WHEN** parâmetro search contém tipo de expediente
- **THEN** o sistema deve buscar no campo tipo

#### Scenario: Busca em múltiplos campos
- **WHEN** parâmetro search é fornecido
- **THEN** o sistema deve buscar em: numero_processo, tipo, descricao
- **AND** aplicar lógica OR entre os campos

### Requirement: Atribuição de Responsável
O sistema MUST permitir atribuir ou alterar o responsável de uma pendência.

#### Scenario: PUT /api/pendentes-manifestacao/[id]/responsavel
- **WHEN** uma requisição PUT é enviada com responsavel_id válido
- **THEN** o sistema deve atualizar o campo responsavel_id
- **AND** registrar timestamp da atribuição
- **AND** registrar quem fez a atribuição no log de auditoria

#### Scenario: Atribuição em pendência já baixada
- **WHEN** tentativa de atribuir responsável a pendência baixada
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "Não é possível atribuir responsável a pendência já baixada"

### Requirement: Baixa de Expediente
O sistema MUST permitir registrar a baixa de uma pendência de manifestação.

#### Scenario: POST /api/pendentes-manifestacao/[id]/baixa
- **WHEN** uma requisição POST é enviada com motivo_baixa
- **THEN** o sistema deve atualizar data_baixa com timestamp atual
- **AND** registrar usuario_baixa com ID do usuário autenticado
- **AND** registrar motivo_baixa fornecido
- **AND** marcar pendência como inativa

#### Scenario: Baixa com observações
- **WHEN** campo observacoes é fornecido na baixa
- **THEN** sistema deve salvar observações junto com a baixa
- **AND** tornar observações visíveis no histórico

#### Scenario: Baixa de pendência já baixada
- **WHEN** tentativa de baixar pendência já baixada
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "Pendência já foi baixada anteriormente"

#### Scenario: Baixa sem motivo
- **WHEN** campo motivo_baixa não é fornecido
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** exigir preenchimento do motivo

### Requirement: Reversão de Baixa
O sistema MUST permitir reverter a baixa de uma pendência.

#### Scenario: POST /api/pendentes-manifestacao/[id]/reverter-baixa
- **WHEN** uma requisição POST é enviada para pendência baixada
- **THEN** o sistema deve limpar data_baixa, usuario_baixa e motivo_baixa
- **AND** reativar a pendência
- **AND** registrar a reversão no log de auditoria

#### Scenario: Reversão de pendência ativa
- **WHEN** tentativa de reverter baixa de pendência não baixada
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "Pendência não está baixada"

#### Scenario: Registro de histórico de reversão
- **WHEN** baixa é revertida
- **THEN** sistema deve manter histórico da baixa original
- **AND** registrar quem reverteu e quando
- **AND** permitir auditoria completa

### Requirement: Cálculo de Prazo Restante
O sistema MUST calcular automaticamente dias restantes até o prazo limite.

#### Scenario: Prazo futuro
- **WHEN** data_limite é posterior à data atual
- **THEN** sistema deve calcular dias corridos até o prazo
- **AND** incluir campo prazo_dias na resposta

#### Scenario: Prazo vencido
- **WHEN** data_limite é anterior à data atual
- **THEN** campo prazo_dias deve ser negativo
- **AND** indicar quantidade de dias de atraso

#### Scenario: Prazo hoje
- **WHEN** data_limite é hoje
- **THEN** campo prazo_dias deve ser 0
- **AND** marcar como urgente

### Requirement: Vinculação com Processos
O sistema MUST vincular pendências aos processos do acervo correspondentes.

#### Scenario: Pendência com processo existente
- **WHEN** pendência é capturada e processo existe no acervo
- **THEN** sistema deve vincular via acervo_id

#### Scenario: Dados do processo na listagem
- **WHEN** pendências são listadas
- **THEN** sistema deve incluir dados do processo vinculado
- **AND** incluir: numero_processo, classe_judicial, status, trt

### Requirement: Log de Auditoria
O sistema MUST registrar todas as operações em log de auditoria.

#### Scenario: Log de baixa
- **WHEN** pendência é baixada
- **THEN** sistema deve criar registro no log_baixa_expedientes
- **AND** incluir: pendente_id, usuario_id, motivo, data_baixa

#### Scenario: Log de atribuição
- **WHEN** responsável é atribuído
- **THEN** sistema deve registrar no log de auditoria
- **AND** incluir: quem atribuiu, para quem, quando

#### Scenario: Consulta de histórico
- **WHEN** histórico de pendência é solicitado
- **THEN** sistema deve retornar todas as alterações
- **AND** ordenar cronologicamente

### Requirement: Autenticação Obrigatória
Todos os endpoints MUST exigir autenticação válida via Supabase Auth.

#### Scenario: Requisição sem autenticação
- **WHEN** uma requisição é feita sem token
- **THEN** o sistema deve retornar erro 401 Unauthorized

### Requirement: Resposta Padronizada
Todos os endpoints MUST retornar respostas no formato JSON padronizado.

#### Scenario: Lista de pendências
- **WHEN** GET /api/pendentes-manifestacao retorna com sucesso
- **THEN** resposta deve conter: { success: true, data: [...], total, totalPages, currentPage }

#### Scenario: Operação de baixa
- **WHEN** POST /api/pendentes-manifestacao/[id]/baixa é bem-sucedida
- **THEN** resposta deve conter: { success: true, data: { pendência atualizada } }

### Requirement: Sincronização com Captura PJE
O sistema MUST manter sincronização com pendências capturadas do PJE-TRT.

#### Scenario: Nova pendência capturada
- **WHEN** captura identifica nova pendência
- **THEN** pendência deve ser inserida automaticamente
- **AND** ficar disponível para listagem

#### Scenario: Atualização de prazo
- **WHEN** prazo de pendência é alterado no PJE
- **THEN** sistema deve atualizar data_limite
- **AND** preservar dados de baixa se já baixada

#### Scenario: Pendência cumprida no PJE
- **WHEN** pendência é marcada como cumprida no PJE
- **THEN** sistema pode sugerir baixa automática
- **OR** marcar como verificação necessária
