# Implementation Tasks

## 1. Migrations e Schema

- [ ] 1.1 Criar migration `create_cargos.sql`
  - [ ] 1.1.1 Criar tabela `cargos`
  - [ ] 1.1.2 Adicionar comentários nas colunas
  - [ ] 1.1.3 Criar índices de performance
  - [ ] 1.1.4 Criar trigger `update_updated_at`
  - [ ] 1.1.5 Habilitar RLS
  - [ ] 1.1.6 Criar políticas RLS (SELECT, INSERT, UPDATE, DELETE)

- [ ] 1.2 Criar migration `create_permissoes.sql`
  - [ ] 1.2.1 Criar tabela `permissoes`
  - [ ] 1.2.2 Adicionar comentários nas colunas
  - [ ] 1.2.3 Criar índices de performance (usuario_id, recurso, operacao)
  - [ ] 1.2.4 Criar índice composto (usuario_id, recurso, operacao) para queries rápidas
  - [ ] 1.2.5 Criar trigger `update_updated_at`
  - [ ] 1.2.6 Habilitar RLS
  - [ ] 1.2.7 Criar políticas RLS (SELECT, INSERT, UPDATE, DELETE)

- [ ] 1.3 Criar migration `alter_usuarios_add_permissions_fields.sql`
  - [ ] 1.3.1 Adicionar coluna `cargo_id` (FK para `cargos.id`, nullable)
  - [ ] 1.3.2 Adicionar coluna `is_super_admin` (boolean, default false)
  - [ ] 1.3.3 Criar índice em `cargo_id`
  - [ ] 1.3.4 Criar índice em `is_super_admin`
  - [ ] 1.3.5 Adicionar constraint ON DELETE SET NULL para `cargo_id`

## 2. Types e Interfaces

- [ ] 2.1 Criar `backend/types/cargos/types.ts`
  - [ ] 2.1.1 Interface `Cargo`
  - [ ] 2.1.2 Interface `CriarCargoDTO`
  - [ ] 2.1.3 Interface `AtualizarCargoDTO`
  - [ ] 2.1.4 Interface `ListarCargosParams`
  - [ ] 2.1.5 Interface `ListarCargosResponse`
  - [ ] 2.1.6 Type guards e validações

- [ ] 2.2 Criar `backend/types/permissoes/types.ts`
  - [ ] 2.2.1 Enum `Recurso` com todos os 13 domínios
  - [ ] 2.2.2 Enum `Operacao` com todas as operações possíveis
  - [ ] 2.2.3 Interface `Permissao`
  - [ ] 2.2.4 Interface `RecursoOperacoes` (matriz de recursos e operações)
  - [ ] 2.2.5 Interface `AtribuirPermissoesDTO`
  - [ ] 2.2.6 Interface `PermissoesUsuarioResponse`
  - [ ] 2.2.7 Constante `MATRIZ_PERMISSOES` com mapeamento completo

- [ ] 2.3 Atualizar `backend/types/usuarios/types.ts`
  - [ ] 2.3.1 Adicionar campo `cargo_id?: number` em `Usuario`
  - [ ] 2.3.2 Adicionar campo `is_super_admin?: boolean` em `Usuario`
  - [ ] 2.3.3 Adicionar campo `cargo?: Cargo` (relação populada)
  - [ ] 2.3.4 Atualizar `CriarUsuarioDTO`
  - [ ] 2.3.5 Atualizar `AtualizarUsuarioDTO`

## 3. Backend Services - Cargos

- [ ] 3.1 Criar `backend/cargos/services/persistence/cargo-persistence.service.ts`
  - [ ] 3.1.1 `listarCargos(params)` - Query com filtros, paginação, busca
  - [ ] 3.1.2 `buscarCargoPorId(id)` - Buscar cargo por ID
  - [ ] 3.1.3 `buscarCargoPorNome(nome)` - Buscar cargo por nome (único)
  - [ ] 3.1.4 `criarCargo(data)` - Inserir novo cargo
  - [ ] 3.1.5 `atualizarCargo(id, data)` - Atualizar cargo
  - [ ] 3.1.6 `deletarCargo(id)` - Deletar cargo
  - [ ] 3.1.7 `contarUsuariosComCargo(cargoId)` - Contar usuários associados
  - [ ] 3.1.8 `listarUsuariosComCargo(cargoId)` - Listar usuários associados

- [ ] 3.2 Criar `backend/cargos/services/cargos/listar-cargos.service.ts`
  - [ ] 3.2.1 Validar parâmetros de entrada
  - [ ] 3.2.2 Chamar persistence layer
  - [ ] 3.2.3 Formatar resposta com paginação

