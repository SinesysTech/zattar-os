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
O sistema MUST suportar captura de dados de múltiplos Tribunais Regionais do Trabalho (TRT1 a TRT24).

#### Scenario: Captura em tribunal específico
- **WHEN** uma captura é solicitada para um TRT específico
- **THEN** o sistema deve acessar a URL correspondente ao TRT
- **AND** aplicar configurações específicas do tribunal
- **AND** capturar dados usando a estrutura HTML específica

#### Scenario: Adaptação a diferenças entre tribunais
- **WHEN** tribunais possuem estruturas HTML diferentes
- **THEN** o sistema deve adaptar os seletores conforme necessário
- **AND** garantir captura consistente

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
O sistema MUST fornecer endpoints REST para iniciar capturas de dados do PJE-TRT.

#### Scenario: Endpoint POST /api/captura/trt/acervo-geral
- **WHEN** uma requisição POST é enviada com credenciais válidas
- **THEN** o sistema deve iniciar captura de acervo geral
- **AND** retornar status da operação
- **AND** incluir quantidade de processos capturados

#### Scenario: Endpoint POST /api/captura/trt/arquivados
- **WHEN** uma requisição POST é enviada
- **THEN** o sistema deve iniciar captura de processos arquivados
- **AND** retornar resultado da operação

#### Scenario: Endpoint POST /api/captura/trt/audiencias
- **WHEN** uma requisição POST é enviada
- **THEN** o sistema deve iniciar captura de audiências
- **AND** retornar lista de audiências capturadas

#### Scenario: Endpoint POST /api/captura/trt/pendentes-manifestacao
- **WHEN** uma requisição POST é enviada
- **THEN** o sistema deve iniciar captura de pendências
- **AND** retornar lista de pendências capturadas

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
