## MODIFIED Requirements

### Requirement: Contratos Feature Module

O módulo de Contratos SHALL seguir a arquitetura Feature-Sliced Design, consolidando toda a lógica relacionada a contratos em um único diretório de feature.

#### Scenario: Import from feature module
- **WHEN** um componente precisa usar funcionalidades de contratos
- **THEN** DEVE importar de `@/features/contratos`
- **AND** NÃO DEVE importar de caminhos legados (`@/core/contratos`, `@/components/modules/contratos`, etc.)

#### Scenario: Feature module structure
- **WHEN** o módulo de contratos é acessado
- **THEN** DEVE expor via `index.ts`:
  - Types e schemas (Contrato, CreateContratoInput, etc.)
  - Service functions (criarContrato, listarContratos, etc.)
  - Server Actions (actionCriarContrato, etc.)
  - React hooks (useContratos)
  - Componentes (ContratosTableWrapper, ContratosTable, etc.)
  - Utilitários (formatarData, getStatusVariant, etc.)

#### Scenario: Internal organization
- **WHEN** o código da feature é organizado
- **THEN** DEVE seguir a estrutura:
  - `types.ts` - Tipos, schemas Zod, constantes
  - `utils.ts` - Funções de formatação e helpers
  - `hooks.ts` - React hooks
  - `actions.ts` - Server Actions
  - `service.ts` - Lógica de negócio
  - `repository.ts` - Acesso ao banco de dados
  - `components/` - Componentes React específicos da feature

## REMOVED Requirements

### Requirement: Legacy Contratos Core Module

**Reason**: Migrado para Feature-Sliced Design em `src/features/contratos/`

**Migration**:
- `@/core/contratos/*` → `@/features/contratos`
- `@/components/modules/contratos/*` → `@/features/contratos`
- `@/app/_lib/types/contratos` → `@/features/contratos`
- `@/app/_lib/utils/format-contratos` → `@/features/contratos`
- `@/app/_lib/hooks/use-contratos` → `@/features/contratos`
- `@/app/actions/contratos` → `@/features/contratos`