- [ ] 3.3 Criar `backend/cargos/services/cargos/buscar-cargo.service.ts`
  - [ ] 3.3.1 Validar ID
  - [ ] 3.3.2 Buscar cargo
  - [ ] 3.3.3 Tratar erro 404

- [ ] 3.4 Criar `backend/cargos/services/cargos/criar-cargo.service.ts`
  - [ ] 3.4.1 Validar dados de entrada (nome obrigatório)
  - [ ] 3.4.2 Verificar se nome já existe (único)
  - [ ] 3.4.3 Criar cargo
  - [ ] 3.4.4 Retornar cargo criado

- [ ] 3.5 Criar `backend/cargos/services/cargos/atualizar-cargo.service.ts`
  - [ ] 3.5.1 Validar dados de entrada
  - [ ] 3.5.2 Verificar se cargo existe
  - [ ] 3.5.3 Se alterando nome, verificar unicidade
  - [ ] 3.5.4 Atualizar cargo
  - [ ] 3.5.5 Retornar cargo atualizado

- [ ] 3.6 Criar `backend/cargos/services/cargos/deletar-cargo.service.ts`
  - [ ] 3.6.1 Validar ID
  - [ ] 3.6.2 Verificar se cargo existe
  - [ ] 3.6.3 Contar usuários associados ao cargo
  - [ ] 3.6.4 Se houver usuários, retornar erro 400 com lista de usuários
  - [ ] 3.6.5 Se não houver usuários, deletar cargo
  - [ ] 3.6.6 Retornar sucesso

- [ ] 3.7 Criar `backend/cargos/services/cargos/listar-usuarios-cargo.service.ts`
  - [ ] 3.7.1 Validar cargo ID
  - [ ] 3.7.2 Verificar se cargo existe
  - [ ] 3.7.3 Buscar usuários com esse cargo
  - [ ] 3.7.4 Retornar lista de usuários

## 4. Backend Services - Permissões

- [ ] 4.1 Criar `backend/permissoes/services/persistence/permissao-persistence.service.ts`
  - [ ] 4.1.1 `listarPermissoesUsuario(usuarioId)` - Listar todas as permissões de um usuário
  - [ ] 4.1.2 `verificarPermissao(usuarioId, recurso, operacao)` - Verificar se usuário tem permissão específica
  - [ ] 4.1.3 `atribuirPermissao(usuarioId, recurso, operacao)` - Adicionar permissão
  - [ ] 4.1.4 `atribuirPermissoesBatch(usuarioId, permissoes[])` - Adicionar múltiplas permissões
  - [ ] 4.1.5 `revogarPermissao(usuarioId, recurso, operacao)` - Remover permissão específica
  - [ ] 4.1.6 `revogarTodasPermissoes(usuarioId)` - Remover todas as permissões do usuário
  - [ ] 4.1.7 `substituirPermissoes(usuarioId, permissoes[])` - Deletar todas e adicionar novas (transação)

- [ ] 4.2 Criar `backend/permissoes/services/permissoes/listar-recursos.service.ts`
  - [ ] 4.2.1 Retornar constante `MATRIZ_PERMISSOES` com todos os recursos e operações
  - [ ] 4.2.2 Formatar como array estruturado para frontend

- [ ] 4.3 Criar `backend/permissoes/services/permissoes/listar-permissoes-usuario.service.ts`
  - [ ] 4.3.1 Validar usuário ID
  - [ ] 4.3.2 Verificar se usuário existe
  - [ ] 4.3.3 Verificar se usuário é super admin
  - [ ] 4.3.4 Se super admin, retornar todas as permissões (matriz completa)
  - [ ] 4.3.5 Se não, buscar permissões da tabela
  - [ ] 4.3.6 Retornar lista estruturada

- [ ] 4.4 Criar `backend/permissoes/services/permissoes/atribuir-permissoes.service.ts`
  - [ ] 4.4.1 Validar usuário ID e lista de permissões
  - [ ] 4.4.2 Verificar se usuário existe
  - [ ] 4.4.3 Validar que recursos e operações existem na matriz
  - [ ] 4.4.4 Inserir permissões em batch (upsert)
  - [ ] 4.4.5 Registrar em log de auditoria
  - [ ] 4.4.6 Retornar permissões atualizadas

- [ ] 4.5 Criar `backend/permissoes/services/permissoes/atualizar-permissoes.service.ts`
  - [ ] 4.5.1 Validar usuário ID e nova lista de permissões
  - [ ] 4.5.2 Verificar se usuário existe
  - [ ] 4.5.3 Iniciar transação
  - [ ] 4.5.4 Deletar todas as permissões existentes do usuário
  - [ ] 4.5.5 Inserir novas permissões
  - [ ] 4.5.6 Commit transação
  - [ ] 4.5.7 Registrar em log de auditoria
  - [ ] 4.5.8 Retornar permissões atualizadas

