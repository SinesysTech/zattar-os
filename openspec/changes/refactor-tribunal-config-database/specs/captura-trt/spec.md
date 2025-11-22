## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

Nenhum requirement foi removido. As funcionalidades existentes são mantidas, apenas a fonte de dados muda de hardcoded para banco de dados.
