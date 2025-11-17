## 1. Preparação
- [x] 1.1 Analisar estrutura da tabela `audiencias` no banco de dados
- [x] 1.2 Verificar tipos de dados de audiências (interface `Audiencia` do PJE)
- [x] 1.3 Verificar estrutura do componente DataTable existente
- [x] 1.4 Verificar estrutura do hook `useAcervo` como referência

## 2. Backend - Tipos e Serviços
- [x] 2.1 Criar tipos TypeScript para listagem de audiências (`backend/types/audiencias/types.ts`)
- [x] 2.2 Criar serviço de persistência para listar audiências (`backend/audiencias/services/persistence/listar-audiencias.service.ts`)
- [x] 2.3 Criar serviço de negócio para listar audiências (`backend/audiencias/services/listar-audiencias.service.ts`)
- [x] 2.4 Implementar filtros: data, status, TRT, grau, responsável, processo, busca textual
- [x] 2.5 Implementar paginação e ordenação server-side

## 3. API Endpoint
- [x] 3.1 Criar rota GET `/api/audiencias/route.ts`
- [x] 3.2 Implementar validação de parâmetros de query
- [x] 3.3 Implementar tratamento de erros
- [x] 3.4 Adicionar documentação Swagger/OpenAPI

## 4. Frontend - Tipos e Hooks
- [x] 4.1 Criar tipos TypeScript para frontend (`lib/types/audiencias.ts`)
- [x] 4.2 Criar hook `useAudiencias` (`lib/hooks/use-audiencias.ts`)
- [x] 4.3 Implementar gerenciamento de estado de filtros e paginação

## 5. Componente de Filtros
- [x] 5.1 Criar componente `AudienciasFiltrosAvancados` (`components/audiencias-filtros-avancados.tsx`)
- [x] 5.2 Implementar filtros: data início/fim, status, TRT, grau, responsável, número do processo
- [x] 5.3 Implementar reset de filtros

## 6. Página de Audiências
- [x] 6.1 Criar página `app/(dashboard)/audiencias/page.tsx`
- [x] 6.2 Definir colunas da tabela de audiências:
  - Data e hora de início
  - Número do processo
  - Parte autora
  - Parte ré
  - Sala de audiência
  - Status
  - Tipo de audiência
  - Data e hora de fim
- [x] 6.3 Implementar formatação de dados (datas, status, etc.)
- [x] 6.4 Integrar componente DataTable com hook `useAudiencias`
- [x] 6.5 Adicionar busca textual
- [x] 6.6 Integrar filtros avançados

## 7. Testes e Ajustes
- [ ] 7.1 Testar paginação e ordenação - Pendente teste manual
- [ ] 7.2 Testar filtros e busca - Pendente teste manual
- [ ] 7.3 Verificar responsividade - Pendente teste manual
- [ ] 7.4 Validar acessibilidade - Pendente teste manual
- [ ] 7.5 Verificar tratamento de erros - Pendente teste manual