- [ ] 4.6 Criar `backend/permissoes/services/permissoes/revogar-permissao.service.ts`
  - [ ] 4.6.1 Validar parâmetros
  - [ ] 4.6.2 Verificar se permissão existe
  - [ ] 4.6.3 Deletar permissão
  - [ ] 4.6.4 Registrar em log de auditoria
  - [ ] 4.6.5 Retornar sucesso

## 5. Backend Services - Middleware de Autorização

- [ ] 5.1 Criar `backend/utils/auth/authorization.ts`
  - [ ] 5.1.1 Função `checkPermission(usuarioId, recurso, operacao)` - Verificar se usuário tem permissão
  - [ ] 5.1.2 Lógica: Se `is_super_admin = true`, retornar `true`
  - [ ] 5.1.3 Lógica: Caso contrário, consultar tabela `permissoes`
  - [ ] 5.1.4 Retornar boolean
  - [ ] 5.1.5 Adicionar cache in-memory (considerar TTL de 5 minutos)

- [ ] 5.2 Criar `backend/utils/auth/require-permission.ts`
  - [ ] 5.2.1 Wrapper middleware para Next.js API routes
  - [ ] 5.2.2 Extrair usuário autenticado
  - [ ] 5.2.3 Chamar `checkPermission`
  - [ ] 5.2.4 Se não tem permissão, retornar 403 Forbidden
  - [ ] 5.2.5 Se tem permissão, continuar para o handler

## 6. API Routes - Cargos

- [ ] 6.1 Criar `app/api/cargos/route.ts`
  - [ ] 6.1.1 `GET` - Listar cargos com paginação, busca, filtros
  - [ ] 6.1.2 `POST` - Criar novo cargo
  - [ ] 6.1.3 Adicionar autenticação
  - [ ] 6.1.4 Adicionar autorização (futura)
  - [ ] 6.1.5 Tratamento de erros
  - [ ] 6.1.6 Documentação Swagger

- [ ] 6.2 Criar `app/api/cargos/[id]/route.ts`
  - [ ] 6.2.1 `GET` - Buscar cargo por ID
  - [ ] 6.2.2 `PUT` - Atualizar cargo
  - [ ] 6.2.3 `DELETE` - Deletar cargo (com validação de associações)
  - [ ] 6.2.4 Adicionar autenticação
  - [ ] 6.2.5 Adicionar autorização (futura)
  - [ ] 6.2.6 Tratamento de erros
  - [ ] 6.2.7 Documentação Swagger

- [ ] 6.3 Criar `app/api/cargos/[id]/usuarios/route.ts`
  - [ ] 6.3.1 `GET` - Listar usuários de um cargo
  - [ ] 6.3.2 Adicionar autenticação
  - [ ] 6.3.3 Adicionar autorização (futura)
  - [ ] 6.3.4 Tratamento de erros
  - [ ] 6.3.5 Documentação Swagger

## 7. API Routes - Permissões

- [ ] 7.1 Criar `app/api/permissoes/recursos/route.ts`
  - [ ] 7.1.1 `GET` - Listar todos os recursos e operações disponíveis (matriz completa)
  - [ ] 7.1.2 Adicionar autenticação
  - [ ] 7.1.3 Adicionar autorização (futura)
  - [ ] 7.1.4 Tratamento de erros
  - [ ] 7.1.5 Documentação Swagger

- [ ] 7.2 Criar `app/api/permissoes/usuarios/[id]/route.ts`
  - [ ] 7.2.1 `GET` - Listar permissões de um usuário
  - [ ] 7.2.2 `POST` - Atribuir múltiplas permissões (batch)
  - [ ] 7.2.3 `PUT` - Substituir todas as permissões (atualização completa)
  - [ ] 7.2.4 Adicionar autenticação
  - [ ] 7.2.5 Adicionar autorização (futura)
  - [ ] 7.2.6 Tratamento de erros
  - [ ] 7.2.7 Documentação Swagger

- [ ] 7.3 Criar `app/api/permissoes/usuarios/[id]/[recurso]/[operacao]/route.ts`
  - [ ] 7.3.1 `DELETE` - Revogar permissão específica
  - [ ] 7.3.2 Adicionar autenticação
  - [ ] 7.3.3 Adicionar autorização (futura)
  - [ ] 7.3.4 Tratamento de erros
  - [ ] 7.3.5 Documentação Swagger

## 8. Atualizar Serviços Existentes - Usuários

