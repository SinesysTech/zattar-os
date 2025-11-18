# Spec: Agendamentos de Captura

## Overview
Sistema para agendar execuções automáticas de capturas de dados do PJE-TRT em horários e periodicidades definidas pelo usuário.

## Requirements

### Requirement: CRUD de Agendamentos
O sistema MUST fornecer operações completas de CRUD para agendamentos de captura.

#### Scenario: Criar agendamento
- **WHEN** um usuário cria um novo agendamento
- **THEN** o sistema deve validar os dados fornecidos
- **AND** calcular a próxima execução baseado em periodicidade e horário
- **AND** salvar o agendamento no banco de dados
- **AND** retornar o agendamento criado com ID

#### Scenario: Listar agendamentos
- **WHEN** um usuário lista agendamentos
- **THEN** o sistema deve retornar lista de agendamentos
- **AND** permitir filtros por advogado, tipo de captura, status (ativo/inativo)
- **AND** incluir informações de última execução e próxima execução
- **AND** ordenar por próxima execução (mais próximos primeiro)

#### Scenario: Atualizar agendamento
- **WHEN** um usuário atualiza um agendamento existente
- **THEN** o sistema deve validar os novos dados
- **AND** recalcular próxima execução se periodicidade ou horário mudaram
- **AND** atualizar o registro no banco de dados
- **AND** retornar o agendamento atualizado

#### Scenario: Deletar agendamento
- **WHEN** um usuário deleta um agendamento
- **THEN** o sistema deve remover o registro do banco de dados
- **AND** não executar mais capturas para este agendamento

### Requirement: Tipos de Periodicidade
O sistema MUST suportar diferentes tipos de periodicidade para agendamentos.

#### Scenario: Periodicidade diária
- **WHEN** um agendamento é criado com periodicidade "diario"
- **THEN** o sistema deve calcular próxima execução como próximo dia no horário especificado
- **AND** após cada execução, recalcular para o próximo dia

#### Scenario: Periodicidade a cada N dias
- **WHEN** um agendamento é criado com periodicidade "a_cada_2_dias" ou "a_cada_3_dias"
- **THEN** o sistema deve calcular próxima execução adicionando N dias ao horário atual
- **AND** após cada execução, recalcular adicionando N dias novamente

#### Scenario: Periodicidade semanal
- **WHEN** um agendamento é criado com periodicidade "semanal"
- **THEN** o sistema deve calcular próxima execução adicionando 7 dias ao horário atual
- **AND** após cada execução, recalcular adicionando 7 dias novamente

#### Scenario: Periodicidade mensal
- **WHEN** um agendamento é criado com periodicidade "mensal"
- **THEN** o sistema deve calcular próxima execução adicionando 1 mês ao horário atual
- **AND** após cada execução, recalcular adicionando 1 mês novamente

### Requirement: Execução Automática de Agendamentos
O sistema MUST executar agendamentos automaticamente quando a próxima execução chegar.

#### Scenario: Scheduler identifica agendamento pronto
- **WHEN** o scheduler verifica agendamentos ativos
- **THEN** deve buscar agendamentos onde `ativo = true` e `proxima_execucao <= now()`
- **AND** executar captura para cada agendamento encontrado

#### Scenario: Executar captura agendada
- **WHEN** um agendamento é executado automaticamente
- **THEN** o sistema deve executar a captura usando os serviços existentes
- **AND** usar os parâmetros salvos no agendamento (tipo, advogado, credenciais, extras)
- **AND** registrar a execução no histórico de capturas (`capturas_log`)
- **AND** atualizar `ultima_execucao = now()`
- **AND** recalcular `proxima_execucao` baseado na periodicidade
- **AND** atualizar o registro do agendamento

#### Scenario: Tratamento de erro na execução
- **WHEN** uma execução automática falha
- **THEN** o sistema deve registrar o erro no histórico de capturas
- **AND** não atualizar `proxima_execucao` (retentar no próximo ciclo)
- **AND** manter o agendamento ativo para retentativa

### Requirement: Execução Manual de Agendamento
O sistema MUST permitir execução manual de agendamentos.

#### Scenario: Executar agendamento manualmente
- **WHEN** um usuário executa um agendamento manualmente
- **THEN** o sistema deve executar a captura imediatamente
- **AND** registrar no histórico de capturas
- **AND** atualizar `ultima_execucao`
- **AND** não alterar `proxima_execucao` (mantém agendamento original)

### Requirement: Parâmetros Extras por Tipo de Captura
O sistema MUST armazenar parâmetros específicos para cada tipo de captura.

#### Scenario: Parâmetros para audiências
- **WHEN** um agendamento de tipo "audiencias" é criado
- **THEN** o sistema deve permitir especificar `dataInicio` e `dataFim`
- **AND** armazenar esses parâmetros em `parametros_extras`
- **AND** usar esses parâmetros na execução

#### Scenario: Parâmetros para pendentes
- **WHEN** um agendamento de tipo "pendentes" é criado
- **THEN** o sistema deve permitir especificar `filtroPrazo`
- **AND** armazenar esse parâmetro em `parametros_extras`
- **AND** usar esse parâmetro na execução

### Requirement: Interface Frontend para Agendamentos
O sistema MUST fornecer interface web para gerenciar agendamentos.

#### Scenario: Visualizar agendamentos
- **WHEN** um usuário acessa a aba "Agendamentos"
- **THEN** o sistema deve exibir lista de agendamentos
- **AND** mostrar informações: tipo, advogado, credenciais, periodicidade, horário, status
- **AND** mostrar última execução e próxima execução
- **AND** permitir filtrar e ordenar

#### Scenario: Criar agendamento via interface
- **WHEN** um usuário cria um agendamento via interface
- **THEN** o sistema deve exibir formulário com campos:
  - Seleção de advogado (usando `CapturaFormBase`)
  - Seleção de credenciais (usando `CapturaFormBase`)
  - Tipo de captura
  - Periodicidade
  - Horário
  - Parâmetros extras (se aplicável)
- **AND** validar campos antes de submeter
- **AND** exibir confirmação após criação

#### Scenario: Gerenciar agendamento
- **WHEN** um usuário gerencia um agendamento
- **THEN** o sistema deve permitir:
  - Editar agendamento
  - Ativar/desativar agendamento
  - Deletar agendamento
  - Executar manualmente
  - Visualizar histórico de execuções

### Requirement: Integração com Histórico de Capturas
O sistema MUST registrar execuções automáticas no histórico existente.

#### Scenario: Registrar execução no histórico
- **WHEN** um agendamento é executado (automático ou manual)
- **THEN** o sistema deve criar registro em `capturas_log`
- **AND** incluir tipo de captura, advogado, credenciais utilizadas
- **AND** marcar como executado por agendamento (se necessário)
- **AND** incluir resultado ou erro da execução

