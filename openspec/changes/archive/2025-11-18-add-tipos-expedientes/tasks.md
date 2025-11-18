## 1. Database - Migrations (usando MCP Supabase)
- [x] 1.1 Criar tabela `tipos_expedientes` com campos: `id`, `tipo_expediente` (unique), `created_by`, `created_at`, `updated_at`
- [x] 1.2 Habilitar RLS na tabela `tipos_expedientes` com políticas adequadas
- [x] 1.3 Criar índices necessários (unique em `tipo_expediente`, índice em `created_by`)
- [x] 1.4 Inserir 33 tipos de expedientes pré-definidos (usar migration com dados)
- [x] 1.5 Adicionar colunas `tipo_expediente_id` e `descricao_arquivos` em `pendentes_manifestacao` (nullable para não quebrar dados existentes)
- [x] 1.6 Criar foreign key constraint de `tipo_expediente_id` para `tipos_expedientes.id`
- [x] 1.7 Criar índice em `pendentes_manifestacao.tipo_expediente_id`
- [x] 1.8 Adicionar comentários nas novas colunas e tabela

## 2. Backend - Types TypeScript
- [x] 2.1 Criar `backend/types/tipos-expedientes/types.ts` com interfaces:
  - `TipoExpediente`
  - `CriarTipoExpedienteParams`
  - `AtualizarTipoExpedienteParams`
  - `ListarTiposExpedientesParams`
  - `ListarTiposExpedientesResult`

## 3. Backend - Persistence Layer
- [x] 3.1 Criar `backend/tipos-expedientes/services/persistence/tipo-expediente-persistence.service.ts`
- [x] 3.2 Implementar `criarTipoExpediente(params)` com validação de unicidade
- [x] 3.3 Implementar `buscarTipoExpediente(id)`
- [x] 3.4 Implementar `buscarTipoExpedientePorNome(nome)`
- [x] 3.5 Implementar `atualizarTipoExpediente(id, params)` com validação de unicidade
- [x] 3.6 Implementar `listarTiposExpedientes(params)` com paginação, busca e filtros
- [x] 3.7 Implementar `deletarTipoExpediente(id)` com verificação de uso em `pendentes_manifestacao`

## 4. Backend - Business Logic Layer
- [x] 4.1 Criar `backend/tipos-expedientes/services/tipos-expedientes/criar-tipo-expediente.service.ts`
- [x] 4.2 Criar `backend/tipos-expedientes/services/tipos-expedientes/buscar-tipo-expediente.service.ts`
- [x] 4.3 Criar `backend/tipos-expedientes/services/tipos-expedientes/listar-tipos-expedientes.service.ts`
- [x] 4.4 Criar `backend/tipos-expedientes/services/tipos-expedientes/atualizar-tipo-expediente.service.ts`
- [x] 4.5 Criar `backend/tipos-expedientes/services/tipos-expedientes/deletar-tipo-expediente.service.ts`

## 5. Backend - API Routes
- [x] 5.1 Criar `app/api/tipos-expedientes/route.ts` com GET (listar) e POST (criar)
- [x] 5.2 Criar `app/api/tipos-expedientes/[id]/route.ts` com GET, PATCH e DELETE
- [x] 5.3 Adicionar autenticação em todos os endpoints
- [x] 5.4 Implementar tratamento de erros adequado
- [x] 5.5 Adicionar documentação Swagger completa em todos os endpoints

## 6. Backend - Atualizar Tipos de Pendentes
- [x] 6.1 Atualizar `backend/types/pendentes/types.ts`:
  - Adicionar `tipo_expediente_id` e `descricao_arquivos` em `PendenteManifestacao`
  - Adicionar filtros relacionados em `ListarPendentesParams`
- [x] 6.2 Atualizar `backend/pendentes/services/persistence/listar-pendentes.service.ts` para incluir JOIN com `tipos_expedientes` quando necessário
- [x] 6.3 Atualizar função de conversão para incluir novos campos

## 7. Frontend - Hook para Tipos de Expedientes
- [x] 7.1 Criar `lib/hooks/use-tipos-expedientes.ts` seguindo padrão de `useUsuarios`
- [x] 7.2 Implementar cache e memoização adequados

## 8. Frontend - Atualizar Página de Expedientes
- [x] 8.1 Atualizar `app/(dashboard)/expedientes/page.tsx`:
  - Adicionar coluna composta "Tipo/Descrição" após "Partes" e antes de "Responsável"
  - Exibir tipo de expediente (nome) e descrição/arquivos na mesma célula
  - Buscar tipos de expedientes uma única vez (não por célula)
- [x] 8.2 Atualizar `components/expedientes-visualizacao-semana.tsx` com nova coluna
- [x] 8.3 Atualizar função `criarColunas` para incluir nova coluna composta

## 9. Documentação Swagger
- [x] 9.1 Documentar endpoint `GET /api/tipos-expedientes`
- [x] 9.2 Documentar endpoint `POST /api/tipos-expedientes`
- [x] 9.3 Documentar endpoint `GET /api/tipos-expedientes/[id]`
- [x] 9.4 Documentar endpoint `PATCH /api/tipos-expedientes/[id]`
- [x] 9.5 Documentar endpoint `DELETE /api/tipos-expedientes/[id]`
- [x] 9.6 Adicionar schemas: `TipoExpediente`, `CriarTipoExpedienteParams`, `AtualizarTipoExpedienteParams`

## 10. Validação e Testes
- [x] 10.1 Validar migrations não quebram dados existentes
- [x] 10.2 Testar CRUD completo de tipos de expedientes
- [x] 10.3 Testar filtros e busca na listagem
- [x] 10.4 Testar validação de unicidade do nome
- [x] 10.5 Testar bloqueio de deleção quando tipo está em uso
- [x] 10.6 Testar exibição da coluna composta no frontend
- [x] 10.7 Validar Swagger documentation

