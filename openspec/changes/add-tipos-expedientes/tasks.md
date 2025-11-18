## 1. Database - Migrations (usando MCP Supabase)
- [ ] 1.1 Criar tabela `tipos_expedientes` com campos: `id`, `tipo_expediente` (unique), `created_by`, `created_at`, `updated_at`
- [ ] 1.2 Habilitar RLS na tabela `tipos_expedientes` com políticas adequadas
- [ ] 1.3 Criar índices necessários (unique em `tipo_expediente`, índice em `created_by`)
- [ ] 1.4 Inserir 33 tipos de expedientes pré-definidos (usar migration com dados)
- [ ] 1.5 Adicionar colunas `tipo_expediente_id` e `descricao_arquivos` em `pendentes_manifestacao` (nullable para não quebrar dados existentes)
- [ ] 1.6 Criar foreign key constraint de `tipo_expediente_id` para `tipos_expedientes.id`
- [ ] 1.7 Criar índice em `pendentes_manifestacao.tipo_expediente_id`
- [ ] 1.8 Adicionar comentários nas novas colunas e tabela

## 2. Backend - Types TypeScript
- [ ] 2.1 Criar `backend/types/tipos-expedientes/types.ts` com interfaces:
  - `TipoExpediente`
  - `CriarTipoExpedienteParams`
  - `AtualizarTipoExpedienteParams`
  - `ListarTiposExpedientesParams`
  - `ListarTiposExpedientesResult`

## 3. Backend - Persistence Layer
- [ ] 3.1 Criar `backend/tipos-expedientes/services/persistence/tipo-expediente-persistence.service.ts`
- [ ] 3.2 Implementar `criarTipoExpediente(params)` com validação de unicidade
- [ ] 3.3 Implementar `buscarTipoExpediente(id)`
- [ ] 3.4 Implementar `buscarTipoExpedientePorNome(nome)`
- [ ] 3.5 Implementar `atualizarTipoExpediente(id, params)` com validação de unicidade
- [ ] 3.6 Implementar `listarTiposExpedientes(params)` com paginação, busca e filtros
- [ ] 3.7 Implementar `deletarTipoExpediente(id)` com verificação de uso em `pendentes_manifestacao`

## 4. Backend - Business Logic Layer
- [ ] 4.1 Criar `backend/tipos-expedientes/services/tipos-expedientes/criar-tipo-expediente.service.ts`
- [ ] 4.2 Criar `backend/tipos-expedientes/services/tipos-expedientes/buscar-tipo-expediente.service.ts`
- [ ] 4.3 Criar `backend/tipos-expedientes/services/tipos-expedientes/listar-tipos-expedientes.service.ts`
- [ ] 4.4 Criar `backend/tipos-expedientes/services/tipos-expedientes/atualizar-tipo-expediente.service.ts`
- [ ] 4.5 Criar `backend/tipos-expedientes/services/tipos-expedientes/deletar-tipo-expediente.service.ts`

## 5. Backend - API Routes
- [ ] 5.1 Criar `app/api/tipos-expedientes/route.ts` com GET (listar) e POST (criar)
- [ ] 5.2 Criar `app/api/tipos-expedientes/[id]/route.ts` com GET, PATCH e DELETE
- [ ] 5.3 Adicionar autenticação em todos os endpoints
- [ ] 5.4 Implementar tratamento de erros adequado
- [ ] 5.5 Adicionar documentação Swagger completa em todos os endpoints

## 6. Backend - Atualizar Tipos de Pendentes
- [ ] 6.1 Atualizar `backend/types/pendentes/types.ts`:
  - Adicionar `tipo_expediente_id` e `descricao_arquivos` em `PendenteManifestacao`
  - Adicionar filtros relacionados em `ListarPendentesParams`
- [ ] 6.2 Atualizar `backend/pendentes/services/persistence/listar-pendentes.service.ts` para incluir JOIN com `tipos_expedientes` quando necessário
- [ ] 6.3 Atualizar função de conversão para incluir novos campos

## 7. Frontend - Hook para Tipos de Expedientes
- [ ] 7.1 Criar `lib/hooks/use-tipos-expedientes.ts` seguindo padrão de `useUsuarios`
- [ ] 7.2 Implementar cache e memoização adequados

## 8. Frontend - Atualizar Página de Expedientes
- [ ] 8.1 Atualizar `app/(dashboard)/expedientes/page.tsx`:
  - Adicionar coluna composta "Tipo/Descrição" após "Partes" e antes de "Responsável"
  - Exibir tipo de expediente (nome) e descrição/arquivos na mesma célula
  - Buscar tipos de expedientes uma única vez (não por célula)
- [ ] 8.2 Atualizar `components/expedientes-visualizacao-semana.tsx` com nova coluna
- [ ] 8.3 Atualizar função `criarColunas` para incluir nova coluna composta

## 9. Documentação Swagger
- [ ] 9.1 Documentar endpoint `GET /api/tipos-expedientes`
- [ ] 9.2 Documentar endpoint `POST /api/tipos-expedientes`
- [ ] 9.3 Documentar endpoint `GET /api/tipos-expedientes/[id]`
- [ ] 9.4 Documentar endpoint `PATCH /api/tipos-expedientes/[id]`
- [ ] 9.5 Documentar endpoint `DELETE /api/tipos-expedientes/[id]`
- [ ] 9.6 Adicionar schemas: `TipoExpediente`, `CriarTipoExpedienteParams`, `AtualizarTipoExpedienteParams`

## 10. Validação e Testes
- [ ] 10.1 Validar migrations não quebram dados existentes
- [ ] 10.2 Testar CRUD completo de tipos de expedientes
- [ ] 10.3 Testar filtros e busca na listagem
- [ ] 10.4 Testar validação de unicidade do nome
- [ ] 10.5 Testar bloqueio de deleção quando tipo está em uso
- [ ] 10.6 Testar exibição da coluna composta no frontend
- [ ] 10.7 Validar Swagger documentation

