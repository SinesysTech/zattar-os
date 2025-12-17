# Tasks: Refatoracao Arquitetural FSD

## 1. Preparacao e Setup

- [x] 1.1 Criar branch `refactor/fsd-architecture`
- [x] 1.2 Criar script `scripts/validate-architecture.ts` (modo warning inicial)
- [x] 1.3 Adicionar script ao `package.json`: `"validate:arch": "tsx scripts/validate-architecture.ts"`
- [x] 1.4 Executar script e documentar baseline de violacoes

### 1.5 Estado Atual da Validacao (2024-12-17)
**11 erros, 77 avisos**

Erros restantes:
- 3x no-legacy-actions: partes.ts, expedientes.ts, comunica-cnj.ts (marcados @deprecated)
- 8x no-supabase-in-components: 4 componentes importam Supabase diretamente

Avisos (nao bloqueantes):
- 27x max-file-lines: arquivos acima de 800 linhas
- 50x actions-use-safe-action: actions sem wrapper safe-action

## 2. Migracao de Actions de Partes

### 2.1 Criar Estrutura de Actions
- [x] 2.1.1 Criar diretorio `src/features/partes/actions/` (ja existia)
- [x] 2.1.2 Atualizar `src/features/partes/actions/clientes-actions.ts` com safe-action
- [x] 2.1.3 Atualizar `src/features/partes/actions/partes-contrarias-actions.ts` com safe-action
- [x] 2.1.4 Atualizar `src/features/partes/actions/terceiros-actions.ts` com safe-action
- [x] 2.1.5 Criar `src/features/partes/actions/index.ts` (barrel export)

### 2.2 Migrar Actions de Clientes
- [x] 2.2.1 Migrar `actionCriarCliente` para usar `authenticatedFormAction` (actionCriarClienteSafe)
- [x] 2.2.2 Migrar `actionAtualizarCliente` para usar `authenticatedAction` (actionAtualizarClienteSafe)
- [x] 2.2.3 Migrar `actionDesativarCliente` para usar `authenticatedAction` (actionDesativarClienteSafe)
- [x] 2.2.4 Migrar actions de busca de clientes (actionBuscarClienteSafe, actionListarClientesSafe)
- [ ] 2.2.5 Atualizar imports em `src/features/partes/components/clientes/` (pendente)

### 2.3 Migrar Actions de Partes Contrarias
- [x] 2.3.1 Migrar `actionCriarParteContraria` para usar `authenticatedFormAction`
- [x] 2.3.2 Migrar `actionAtualizarParteContraria` para usar `authenticatedAction`
- [ ] 2.3.3 Migrar `actionDeletarParteContraria` para usar `authenticatedAction` (nao existe no service)
- [ ] 2.3.4 Atualizar imports em `src/features/partes/components/partes-contrarias/` (pendente)

### 2.4 Migrar Actions de Terceiros
- [x] 2.4.1 Migrar `actionCriarTerceiro` para usar `authenticatedFormAction`
- [x] 2.4.2 Migrar `actionAtualizarTerceiro` para usar `authenticatedAction`
- [ ] 2.4.3 Migrar `actionDeletarTerceiro` para usar `authenticatedAction` (nao existe no service)
- [ ] 2.4.4 Atualizar imports em `src/features/partes/components/terceiros/` (pendente)

### 2.5 Finalizar Migracao de Partes
- [x] 2.5.1 Atualizar `src/features/partes/index.ts` com novos exports
- [x] 2.5.2 Marcar `src/app/actions/partes.ts` como @deprecated
- [ ] 2.5.3 Verificar todos os imports na codebase (pendente)
- [ ] 2.5.4 Executar testes de regressao (pendente)
- [ ] 2.5.5 Deletar `src/app/actions/partes.ts` (apos migracao completa de consumidores)

## 3. Migracao de Actions de Expedientes

- [x] 3.1 Verificar se `src/features/expedientes/actions.ts` existe (ja existe)
- [x] 3.2 Actions ja estao na feature expedientes
- [x] 3.3 Marcar `src/app/actions/expedientes.ts` como @deprecated
- [ ] 3.4 Refatorar para usar `authenticatedAction` na feature (parcialmente feito)
- [ ] 3.5 Atualizar imports em componentes de expedientes (pendente)
- [ ] 3.6 Remover referencias ao arquivo legado
- [ ] 3.7 Executar testes de regressao (pendente)
- [ ] 3.8 Deletar `src/app/actions/expedientes.ts` (apos migracao completa)

