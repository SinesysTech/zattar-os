# Spec: Captura Automática de Timeline

**Capability**: `captura-timeline-automatica`
**Related Specs**: `verificacao-timeline-existente`, `captura-trt`, `pagina-visualizacao-processo`
**Status**: Proposal

## Overview

Quando a verificação detecta que a timeline não existe, o sistema deve iniciar automaticamente a captura via PJE, incluindo download de documentos, upload para Google Drive, persistência no MongoDB e atualização da referência no PostgreSQL.

## ADDED Requirements

### Requirement: Iniciar Captura Automaticamente
O sistema SHALL iniciar a captura de timeline automaticamente sem intervenção do usuário quando a verificação detectar que a timeline não existe.

#### Scenario: Captura iniciada após verificação negativa
**Given** verificação retorna `timeline: null` e processo tem dados necessários (trt, grau, id_pje, advogado_id)
**When** hook detecta ausência de timeline
**Then** o sistema deve acionar POST /api/captura/trt/timeline automaticamente, setar `isCapturing: true`, exibir loading state e NÃO bloquear interface

#### Scenario: Dados insuficientes para captura
**Given** verificação retorna `timeline: null` e processo não tem `advogado_id` preenchido
**When** sistema tenta iniciar captura
**Then** o sistema deve exibir erro "Não é possível capturar timeline: advogado não configurado" e NÃO iniciar captura

#### Scenario: Captura já em andamento
**Given** captura foi iniciada com `isCapturing: true`
**When** componente re-renderiza ou usuário recarrega página
**Then** o sistema deve detectar captura em andamento, continuar polling sem iniciar nova captura e exibir "Captura em andamento..."

---

### Requirement: Chamada ao Endpoint de Captura
O sistema SHALL chamar o endpoint de captura existente (POST /api/captura/trt/timeline) com parâmetros corretos.

#### Scenario: Chamada bem-sucedida ao endpoint
**Given** dados do processo válidos
**When** captura é iniciada
**Then** o sistema deve fazer POST com payload contendo trtCodigo, grau, processoId, advogadoId e filtroDocumentos configurados corretamente

#### Scenario: Captura completa com sucesso
**Given** endpoint retorna status 200
**When** captura é concluída
**Then** a resposta deve incluir timeline, totais (itens, documentos, movimentos), documentosBaixados, totais de sucesso/erros e mongoId

#### Scenario: Erro de autenticação PJE
**Given** credenciais do advogado inválidas ou expiradas
**When** endpoint tenta autenticar no PJE
**Then** hook deve capturar erro e exibir "Erro de autenticação no PJE. Verifique as credenciais do advogado" com botão "Tentar Novamente"

#### Scenario: Timeout na captura
**Given** captura demora mais de 5 minutos
**When** timeout é atingido
**Then** o sistema deve exibir mensagem apropriada e permitir polling manual ou retry

---

### Requirement: Polling de Status Durante Captura
O sistema SHALL verificar periodicamente se a timeline foi salva no MongoDB durante a captura.

#### Scenario: Polling após iniciar captura
**Given** captura foi iniciada com sucesso
**When** `isCapturing: true`
**Then** o sistema deve aguardar 10 segundos inicial, iniciar polling GET /api/acervo/[id]/timeline a cada 5 segundos até `timeline !== null` ou erro, com máximo 60 tentativas (5 minutos total)

#### Scenario: Timeline aparece durante polling
**Given** polling está ativo e MongoDB recebeu timeline salva
**When** próximo poll retorna `timeline !== null`
**Then** o sistema deve parar polling, setar `isCapturing: false`, setar `timeline` com dados recebidos e exibir timeline na UI

#### Scenario: Timeout do polling
**Given** polling está ativo há 5 minutos e timeline ainda não apareceu
**When** máximo de tentativas é atingido
**Then** o sistema deve parar polling, setar erro "Timeout na captura" e oferecer botão "Recarregar Página"

---

### Requirement: Estados de Loading Durante Captura
O sistema SHALL fornecer feedback visual claro durante todas as etapas da captura.

#### Scenario: Loading states granulares
**Given** captura está em andamento
**Then** o sistema deve exibir mensagens contextuais baseadas no tempo decorrido:
- 0-10s: "Iniciando captura da timeline..."
- 10-60s: "Capturando movimentos e documentos do PJE... (isso pode levar alguns minutos)"
- 60-120s: "Baixando documentos e enviando para Google Drive..."
- 120s+: "Processando documentos... Quase pronto!"

