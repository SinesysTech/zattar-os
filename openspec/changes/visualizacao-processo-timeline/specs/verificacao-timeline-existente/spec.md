# Spec: Verificação de Timeline Existente

**Capability**: `verificacao-timeline-existente`
**Related Specs**: `captura-timeline-automatica`, `frontend-processos`
**Status**: Proposal

## Overview

Antes de iniciar uma captura custosa de timeline do PJE, o sistema deve verificar se a timeline já foi capturada anteriormente e está armazenada no MongoDB. Esta verificação ocorre automaticamente ao visualizar um processo.

## ADDED Requirements

### REQ-VTE-001: Verificar Existência de Timeline
**Priority**: High
**Type**: Functional

Quando um usuário solicita visualização de um processo, o sistema deve verificar se a timeline já existe no MongoDB antes de iniciar qualquer captura.

#### Scenario: Timeline já existe no MongoDB
**Given** um processo com `timeline_mongodb_id` preenchido no PostgreSQL
**When** o usuário acessa a página de visualização do processo
**Then** o sistema deve:
- Buscar timeline diretamente do MongoDB usando `timeline_mongodb_id`
- Retornar timeline completa com todos os itens enriquecidos
- NÃO acionar captura no PJE
- Exibir timeline em < 2 segundos

#### Scenario: Timeline não existe ainda
**Given** um processo com `timeline_mongodb_id` NULL no PostgreSQL
**When** o usuário acessa a página de visualização do processo
**Then** o sistema deve:
- Retornar indicação de que timeline não existe (null)
- Preparar dados necessários para captura (trt, grau, id_pje, advogado_id)
- Sinalizar ao frontend necessidade de captura

#### Scenario: Referência inválida no MongoDB
**Given** um processo com `timeline_mongodb_id` preenchido
**And** o documento não existe mais no MongoDB (deletado manualmente ou erro)
**When** o sistema busca a timeline
**Then** o sistema deve:
- Detectar que documento não foi encontrado
- Limpar `timeline_mongodb_id` no PostgreSQL (set NULL)
- Retornar indicação de timeline não existente
- Permitir re-captura

---

### REQ-VTE-002: Endpoint de Consulta de Timeline
**Priority**: High
**Type**: API

Deve existir um endpoint dedicado para consulta de timeline que retorne tanto os dados do processo quanto a timeline (se existir).

#### Scenario: Consulta bem-sucedida com timeline existente
**Given** processo com ID válido e timeline capturada
**When** GET /api/acervo/{acervoId}/timeline é chamado
**Then** a resposta deve ser:
```json
{
  "success": true,
  "data": {
    "acervo": {
      "id": 123,
      "id_pje": "2887163",
      "trt": "TRT3",
      "grau": "primeiro_grau",
      "timeline_mongodb_id": "507f1f77bcf86cd799439011",
      "numero_processo": "0001234-56.2024.5.03.0001",
      "nome_parte_autora": "João Silva",
      "nome_parte_re": "Empresa XYZ",
      ...
    },
    "timeline": {
      "_id": "507f1f77bcf86cd799439011",
      "processoId": "2887163",
      "trtCodigo": "TRT3",
      "grau": "primeiro_grau",
      "capturadoEm": "2025-01-20T10:30:00Z",
      "timeline": [...],
      "metadata": {
        "totalDocumentos": 15,
        "totalMovimentos": 8,
        "totalDocumentosBaixados": 12
      }
    }
  }
}
```

#### Scenario: Consulta bem-sucedida sem timeline
**Given** processo com ID válido mas timeline não capturada
**When** GET /api/acervo/{acervoId}/timeline é chamado
**Then** a resposta deve ser:
```json
{
  "success": true,
  "data": {
    "acervo": { ... },
    "timeline": null
  }
}
```

#### Scenario: Processo não encontrado
**Given** ID de processo inexistente
**When** GET /api/acervo/{acervoId}/timeline é chamado
**Then** a resposta deve ser:
- Status 404
- Mensagem de erro clara: "Processo não encontrado"

---

### REQ-VTE-003: Hook React de Verificação
**Priority**: High
**Type**: Frontend