## 4. Remover Actions Vazias e Migrar Comunica-CNJ

- [x] 4.1 Verificar uso de `src/app/actions/pje.ts` (nao utilizado)
- [x] 4.2 Deletar `src/app/actions/pje.ts`
- [x] 4.3 Criar `src/features/captura/comunica-cnj/actions.ts` com safe-action
- [x] 4.4 Criar `src/features/captura/comunica-cnj/index.ts` (barrel export)
- [x] 4.5 Marcar `src/app/actions/comunica-cnj.ts` como @deprecated
- [ ] 4.6 Deletar diretorio `src/app/actions/` (apos migracao completa)

## 5. Decomposicao do Repository de Partes

### 5.1 Criar Estrutura de Repositories
- [x] 5.1.1 Criar diretorio `src/features/partes/repositories/`
- [x] 5.1.2 Criar diretorio `src/features/partes/repositories/shared/`
- [x] 5.1.3 Criar `src/features/partes/repositories/index.ts`

### 5.2 Extrair Converters
- [x] 5.2.1 Criar `src/features/partes/repositories/shared/converters.ts`
- [x] 5.2.2 Mover `converterParaCliente()` (linhas ~53-120)
- [x] 5.2.3 Mover `converterParaParteContraria()` (linhas ~121-200)
- [x] 5.2.4 Mover `converterParaTerceiro()` (linhas ~201-280)
- [x] 5.2.5 Mover `converterParaEndereco()` (linhas ~281-317)
- [ ] 5.2.6 Criar `src/features/partes/repositories/shared/types.ts` (opcional)

### 5.3 Criar Clientes Repository
- [x] 5.3.1 Criar `src/features/partes/repositories/clientes-repository.ts`
- [x] 5.3.2 Mover `findClienteById()`
- [x] 5.3.3 Mover `findClienteByCPF()`
- [x] 5.3.4 Mover `findClienteByCNPJ()`
- [x] 5.3.5 Mover `findClienteByNome()`
- [x] 5.3.6 Mover `findAllClientes()`
- [x] 5.3.7 Mover `saveCliente()`
- [x] 5.3.8 Mover `updateCliente()`
- [x] 5.3.9 Mover `upsertCliente()` (upsertClienteByCPF, upsertClienteByCNPJ)
- [x] 5.3.10 Mover `softDeleteCliente()`
- [x] 5.3.11 Mover `findAllClientesComEndereco()`
- [x] 5.3.12 Mover `findAllClientesComEnderecoEProcessos()`
- [x] 5.3.13 Mover `findClienteByIdComEndereco()`

### 5.4 Criar Partes Contrarias Repository
- [x] 5.4.1 Criar `src/features/partes/repositories/partes-contrarias-repository.ts`
- [x] 5.4.2 Mover todas as funcoes de partes contrarias
- [x] 5.4.3 Atualizar imports de converters

### 5.5 Criar Terceiros Repository
- [x] 5.5.1 Criar `src/features/partes/repositories/terceiros-repository.ts`
- [x] 5.5.2 Mover todas as funcoes de terceiros
- [x] 5.5.3 Atualizar imports de converters

### 5.6 Finalizar Decomposicao
- [x] 5.6.1 Atualizar `src/features/partes/repositories/index.ts` com todos os exports
- [ ] 5.6.2 Atualizar `src/features/partes/service.ts` para importar de repositories especificos (pendente - requer mais analise)
- [x] 5.6.3 Criar re-exports em `src/features/partes/repository.ts` (deprecation notice)
- [ ] 5.6.4 Verificar todos os imports na codebase (pendente)
- [ ] 5.6.5 Executar testes de regressao (pendente)
- [ ] 5.6.6 Deletar funcoes do arquivo original apos validacao (futuro)

## 6. Consolidacao de Features Duplicadas

