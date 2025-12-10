## REMOVED Requirements

### Requirement: Legacy Chat Core Module

**Reason**: O módulo `src/core/chat/` foi migrado para `src/features/chat/` seguindo a arquitetura Feature-Sliced Design. O código legado em `core/` é redundante e deve ser removido.

**Migration**: Atualizar imports de `@/core/chat` para `@/features/chat`.

#### Scenario: Import migration

- **WHEN** código importa de `@/core/chat`
- **THEN** atualizar para `@/features/chat`

### Requirement: Legacy Chat Components

**Reason**: Os componentes em `src/components/modules/chat/` e `src/components/chat/` foram migrados para `src/features/chat/components/`. O código legado é redundante.

**Migration**: Atualizar imports de `@/components/modules/chat` e `@/components/chat` para `@/features/chat`.

#### Scenario: Component import migration

- **WHEN** código importa de `@/components/modules/chat` ou `@/components/chat`
- **THEN** atualizar para `@/features/chat`

### Requirement: Legacy Chat Hooks

**Reason**: Os hooks em `src/hooks/modules/chat/` foram migrados para `src/features/chat/hooks/`. O código legado é redundante.

**Migration**: Atualizar imports de `@/hooks/modules/chat` para `@/features/chat`.

#### Scenario: Hook import migration

- **WHEN** código importa de `@/hooks/modules/chat`
- **THEN** atualizar para `@/features/chat`

### Requirement: Legacy Chat Actions

**Reason**: As Server Actions em `src/app/actions/chat.ts` foram migradas para `src/features/chat/actions.ts`. O arquivo legado é redundante.

**Migration**: Atualizar imports de `@/app/actions/chat` para `@/features/chat`.

#### Scenario: Action import migration

- **WHEN** código importa de `@/app/actions/chat`
- **THEN** atualizar para `@/features/chat`

### Requirement: Legacy Chat API Routes

**Reason**: As API Routes em `src/app/api/chat/` estão deprecadas e foram substituídas por Server Actions em `src/features/chat/actions.ts`.

**Migration**: Usar Server Actions do módulo `@/features/chat` em vez de chamadas HTTP diretas.

#### Scenario: API route deprecation

- **WHEN** código faz fetch para `/api/chat/*`
- **THEN** substituir por Server Action correspondente de `@/features/chat`
