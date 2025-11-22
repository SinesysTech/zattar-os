# Implementation Tasks: Unify Multi-Instance Processes

## 1. Database & Infrastructure
- [ ] 1.1 Criar índice composto `(numero_processo, updated_at DESC)` em `acervo_geral`
- [ ] 1.2 Testar performance de queries de agrupamento com EXPLAIN ANALYZE
- [ ] 1.3 Atualizar chaves de cache Redis para incluir parâmetro `unified`

## 2. Backend - Types & Interfaces
- [ ] 2.1 Criar tipo `ProcessoInstancia` representando uma instância de processo
- [ ] 2.2 Criar tipo `ProcessoUnificado` com campo `instances: ProcessoInstancia[]`
- [ ] 2.3 Criar tipo para parâmetros de query incluindo `unified?: boolean`
- [ ] 2.4 Adicionar tipos para resposta agregada da API

## 3. Backend - Service Layer
- [ ] 3.1 Criar função `groupProcessosByNumero()` para agrupamento SQL
- [ ] 3.2 Implementar lógica de seleção de instância principal (maior `updated_at`)
- [ ] 3.3 Criar função `aggregateProcessMetadata()` para metadados unificados
- [ ] 3.4 Implementar helper `deduplicateTimeline()` com hash de eventos
- [ ] 3.5 Adicionar testes unitários para lógica de agrupamento

## 4. Backend - API Routes
- [ ] 4.1 Modificar `GET /api/acervo` para aceitar parâmetro `unified` (default: true)
- [ ] 4.2 Implementar branch condicional baseado em `unified`
- [ ] 4.3 Ajustar query SQL para incluir agrupamento quando `unified=true`
- [ ] 4.4 Atualizar contagem total (`total`) para refletir processos únicos
- [ ] 4.5 Atualizar cálculo de `totalPages` baseado em processos únicos
- [ ] 4.6 Testar API com `unified=true` e `unified=false`
- [ ] 4.7 Atualizar documentação Swagger/OpenAPI do endpoint

## 5. Backend - Timeline Aggregation
- [ ] 5.1 Criar endpoint helper para buscar timeline unificada de um processo
- [ ] 5.2 Implementar lógica de fetch de timeline de todas as instâncias
- [ ] 5.3 Aplicar deduplicação usando hash de eventos
- [ ] 5.4 Ordenar eventos cronologicamente após deduplicação
- [ ] 5.5 Adicionar metadados sobre grau/origem de cada evento

## 6. Frontend - Types
- [ ] 6.1 Atualizar tipos TypeScript do frontend para `ProcessoUnificado`
- [ ] 6.2 Criar tipos para badges de grau/indicadores visuais
- [ ] 6.3 Atualizar interfaces de props de componentes afetados

## 7. Frontend - Data Fetching
- [ ] 7.1 Modificar hook/função de fetch para usar `unified=true`
- [ ] 7.2 Ajustar parsing de resposta da API para novo formato
- [ ] 7.3 Atualizar lógica de paginação para contagem unificada
- [ ] 7.4 Adicionar tratamento de erro para backward compatibility

## 8. Frontend - Tabela de Processos
- [ ] 8.1 Atualizar configuração de colunas do DataTable
- [ ] 8.2 Adicionar coluna "Graus" com badges indicando instâncias ativas
- [ ] 8.3 Ajustar renderização de número de processo (único por grupo)
- [ ] 8.4 Implementar tooltip/hover mostrando detalhes de cada instância
- [ ] 8.5 Atualizar estado de loading/empty para processos unificados

## 9. Frontend - Visualização Detalhada
- [ ] 9.1 Modificar página de detalhes para buscar timeline unificada
- [ ] 9.2 Renderizar timeline deduplicada
- [ ] 9.3 Adicionar indicadores visuais de grau em cada evento (se relevante)
- [ ] 9.4 Implementar seção mostrando todas as instâncias do processo
- [ ] 9.5 Permitir drill-down para ver dados de instância específica (opcional)

## 10. Frontend - Filtros e Busca
- [ ] 10.1 Validar comportamento de filtro "grau" com processos unificados
- [ ] 10.2 Ajustar lógica de busca para pesquisar em todas as instâncias
- [ ] 10.3 Testar combinação de filtros com agrupamento
- [ ] 10.4 Atualizar labels/placeholders se necessário

## 11. Frontend - Contadores e Stats
- [ ] 11.1 Atualizar contador total de processos na UI
- [ ] 11.2 Ajustar exibição de "X de Y processos"
- [ ] 11.3 Validar paginação com contagem unificada
- [ ] 11.4 Testar edge cases (página vazia, primeira/última página)

## 12. Testing
- [ ] 12.1 Criar dados de teste com processos multi-instância
- [ ] 12.2 Testar agrupamento com processos de 1, 2 e 3 instâncias
- [ ] 12.3 Testar deduplicação de timeline com eventos reais
- [ ] 12.4 Validar performance com dataset grande (>1000 processos)
- [ ] 12.5 Testar filtros e busca em modo unificado
- [ ] 12.6 Testar ordenação por diferentes campos
- [ ] 12.7 Testar backward compatibility (`unified=false`)

## 13. Documentation
- [ ] 13.1 Atualizar README com explicação do agrupamento
- [ ] 13.2 Documentar parâmetro `unified` na API
- [ ] 13.3 Adicionar comentários JSDoc em funções críticas
- [ ] 13.4 Criar diagrama de fluxo de dados (opcional)

## 14. Cache & Performance
- [ ] 14.1 Implementar cache Redis para queries unificadas
- [ ] 14.2 Definir TTL apropriado para cache unificado
- [ ] 14.3 Implementar invalidação de cache ao atualizar processos
- [ ] 14.4 Monitorar performance de queries de agrupamento
- [ ] 14.5 Ajustar índices se necessário baseado em métricas

## 15. Migration & Rollout
- [ ] 15.1 Criar migration SQL para adicionar índice
- [ ] 15.2 Deploy backend com `unified=false` default (fase 1)
- [ ] 15.3 Validar API em ambos os modos
- [ ] 15.4 Deploy frontend consumindo API unificada (fase 2)
- [ ] 15.5 Alterar default para `unified=true` (fase 3)
- [ ] 15.6 Monitorar logs e erros pós-deploy
- [ ] 15.7 Remover código de fallback após período de estabilização (opcional)

## 16. Resolver Open Questions
- [ ] 16.1 Decidir estratégia para atribuição de responsável (unificado vs. por instância)
- [ ] 16.2 Validar comportamento de filtros com stakeholders
- [ ] 16.3 Definir comportamento de ordenação para campos divergentes
- [ ] 16.4 Clarificar agregação de audiências/pendências multi-instância