### 6.1 Renomear Features
- [ ] 6.1.1 Renomear `src/features/profiles/` para `src/features/profile-system/`
- [ ] 6.1.2 Atualizar todos os imports de `@/features/profiles` para `@/features/profile-system`
- [ ] 6.1.3 Renomear `src/features/perfil/` para `src/features/user-profile/`
- [ ] 6.1.4 Atualizar todos os imports de `@/features/perfil` para `@/features/user-profile`
- [ ] 6.1.5 Adicionar comentarios de documentacao explicando diferenca

### 6.2 Consolidar Feature Repasses
- [ ] 6.2.1 Mover `src/features/repasses/components/repasses-page-content.tsx` para `src/features/obrigacoes/components/repasses/`
- [ ] 6.2.2 Atualizar imports em paginas que usam repasses
- [ ] 6.2.3 Atualizar `src/features/obrigacoes/index.ts`
- [ ] 6.2.4 Deletar `src/features/repasses/`

## 7. Completar Features Incompletas

### 7.1 Feature Busca
- [ ] 7.1.1 Criar `src/features/busca/domain.ts` com schemas Zod
- [ ] 7.1.2 Criar `src/features/busca/service.ts` com logica de busca semantica
- [ ] 7.1.3 Criar `src/features/busca/repository.ts` para queries de busca
- [ ] 7.1.4 Criar `src/features/busca/components/` com UI de busca
- [ ] 7.1.5 Criar `src/features/busca/hooks/use-busca-semantica.ts`
- [ ] 7.1.6 Atualizar `src/features/busca/index.ts`

### 7.2 Documentar Features de Dominio Puro
- [ ] 7.2.1 Adicionar comentario em `src/features/obrigacoes/index.ts` (se feature de dominio puro)
- [ ] 7.2.2 Adicionar comentario em `src/features/cargos/index.ts` (se feature de dominio puro)
- [ ] 7.2.3 Adicionar comentario em `src/features/tipos-expedientes/index.ts` (se feature de dominio puro)

## 8. Remover Codigo Nao Utilizado

### 8.1 Verificar e Remover Hooks
- [x] 8.1.1 Verificar referencias a `src/hooks/use-yjs-collaboration.ts` (sem referencias - DELETADO)
- [x] 8.1.2 Verificar referencias a `src/hooks/use-realtime-presence-room.ts` (usado em realtime-avatar-stack)
- [x] 8.1.3 Verificar referencias a `src/hooks/use-realtime-cursors.ts` (usado em realtime-cursors)
- [x] 8.1.4 Verificar referencias a `src/hooks/use-realtime-collaboration.ts` (usado em documentos)
- [x] 8.1.5 Deletar hooks nao utilizados (deletado use-yjs-collaboration.ts e lib/yjs/supabase-provider.ts)

### 8.2 Verificar e Remover Componentes Calendar
- [x] 8.2.1 Verificar referencias a `src/components/calendar/` (56 referencias - EM USO)
- [x] 8.2.2 Calendar em uso por audiencias e sandbox - NAO DELETAR

## 9. Reorganizacao de Tipos

### 9.1 Mover Tipos para Features
- [x] 9.1.1 Verificar `src/types/terceiros.ts` - sem referencias externas - DELETADO
- [x] 9.1.2 Mover `src/types/credenciais.ts` para `src/features/captura/types/credenciais.ts`
- [x] 9.1.3 Atualizar 7 arquivos que importavam de @/types/credenciais
- [ ] 9.1.4 Mover `src/types/domain/processo-partes.ts` para `src/features/partes/types/` (adiado - usado por multiplas features)

### 9.2 Limpar src/types/
- [x] 9.2.1 Corrigir `src/types/index.ts` - remover export quebrado de assinatura-digital
- [x] 9.2.2 Deletar `src/types/terceiros.ts` (nao utilizado)
- [x] 9.2.3 Deletar `src/types/credenciais.ts` (movido para feature)
- [ ] 9.2.4 Tipos restantes sao compartilhados (domain/, responsive.ts, pwa.d.ts, etc.)

### 9.3 Sincronizacao de Tipos
- [ ] 9.3.1 Verificar sincronizacao de tipos em `domain.ts` com `database.types.ts`
- [ ] 9.3.2 Criar script de validacao de tipos (opcional)
- [ ] 9.3.3 Documentar processo de regeneracao de tipos apos migrations