- [ ] 8.1 Atualizar `backend/usuarios/services/usuarios/criar-usuario-completo.service.ts`
  - [ ] 8.1.1 Adicionar suporte para `cargo_id` opcional
  - [ ] 8.1.2 Adicionar suporte para `is_super_admin` opcional (default false)
  - [ ] 8.1.3 Validar se `cargo_id` existe na tabela `cargos`

- [ ] 8.2 Atualizar `backend/usuarios/services/usuarios/listar-usuarios.service.ts`
  - [ ] 8.2.1 Incluir campo `cargo_id` na resposta
  - [ ] 8.2.2 Incluir campo `is_super_admin` na resposta
  - [ ] 8.2.3 Adicionar opção de popular relação `cargo` (JOIN)
  - [ ] 8.2.4 Adicionar filtro por `cargo_id`
  - [ ] 8.2.5 Adicionar filtro por `is_super_admin`

- [ ] 8.3 Atualizar `backend/usuarios/services/usuarios/buscar-usuario.service.ts`
  - [ ] 8.3.1 Incluir campos `cargo_id` e `is_super_admin` na resposta
  - [ ] 8.3.2 Popular relação `cargo` automaticamente

- [ ] 8.4 Atualizar `backend/usuarios/services/persistence/usuario-persistence.service.ts`
  - [ ] 8.4.1 Adicionar suporte para campos `cargo_id` e `is_super_admin` em todas as queries
  - [ ] 8.4.2 Adicionar método `atualizarCargo(usuarioId, cargoId)`

## 9. Testes

- [ ] 9.1 Criar testes para serviços de cargos
  - [ ] 9.1.1 Testar criação de cargo
  - [ ] 9.1.2 Testar listagem de cargos
  - [ ] 9.1.3 Testar atualização de cargo
  - [ ] 9.1.4 Testar deleção de cargo sem usuários associados
  - [ ] 9.1.5 Testar deleção de cargo com usuários associados (deve falhar)
  - [ ] 9.1.6 Testar edição de nome do cargo

- [ ] 9.2 Criar testes para serviços de permissões
  - [ ] 9.2.1 Testar atribuição de permissões
  - [ ] 9.2.2 Testar revogação de permissões
  - [ ] 9.2.3 Testar verificação de permissões
  - [ ] 9.2.4 Testar super admin (bypass)
  - [ ] 9.2.5 Testar atualização completa de permissões

- [ ] 9.3 Criar testes para middleware de autorização
  - [ ] 9.3.1 Testar `checkPermission` com super admin
  - [ ] 9.3.2 Testar `checkPermission` com usuário normal com permissão
  - [ ] 9.3.3 Testar `checkPermission` com usuário normal sem permissão
  - [ ] 9.3.4 Testar cache de permissões

## 10. Documentação

- [ ] 10.1 Documentar API de cargos no Swagger
  - [ ] 10.1.1 Schemas e modelos
  - [ ] 10.1.2 Endpoints e parâmetros
  - [ ] 10.1.3 Exemplos de requisição/resposta

- [ ] 10.2 Documentar API de permissões no Swagger
  - [ ] 10.2.1 Schemas e modelos
  - [ ] 10.2.2 Endpoints e parâmetros
  - [ ] 10.2.3 Exemplos de requisição/resposta
  - [ ] 10.2.4 Documentar matriz de permissões completa

- [ ] 10.3 Atualizar README.md com informações sobre permissões e cargos
  - [ ] 10.3.1 Seção sobre sistema de permissões
  - [ ] 10.3.2 Seção sobre sistema de cargos
  - [ ] 10.3.3 Como configurar super admin
  - [ ] 10.3.4 Como gerenciar permissões

## 11. Validação e Deploy

- [ ] 11.1 Executar migrations em ambiente de desenvolvimento
  - [ ] 11.1.1 Verificar criação das tabelas
  - [ ] 11.1.2 Verificar índices
  - [ ] 11.1.3 Verificar RLS e políticas

- [ ] 11.2 Testar rotas API manualmente
  - [ ] 11.2.1 Testar CRUD de cargos
  - [ ] 11.2.2 Testar gerenciamento de permissões
  - [ ] 11.2.3 Testar middleware de autorização

- [ ] 11.3 Validar OpenSpec
  - [ ] 11.3.1 Executar `openspec validate add-permissions-and-cargos-system --strict`
  - [ ] 11.3.2 Corrigir erros de validação

- [ ] 11.4 Preparar deploy para produção
  - [ ] 11.4.1 Criar script de migração seguro
  - [ ] 11.4.2 Criar rollback plan
  - [ ] 11.4.3 Documentar passos de deploy
