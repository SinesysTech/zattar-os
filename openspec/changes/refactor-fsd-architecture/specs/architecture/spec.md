# Architecture Specification

## ADDED Requirements

### Requirement: Feature-Sliced Design Structure

The system SHALL follow Feature-Sliced Design (FSD) architecture for code organization.

Each feature MUST be located in `src/features/{feature-name}/` and MUST contain at least an `index.ts` file as barrel export.

Features MAY contain the following optional files:
- `domain.ts` - Zod schemas and domain types
- `service.ts` - Business logic
- `repository.ts` - Data access
- `actions.ts` or `actions/` - Server Actions
- `components/` - React components
- `hooks/` - Custom React hooks
- `types/` - Additional TypeScript types
- `RULES.md` - Business rules documentation

#### Scenario: New feature created with minimal structure

- **WHEN** a new feature is created
- **THEN** `src/features/{feature-name}/index.ts` MUST exist
- **AND** the `index.ts` MUST export the feature's public modules

#### Scenario: Complete feature with all modules

- **WHEN** a feature requires data access and UI
- **THEN** `domain.ts` with Zod schemas MUST exist
- **AND** `service.ts` with business logic MUST exist
- **AND** `repository.ts` with Supabase queries MUST exist
- **AND** `components/` with React components MUST exist
- **AND** the `index.ts` MUST re-export public modules

### Requirement: Server Actions in Features

All Server Actions MUST be located within corresponding features at `src/features/{feature}/actions/`.

Server Actions MUST NOT exist in `src/app/actions/`.

All Server Actions MUST use the `authenticatedAction` or `authenticatedFormAction` wrapper from `@/lib/safe-action.ts`.

#### Scenario: Authenticated action with validation

- **WHEN** a Server Action requiring authentication is created
- **THEN** it MUST use `authenticatedAction` or `authenticatedFormAction`
- **AND** it MUST import from `@/lib/safe-action`
- **AND** it MUST be located in `src/features/{feature}/actions/`

#### Scenario: Form action

- **WHEN** a Server Action processes form data
- **THEN** it MUST use `authenticatedFormAction`
- **AND** it MUST receive a Zod schema as first parameter
- **AND** it MUST return strong typing via safe-action

#### Scenario: No legacy actions

- **WHEN** the architectural validation script is executed
- **THEN** no files MUST exist in `src/app/actions/` (except API routes)

### Requirement: Repository Decomposition

Repository files MUST NOT exceed 800 lines of code.

Repositories with multiple entities MUST be decomposed into specialized modules within a `repositories/` directory.

#### Scenario: Monolithic repository decomposed

- **WHEN** a repository exceeds 800 lines
- **THEN** it MUST be decomposed into `src/features/{feature}/repositories/`
- **AND** one file per entity MUST exist (e.g., `clientes-repository.ts`)
- **AND** `shared/converters.ts` for shared conversion functions MUST exist
- **AND** `index.ts` as barrel export MUST exist

#### Scenario: Simple repository

- **WHEN** a repository has less than 800 lines and a single entity
- **THEN** it MAY remain as a single `repository.ts` file

### Requirement: Layer Isolation

React components MUST NOT directly import the Supabase client.

Components MUST access data through:
- Server Actions (for mutations)
- Server Components with service calls (for reading)
- Custom hooks that encapsulate calls

#### Scenario: Component with data access

- **WHEN** a component needs database data
- **THEN** it MUST NOT import `createClient` from `@/lib/supabase`
- **AND** it MUST use Server Action, service, or custom hook

#### Scenario: Component with mutation

- **WHEN** a component needs to modify data
- **THEN** it MUST use `useFormState` or `useTransition` with Server Action
- **AND** the Server Action MUST be in `src/features/{feature}/actions/`

### Requirement: CopilotKit Actions in Features

CopilotKit actions MUST be located at `src/features/{feature}/copilot/actions.ts`.

The `src/lib/copilotkit/` directory MUST contain only:
- Global configuration (`config.ts`)
- System prompt (`system-prompt.ts`)
- Generic wrapper components (`components/`)

#### Scenario: Feature-specific CopilotKit action

- **WHEN** a CopilotKit action is specific to a feature
- **THEN** it MUST be at `src/features/{feature}/copilot/actions.ts`
- **AND** it MUST be exported via feature's barrel export

#### Scenario: Global CopilotKit configuration

- **WHEN** CopilotKit configuration is shared
- **THEN** it MUST be at `src/lib/copilotkit/config.ts`
- **AND** it MUST NOT contain feature-specific logic

### Requirement: Automated Architectural Validation

The project MUST include an architectural validation script at `scripts/validate-architecture.ts`.

The script MUST be executed in CI/CD and MUST fail the build if violations are found.

#### Scenario: CI validation

- **WHEN** a PR is opened
- **THEN** the architectural validation script MUST be executed
- **AND** the PR MUST be blocked if violations exist

#### Scenario: Required validations

- **WHEN** the validation script is executed
- **THEN** it MUST verify absence of files in `src/app/actions/`
- **AND** it MUST verify 800 lines limit per file
- **AND** it MUST verify absence of Supabase imports in components
- **AND** it MUST verify safe-action usage in actions
- **AND** it MUST verify minimal feature structure

### Requirement: Feature Documentation

Each feature MUST have business rules documentation in `RULES.md`.

Pure domain features (without UI) MUST have explanatory comment in `index.ts`.

#### Scenario: Feature with documentation

- **WHEN** a feature is created or significantly modified
- **THEN** `src/features/{feature}/RULES.md` MUST exist
- **AND** it MUST document business rules
- **AND** it MUST document validations
- **AND** it MUST document main use cases

#### Scenario: Pure domain feature

- **WHEN** a feature has no UI components
- **THEN** the `index.ts` MUST contain a comment explaining it's a pure domain feature
- **AND** it MAY omit the `components/` directory