## 10. Refatoracao CopilotKit

### 10.1 Mover Actions para Features
- [ ] 10.1.1 Criar `src/features/processos/copilot/actions.ts`
- [ ] 10.1.2 Mover conteudo de `src/lib/copilotkit/actions/processos.actions.ts`
- [ ] 10.1.3 Criar `src/features/audiencias/copilot/actions.ts`
- [ ] 10.1.4 Mover conteudo de `src/lib/copilotkit/actions/audiencias.actions.ts`
- [ ] 10.1.5 Criar `src/features/expedientes/copilot/actions.ts`
- [ ] 10.1.6 Mover conteudo de `src/lib/copilotkit/actions/expedientes.actions.ts`
- [ ] 10.1.7 Criar `src/features/navegacao/copilot/actions.ts` (se feature existir)
- [ ] 10.1.8 Mover conteudo de `src/lib/copilotkit/actions/navegacao.actions.ts`

### 10.2 Atualizar lib/copilotkit
- [ ] 10.2.1 Atualizar imports em `src/lib/copilotkit/config.ts`
- [ ] 10.2.2 Verificar e atualizar `src/lib/copilotkit/system-prompt.ts`
- [ ] 10.2.3 Deletar `src/lib/copilotkit/actions/` apos migracao completa

## 11. Otimizacoes de Performance

### 11.1 Adicionar Paginacao
- [ ] 11.1.1 Adicionar paginacao em `src/features/documentos/repository.ts`
- [ ] 11.1.2 Adicionar paginacao em `src/features/acervo/service.ts`
- [ ] 11.1.3 Adicionar paginacao em outros repositories sem paginacao
- [ ] 11.1.4 Definir padrao de paginacao (limite default, cursor vs offset)

### 11.2 Implementar Cache
- [ ] 11.2.1 Decidir estrategia de cache (Redis vs Next.js vs memoria)
- [ ] 11.2.2 Implementar cache para listagem de tribunais
- [ ] 11.2.3 Implementar cache para listagem de usuarios
- [ ] 11.2.4 Implementar cache para tipos de expedientes

### 11.3 Otimizar Queries
- [ ] 11.3.1 Verificar queries N+1 em `src/features/captura/services/persistence/`
- [ ] 11.3.2 Verificar queries N+1 em `src/features/processos/repository.ts`
- [ ] 11.3.3 Refatorar queries problematicas para usar JOINs ou batch

## 12. Documentacao e Validacao

### 12.1 Criar RULES.md
- [ ] 12.1.1 Criar `src/features/partes/RULES.md`
- [ ] 12.1.2 Criar `src/features/usuarios/RULES.md`
- [ ] 12.1.3 Criar `src/features/enderecos/RULES.md`
- [ ] 12.1.4 Criar `src/features/acervo/RULES.md`
- [ ] 12.1.5 Criar `src/features/contratos/RULES.md`
- [ ] 12.1.6 Criar `src/features/rh/RULES.md`
- [ ] 12.1.7 Criar `src/features/expedientes/RULES.md`
- [ ] 12.1.8 Criar `src/features/captura/RULES.md`

### 12.2 Atualizar Documentacao
- [ ] 12.2.1 Atualizar `ARCHITECTURE.md` com novas estruturas
- [ ] 12.2.2 Documentar padrao de uso de `safe-action`
- [ ] 12.2.3 Documentar estrutura de repositories decompostos
- [ ] 12.2.4 Documentar organizacao de tipos

### 12.3 Finalizar Validacao
- [ ] 12.3.1 Atualizar `scripts/validate-architecture.ts` para modo error
- [ ] 12.3.2 Adicionar script ao CI/CD (`.github/workflows/ci.yml`)
- [ ] 12.3.3 Adicionar script ao pre-commit hook (opcional)
- [ ] 12.3.4 Verificar que todas as validacoes passam

## 13. Finalizacao

- [ ] 13.1 Executar suite completa de testes
- [ ] 13.2 Executar build de producao
- [ ] 13.3 Revisar todos os re-exports temporarios e remover se possivel
- [ ] 13.4 Code review final
- [ ] 13.5 Merge para branch principal
- [ ] 13.6 Arquivar esta change proposal
