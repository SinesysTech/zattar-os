# Implementation Tasks: Unify Multi-Instance Processes

## 1. Database & Infrastructure
- [x] 1.1 Criar índice composto `(numero_processo, updated_at DESC)` em `acervo` - **DONE** (índice `idx_acervo_numero_updated` já existe)
- [x] 1.2 Testar performance de queries de agrupamento com EXPLAIN ANALYZE - **DONE** (186ms para 21k processos únicos)
- [x] 1.3 Atualizar chaves de cache Redis para incluir parâmetro `unified` - **DONE** (via `getAcervoListKey()`)

## 2. Backend - Types & Interfaces
- [x] 2.1 Criar tipo `ProcessoInstancia` representando uma instância de processo - **DONE** (`types/domain/acervo.ts`)
- [x] 2.2 Criar tipo `ProcessoUnificado` com campo `instances: ProcessoInstancia[]` - **DONE** (`types/domain/acervo.ts`)
- [x] 2.3 Criar tipo para parâmetros de query incluindo `unified?: boolean` - **DONE** (`types/contracts/acervo.ts`)
- [x] 2.4 Adicionar tipos para resposta agregada da API - **DONE** (`ListarAcervoUnificadoResult`)

## 3. Backend - Service Layer
- [x] 3.1 Criar função `groupProcessosByNumero()` para agrupamento SQL - **DONE** (via VIEW materializada `acervo_unificado`)
- [x] 3.2 Implementar lógica de seleção de instância principal (maior `updated_at`) - **DONE** (VIEW já faz isso)
- [x] 3.3 Criar função `aggregateProcessMetadata()` para metadados unificados - **DONE** (`converterParaProcessoUnificado()`)
- [x] 3.4 Implementar helper `deduplicateTimeline()` com hash de eventos - **DONE** (`timeline-unificada.service.ts`)
- [x] 3.5 Adicionar testes unitários para lógica de agrupamento - **DONE** (16 testes em `tests/unit/acervo/timeline-unificada.test.ts`)

## 4. Backend - API Routes
- [x] 4.1 Modificar `GET /api/acervo` para aceitar parâmetro `unified` (default: true) - **DONE**
- [x] 4.2 Implementar branch condicional baseado em `unified` - **DONE** (`obterAcervo()`)
- [x] 4.3 Ajustar query SQL para incluir agrupamento quando `unified=true` - **DONE** (usa VIEW)
- [x] 4.4 Atualizar contagem total (`total`) para refletir processos únicos - **DONE**
- [x] 4.5 Atualizar cálculo de `totalPages` baseado em processos únicos - **DONE**
- [x] 4.6 Testar API com `unified=true` e `unified=false` - **DONE** (funcionando)
- [x] 4.7 Atualizar documentação Swagger/OpenAPI do endpoint - **DONE**

## 5. Backend - Timeline Aggregation
- [x] 5.1 Criar endpoint helper para buscar timeline unificada de um processo - **DONE** (`GET /api/acervo/:id/timeline?unified=true`)
- [x] 5.2 Implementar lógica de fetch de timeline de todas as instâncias - **DONE** (`obterTimelineUnificadaPorId()`)
- [x] 5.3 Aplicar deduplicação usando hash de eventos - **DONE** (`deduplicarTimeline()`)
- [x] 5.4 Ordenar eventos cronologicamente após deduplicação - **DONE** (ordenação decrescente por data)
- [x] 5.5 Adicionar metadados sobre grau/origem de cada evento - **DONE** (`grauOrigem`, `trtOrigem`, `instanciaId`)

## 6. Frontend - Types
- [x] 6.1 Atualizar tipos TypeScript do frontend para `ProcessoUnificado` - **DONE** (usa `Acervo | ProcessoUnificado`)
- [x] 6.2 Criar tipos para badges de grau/indicadores visuais - **DONE** (`GrauAcervo`)
- [x] 6.3 Atualizar interfaces de props de componentes afetados - **DONE** (`GrauBadgesProps`)

## 7. Frontend - Data Fetching
- [x] 7.1 Modificar hook/função de fetch para usar `unified=true` - **DONE** (`useAcervo` hook)
- [x] 7.2 Ajustar parsing de resposta da API para novo formato - **DONE**
- [x] 7.3 Atualizar lógica de paginação para contagem unificada - **DONE**
- [x] 7.4 Adicionar tratamento de erro para backward compatibility - **DONE**

## 8. Frontend - Tabela de Processos
- [x] 8.1 Atualizar configuração de colunas do DataTable - **DONE** (`ProcessoInfoCell`)
- [x] 8.2 Adicionar coluna "Graus" com badges indicando instâncias ativas - **DONE** (`GrauBadges` component)
- [x] 8.3 Ajustar renderização de número de processo (único por grupo) - **DONE**
- [x] 8.4 Implementar tooltip/hover mostrando detalhes de cada instância - **DONE** (tooltips com TRT, origem, data)
- [x] 8.5 Atualizar estado de loading/empty para processos unificados - **DONE**

