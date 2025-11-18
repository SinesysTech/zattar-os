# Change: Adicionar Sistema de Permissões Granulares e Cargos

## Why

O sistema atual não possui controle de permissões para operações específicas. Todos os usuários autenticados têm acesso total a todas as funcionalidades, o que:
- **Limita o controle de acesso**: Não é possível restringir operações sensíveis (ex: deletar contratos, executar capturas)
- **Dificulta a gestão de equipes**: Não há diferenciação de responsabilidades entre usuários
- **Aumenta riscos de segurança**: Usuários podem executar ações que não deveriam ter permissão

Além disso, não existe um sistema de cargos para organizar e categorizar usuários internamente (ex: "Advogado Sênior", "Estagiário", "Secretário"). Cargos são importantes para controle organizacional, mas **não** devem estar vinculados a permissões.

## What Changes

### 1. Sistema de Cargos (Controle Organizacional)
- ✅ Nova tabela `cargos` com campos: `id`, `nome`, `descricao`, `ativo`, `created_by`, `created_at`, `updated_at`
- ✅ Adicionar campo `cargo_id` (FK nullable) na tabela `usuarios`
- ✅ Relacionamento: 1 usuário pode ter 1 cargo (ou nenhum)
- ✅ **Restrição**: Não é possível deletar um cargo se ele estiver associado a usuários (retorna erro com lista de usuários)
- ✅ Permitir editar nome do cargo sem restrições
- ✅ Criar serviços e rotas CRUD completos para cargos

### 2. Sistema de Permissões Granulares (Baseado em Usuário)
- ✅ Nova tabela `permissoes` com campos: `id`, `usuario_id`, `recurso`, `operacao`, `permitido`, `created_at`, `updated_at`
- ✅ Adicionar campo `is_super_admin` (boolean) na tabela `usuarios`
- ✅ **Granularidade máxima**: Mapear TODAS as operações específicas de cada domínio (~75 permissões)
- ✅ **Super Admin**: Quando `usuarios.is_super_admin = true`, o usuário bypassa todas as verificações de permissão
- ✅ **Sem relação com cargos**: Permissões são atribuídas diretamente ao usuário, não ao cargo
- ✅ Criar middleware de autorização para verificar permissões em todas as rotas protegidas
- ✅ Criar serviços para gerenciar permissões (listar, atribuir, revogar)

### 3. Mapeamento de Permissões por Domínio

#### Advogados (5 permissões)
- `advogados.listar`
- `advogados.visualizar`
- `advogados.criar`
- `advogados.editar`
- `advogados.deletar`

#### Credenciais (6 permissões)
- `credenciais.listar`
- `credenciais.visualizar`
- `credenciais.criar`
- `credenciais.editar`
- `credenciais.deletar`
- `credenciais.ativar_desativar`

#### Acervo (6 permissões)
- `acervo.listar`
- `acervo.visualizar`
- `acervo.editar`
- `acervo.atribuir_responsavel`
- `acervo.desatribuir_responsavel`
- `acervo.transferir_responsavel`

#### Audiências (7 permissões)
- `audiencias.listar`
- `audiencias.visualizar`
- `audiencias.editar`
- `audiencias.atribuir_responsavel`
- `audiencias.desatribuir_responsavel`
- `audiencias.transferir_responsavel`
- `audiencias.editar_url_virtual`

#### Pendentes de Manifestação (8 permissões)
- `pendentes.listar`
- `pendentes.visualizar`
- `pendentes.atribuir_responsavel`
- `pendentes.desatribuir_responsavel`
- `pendentes.transferir_responsavel`
- `pendentes.baixar_expediente`
- `pendentes.reverter_baixa`
- `pendentes.editar_tipo_descricao`

#### Usuários (8 permissões)
- `usuarios.listar`
- `usuarios.visualizar`
- `usuarios.criar`
- `usuarios.editar`
- `usuarios.deletar`
- `usuarios.ativar_desativar`
- `usuarios.gerenciar_permissoes`
- `usuarios.sincronizar`

#### Clientes (5 permissões)
- `clientes.listar`
- `clientes.visualizar`
- `clientes.criar`
- `clientes.editar`
- `clientes.deletar`

#### Partes Contrárias (5 permissões)
- `partes_contrarias.listar`
- `partes_contrarias.visualizar`
- `partes_contrarias.criar`
- `partes_contrarias.editar`
- `partes_contrarias.deletar`

#### Contratos (7 permissões)
- `contratos.listar`
- `contratos.visualizar`
- `contratos.criar`
- `contratos.editar`
- `contratos.deletar`
- `contratos.associar_processo`
- `contratos.desassociar_processo`

#### Agendamentos de Captura (7 permissões)
- `agendamentos.listar`
- `agendamentos.visualizar`
- `agendamentos.criar`
- `agendamentos.editar`
- `agendamentos.deletar`
- `agendamentos.executar`
- `agendamentos.ativar_desativar`