#### Scenario: Loading não bloqueia UI
**Given** captura está em andamento
**When** usuário interage com a página
**Then** o sistema deve permitir scroll, permitir navegação para outras páginas, manter captura em background e ao retornar verificar status via polling

---

### Requirement: Tratamento de Erros na Captura
O sistema SHALL tratar todos os erros durante captura e comunicá-los claramente ao usuário.

#### Scenario: Erro de autenticação PJE (401)
**Given** credenciais inválidas
**When** erro 401 é retornado
**Then** exibir título "Erro de Autenticação", mensagem explicativa sobre credenciais e botão "Tentar Novamente"

#### Scenario: Erro de rede (500, timeout)
**Given** erro de servidor ou rede
**When** requisição falha
**Then** exibir título "Erro na Captura", mensagem genérica, detalhes técnicos colapsíveis e botão "Tentar Novamente"

#### Scenario: Processo não encontrado no PJE (404)
**Given** processo não existe mais no PJE
**When** captura retorna 404
**Then** exibir título "Processo Não Encontrado", mensagem explicativa e botão "Voltar para Listagem"

#### Scenario: Captcha ou 2FA requerido
**Given** PJE solicita captcha ou 2FA e sistema não consegue resolver
**When** erro específico é retornado
**Then** exibir título "Autenticação Adicional Necessária" e orientação para contatar administrador

---

### Requirement: Integração com Google Drive
O sistema SHALL enviar documentos capturados para Google Drive durante a captura e salvar links na timeline.

#### Scenario: Upload bem-sucedido de documentos
**Given** documentos foram baixados do PJE
**When** upload para Google Drive é executado via n8n webhook
**Then** cada documento deve ser convertido para Base64, enviado com metadata, receber links de retorno e ter links salvos no campo `googleDrive` do item timeline

#### Scenario: Falha no upload de documento
**Given** webhook Google Drive está indisponível ou documento muito grande
**When** upload falha
**Then** o sistema deve continuar processamento dos demais, salvar item sem `googleDrive`, logar erro, incrementar contador `totalErros` e exibir aviso

#### Scenario: Timeline sem documentos (apenas movimentos)
**Given** processo tem apenas movimentos processuais e nenhum documento
**When** captura é concluída
**Then** o sistema deve salvar timeline normalmente com `totalDocumentos: 0` e exibir timeline sem erro

---

### Requirement: Persistência no MongoDB
O sistema SHALL persistir dados capturados no MongoDB com estrutura correta.

#### Scenario: Salvar timeline no MongoDB
**Given** captura foi concluída com sucesso
**When** serviço de persistência é chamado
**Then** deve criar documento MongoDB com estrutura completa incluindo processoId, trtCodigo, grau, capturadoEm, timeline array enriquecida e metadata

#### Scenario: Atualizar referência no PostgreSQL
**Given** timeline foi salva no MongoDB com `_id`
**When** persistência é concluída
**Then** o sistema deve executar UPDATE na tabela `acervo` setando `timeline_mongodb_id = <mongoId>` WHERE `id_pje = <processoId>` e confirmar atualização

#### Scenario: Upsert (substituir timeline existente)
**Given** timeline já existe para o processo (captura duplicada)
**When** nova captura é salva
**Then** o sistema deve usar upsert com filter `{ processoId, trtCodigo, grau }`, substituir timeline antiga e manter mesmo `_id` do MongoDB

---

### Requirement: Configurações de Captura
O sistema SHALL usar configurações sensatas para captura com possibilidade de customização futura.

#### Scenario: Filtros padrão de documentos
**Given** captura é iniciada sem filtros customizados
**Then** deve usar `baixarDocumentos: true`, `apenasAssinados: true`, `apenasNaoSigilosos: true` e sem filtros de tipos ou datas

#### Scenario: Documentos sigilosos são excluídos
**Given** processo tem documentos sigilosos e `apenasNaoSigilosos: true`
**When** captura é executada
**Then** documentos sigilosos devem ser incluídos na timeline como items, NÃO ter PDF baixado, NÃO ter campo `googleDrive` e exibir badge "Sigiloso" na UI

---

## MODIFIED Requirements

Nenhum requirement modificado nesta spec.

---

## REMOVED Requirements

Nenhum requirement removido nesta spec.
