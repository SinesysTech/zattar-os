## ADDED Requirements

### Requirement: Contratos Feature Module Architecture

O módulo de Contratos SHALL seguir a arquitetura Feature-Sliced Design, consolidando toda a lógica relacionada a contratos em um único diretório de feature.

#### Scenario: Import from feature module
- **WHEN** um componente precisa usar funcionalidades de contratos
- **THEN** MUST importar de `@/features/contratos`
- **AND** MUST NOT importar de caminhos legados (`@/core/contratos`, `@/components/modules/contratos`, etc.)

#### Scenario: Feature module structure
- **WHEN** o módulo de contratos é acessado
- **THEN** SHALL expor via `index.ts`:
  - Types e schemas (Contrato, CreateContratoInput, etc.)
  - Service functions (criarContrato, listarContratos, etc.)
  - Server Actions (actionCriarContrato, etc.)
  - React hooks (useContratos)
  - Componentes (ContratosTableWrapper, ContratosTable, etc.)
  - Utilitários (formatarData, getStatusVariant, etc.)

#### Scenario: Internal organization
- **WHEN** o código da feature é organizado
- **THEN** SHALL seguir a estrutura:
  - `types.ts` - Tipos, schemas Zod, constantes
  - `utils.ts` - Funções de formatação e helpers
  - `hooks.ts` - React hooks
  - `actions.ts` - Server Actions
  - `service.ts` - Lógica de negócio
  - `repository.ts` - Acesso ao banco de dados
  - `components/` - Componentes React específicos da feature