#### Captura de Dados (6 permissões)
- `captura.executar_acervo_geral`
- `captura.executar_arquivados`
- `captura.executar_audiencias`
- `captura.executar_pendentes`
- `captura.visualizar_historico`
- `captura.gerenciar_credenciais`

#### Tipos de Expedientes (5 permissões)
- `tipos_expedientes.listar`
- `tipos_expedientes.visualizar`
- `tipos_expedientes.criar`
- `tipos_expedientes.editar`
- `tipos_expedientes.deletar`

#### Cargos (6 permissões)
- `cargos.listar`
- `cargos.visualizar`
- `cargos.criar`
- `cargos.editar`
- `cargos.deletar`
- `cargos.ativar_desativar`

**Total: 81 permissões granulares**

### 4. Rotas API (Backend)

#### Cargos
- `GET /api/cargos` - Listar cargos (paginação, busca, filtros)
- `POST /api/cargos` - Criar cargo
- `GET /api/cargos/[id]` - Buscar cargo por ID
- `PUT /api/cargos/[id]` - Atualizar cargo
- `DELETE /api/cargos/[id]` - Deletar cargo (com validação de associações)
- `GET /api/cargos/[id]/usuarios` - Listar usuários de um cargo

#### Permissões
- `GET /api/permissoes/recursos` - Listar todos os recursos e operações disponíveis (matriz completa)
- `GET /api/permissoes/usuarios/[id]` - Listar permissões de um usuário
- `POST /api/permissoes/usuarios/[id]` - Atribuir múltiplas permissões a um usuário (batch)
- `PUT /api/permissoes/usuarios/[id]` - Atualizar permissões de um usuário (substituir tudo)
- `DELETE /api/permissoes/usuarios/[id]/recurso/[recurso]/operacao/[operacao]` - Revogar permissão específica

#### Usuários (Modificações)
- Adicionar campos `cargo_id` e `is_super_admin` nas respostas
- Permitir atualizar `cargo_id` via `PUT /api/usuarios/[id]`

### 5. Middleware de Autorização
- Criar helper `checkPermission(usuarioId, recurso, operacao)` que:
  1. Verifica se `usuarios.is_super_admin = true` → retorna `true` (bypassa)
  2. Caso contrário, consulta tabela `permissoes` → retorna resultado
- Integrar `checkPermission` em todas as rotas protegidas existentes

### 6. Frontend (Fase 2 - Não incluído nesta proposta)
- Interface de gerenciamento de permissões dentro da edição de usuário
- Matriz visual: linhas = recursos, colunas = operações, células = checkboxes
- CRUD de cargos com validação de associações

## Impact

### Affected Specs
- `usuarios` - **MODIFIED**: Adicionar campos `cargo_id` e `is_super_admin`
- `cargos` - **ADDED**: Nova spec para sistema de cargos
- `permissoes` - **ADDED**: Nova spec para sistema de permissões granulares
- `auth` - **MODIFIED**: Adicionar middleware de autorização

### Affected Code
- **Migrations**:
  - Nova tabela `cargos`
  - Nova tabela `permissoes`
  - Alterar tabela `usuarios` (adicionar `cargo_id`, `is_super_admin`)
- **Backend Services**:
  - Novos serviços em `backend/cargos/services/`
  - Novos serviços em `backend/permissoes/services/`
  - Modificar `backend/usuarios/services/` para incluir cargos
  - Criar middleware `backend/utils/auth/authorization.ts`
- **API Routes**:
  - Criar rotas em `app/api/cargos/`
  - Criar rotas em `app/api/permissoes/`
  - Modificar todas as rotas existentes para incluir `checkPermission`
- **Types**:
  - Criar `backend/types/cargos/types.ts`
  - Criar `backend/types/permissoes/types.ts`
  - Modificar `backend/types/usuarios/types.ts`

### Breaking Changes
- **NENHUM**: Esta mudança é 100% aditiva. Usuários existentes continuam funcionando normalmente.
- **Migração de dados**: Não necessária. Novos campos são opcionais/nullable.
- **Retrocompatibilidade**: Rotas existentes continuam funcionando. O middleware de autorização só será aplicado após implementação completa.

### Rollout Strategy
1. ✅ **Fase 1 - Backend**: Criar migrations, tabelas, serviços e rotas (esta proposta)
2. ✅ **Fase 2 - Middleware**: Integrar `checkPermission` em rotas existentes (opcional, pode ser gradual)
3. ✅ **Fase 3 - Frontend**: Criar interfaces de gerenciamento (proposta futura)

### Security Considerations
- ✅ Permissões são verificadas no backend (server-side)
- ✅ RLS habilitado nas tabelas `cargos` e `permissoes`
- ✅ Super admins têm poder ilimitado - usar com cuidado
- ✅ Logs de auditoria devem registrar alterações de permissões

### Performance Considerations
- ✅ Índices nas colunas `usuario_id`, `recurso`, `operacao` da tabela `permissoes`
- ✅ Cache de permissões no servidor (considerar Redis no futuro)
- ✅ Query otimizada: `WHERE usuario_id = X AND recurso = Y AND operacao = Z`