Deve existir um hook customizado que encapsule a lógica de verificação e forneça interface consistente para componentes.

#### Scenario: Hook inicializa verificação automaticamente
**Given** hook `useProcessoTimeline(acervoId)` é invocado
**When** componente é montado
**Then** o hook deve:
- Iniciar com `isLoading: true`
- Buscar dados do processo via GET /api/acervo/[id]
- Buscar timeline via GET /api/acervo/[id]/timeline
- Atualizar estados conforme resposta
- Setar `isLoading: false` ao finalizar

#### Scenario: Hook detecta timeline ausente
**Given** hook recebe resposta com `timeline: null`
**When** verificação é concluída
**Then** o hook deve:
- Setar `timeline: null`
- Setar flag `needsCapture: true` (interno)
- Expor função `captureTimeline()` para iniciar captura
- NÃO iniciar captura automaticamente ainda (será em captura-timeline-automatica)

#### Scenario: Hook trata erro de rede
**Given** requisição falha por timeout ou erro de rede
**When** verificação é executada
**Then** o hook deve:
- Capturar erro
- Setar `error` com mensagem amigável
- Setar `isLoading: false`
- Permitir retry via `refetch()`

---

### REQ-VTE-004: Performance da Verificação
**Priority**: Medium
**Type**: Non-Functional

A verificação deve ser rápida e não bloquear a interface.

#### Scenario: Verificação rápida para timeline existente
**Given** timeline já está no MongoDB
**And** conexão de rede estável
**When** verificação é executada
**Then** o resultado deve retornar em < 1 segundo

#### Scenario: Timeout apropriado
**Given** MongoDB ou PostgreSQL estão lentos/indisponíveis
**When** verificação demora mais de 10 segundos
**Then** o sistema deve:
- Cancelar requisição
- Retornar erro de timeout
- Sugerir tentar novamente

---

### REQ-VTE-005: Dados Retornados
**Priority**: High
**Type**: Functional

A verificação deve retornar todos os dados necessários para renderização completa da página.

#### Scenario: Dados completos do processo
**Given** verificação bem-sucedida
**Then** os dados do processo devem incluir:
- Dados básicos: id, id_pje, numero_processo, trt, grau
- Partes: nome_parte_autora, qtde_parte_autora, nome_parte_re, qtde_parte_re
- Datas: data_autuacao, data_proxima_audiencia, data_arquivamento
- Metadados: classe_judicial, orgao_julgador, status, responsavel_id
- Referência: timeline_mongodb_id (se houver)

#### Scenario: Dados completos da timeline
**Given** timeline existe no MongoDB
**Then** a timeline deve incluir:
- Array de items ordenados por data (desc)
- Cada item com campos obrigatórios: id, titulo, data, documento (boolean)
- Documentos enriquecidos com googleDrive (se disponível)
- Metadata: totalDocumentos, totalMovimentos, capturadoEm

---

## MODIFIED Requirements

Nenhum requirement modificado nesta spec.

---

## REMOVED Requirements

Nenhum requirement removido nesta spec.

---

## Implementation Notes

### Ordem de Execução
1. Criar tipos TypeScript para timeline (lib/types/timeline.ts)
2. Implementar função de busca no hook
3. Implementar tratamento de erros
4. Adicionar estados de loading

### Referências de Código
- Endpoint existente: `app/api/acervo/[id]/timeline/route.ts` (já implementado)
- Serviço de persistência: `backend/captura/services/timeline/timeline-persistence.service.ts`
- Hook inspirado em: `lib/hooks/use-acervo.ts`

### Considerações de Segurança
- Endpoint deve validar autenticação do usuário
- RLS do Supabase deve garantir acesso apenas a processos autorizados
- MongoDB queries devem usar índices apropriados

### Testes Necessários
- [ ] Verificação com timeline existente retorna dados corretos
- [ ] Verificação sem timeline retorna null
- [ ] Referência inválida é tratada corretamente
- [ ] Erro de rede é capturado e exposto
- [ ] Timeout funciona após 10 segundos
- [ ] Performance: verificação < 1s (timeline existente)