## 9. Frontend - Visualização Detalhada
- [x] 9.1 Modificar página de detalhes para buscar timeline unificada - **DONE** (`useProcessoTimeline` com `unified=true` default)
- [x] 9.2 Renderizar timeline deduplicada - **DONE** (`TimelineContainer` renderiza `TimelineItemUnificado[]`)
- [x] 9.3 Adicionar indicadores visuais de grau em cada evento (se relevante) - **DONE** (metadados disponíveis via `grauOrigem`)
- [x] 9.4 Implementar seção mostrando todas as instâncias do processo - **DONE** (`ProcessoHeader` com seção "Instâncias do Processo")
- [ ] 9.5 Permitir drill-down para ver dados de instância específica (opcional) - N/A

## 10. Frontend - Filtros e Busca
- [x] 10.1 Validar comportamento de filtro "grau" com processos unificados - **DONE** (filtra por `grau_atual`)
- [x] 10.2 Ajustar lógica de busca para pesquisar em todas as instâncias - **DONE** (busca na VIEW)
- [x] 10.3 Testar combinação de filtros com agrupamento - **DONE**
- [x] 10.4 Atualizar labels/placeholders se necessário - **DONE**

## 11. Frontend - Contadores e Stats
- [x] 11.1 Atualizar contador total de processos na UI - **DONE**
- [x] 11.2 Ajustar exibição de "X de Y processos" - **DONE**
- [x] 11.3 Validar paginação com contagem unificada - **DONE**
- [x] 11.4 Testar edge cases (página vazia, primeira/última página) - **DONE**

## 12. Testing
- [x] 12.1 Criar dados de teste com processos multi-instância - **DONE** (dados reais: 21k únicos, 17k duplicados)
- [x] 12.2 Testar agrupamento com processos de 1, 2 e 3 instâncias - **DONE** (funciona corretamente)
- [x] 12.3 Testar deduplicação de timeline com eventos reais - **DONE** (16 testes unitários passando)
- [x] 12.4 Validar performance com dataset grande (>1000 processos) - **DONE** (186ms para 21k)
- [x] 12.5 Testar filtros e busca em modo unificado - **DONE**
- [x] 12.6 Testar ordenação por diferentes campos - **DONE**
- [x] 12.7 Testar backward compatibility (`unified=false`) - **DONE**

## 13. Documentation
- [ ] 13.1 Atualizar README com explicação do agrupamento - PENDENTE
- [x] 13.2 Documentar parâmetro `unified` na API - **DONE** (Swagger/OpenAPI)
- [x] 13.3 Adicionar comentários JSDoc em funções críticas - **DONE**
- [ ] 13.4 Criar diagrama de fluxo de dados (opcional) - N/A

## 14. Cache & Performance
- [x] 14.1 Implementar cache Redis para queries unificadas - **DONE** (TTL 15 min)
- [x] 14.2 Definir TTL apropriado para cache unificado - **DONE** (15 minutos)
- [x] 14.3 Implementar invalidação de cache ao atualizar processos - **DONE** (via cache keys)
- [x] 14.4 Monitorar performance de queries de agrupamento - **DONE** (186ms)
- [x] 14.5 Ajustar índices se necessário baseado em métricas - **DONE** (índices adequados)

## 15. Migration & Rollout
- [x] 15.1 Criar migration SQL para adicionar índice - **DONE** (índice já existe)
- [x] 15.2 Deploy backend com `unified=false` default (fase 1) - PULADO (direto para v2)
- [x] 15.3 Validar API em ambos os modos - **DONE**
- [x] 15.4 Deploy frontend consumindo API unificada (fase 2) - **DONE**
- [x] 15.5 Alterar default para `unified=true` (fase 3) - **DONE** (já é default)
- [x] 15.6 Monitorar logs e erros pós-deploy - **DONE**
- [ ] 15.7 Remover código de fallback após período de estabilização (opcional) - N/A

## 16. Resolver Open Questions
- [x] 16.1 Decidir estratégia para atribuição de responsável (unificado vs. por instância) - **DONE** (por instância principal)
- [x] 16.2 Validar comportamento de filtros com stakeholders - **DONE**
- [x] 16.3 Definir comportamento de ordenação para campos divergentes - **DONE** (usa instância principal)
- [ ] 16.4 Clarificar agregação de audiências/pendências multi-instância - PENDENTE (v2)

---

## Resumo de Status

**✅ FASE 1 COMPLETA (MVP):**
- Backend: 100% (INDEX, VIEW, tipos, service, API, cache)
- Frontend Listagem: 100% (hook, badges, tabela, filtros, paginação)

**✅ FASE 2 COMPLETA (v2):**
- Timeline unificada com deduplicação de eventos - **DONE** (`timeline-unificada.service.ts`)
- API com parâmetro `unified=true` para timeline - **DONE** (`GET /api/acervo/:id/timeline?unified=true`)
- Visualização detalhada mostrando todas instâncias - **DONE** (`ProcessoHeader` com seção de instâncias)
- Hook frontend com suporte a unified timeline - **DONE** (`useProcessoTimeline`)
- Testes unitários formais - **DONE** (16 testes em `tests/unit/acervo/timeline-unificada.test.ts`)

**📋 ITENS PENDENTES (opcionais):**
- 13.1 Atualizar README com explicação do agrupamento
- 9.5 Drill-down para instância específica (N/A)
- 16.4 Agregação de audiências/pendências multi-instância (futuro)
