## MODIFIED Requirements

### Requirement: Arquitetura de Componentes de Partes

O modulo de partes DEVE seguir a arquitetura Feature-Sliced Design (FSD), com todos os componentes, hooks, utils e tipos centralizados em `src/features/partes/`.

#### Scenario: Estrutura de diretorios FSD
- **WHEN** um desenvolvedor precisa modificar funcionalidade de partes
- **THEN** todo o codigo relevante DEVE estar em `src/features/partes/`
- **AND** a estrutura DEVE seguir o padrao:
  ```
  src/features/partes/
  ├── components/
  │   ├── clientes/
  │   ├── partes-contrarias/
  │   ├── terceiros/
  │   ├── representantes/
  │   └── shared/
  ├── hooks/
  ├── utils/
  ├── types/
  └── index.ts
  ```

#### Scenario: Importacao de componentes nas pages
- **WHEN** uma page de partes precisa de um componente
- **THEN** DEVE importar de `@/features/partes`
- **AND** NAO DEVE importar de `@/app/(dashboard)/partes/components/`
- **AND** NAO DEVE importar de `@/components/modules/partes/`

#### Scenario: Colocacao de hooks
- **WHEN** um hook eh especifico do modulo de partes
- **THEN** DEVE residir em `src/features/partes/hooks/`
- **AND** DEVE ser exportado via `@/features/partes`

#### Scenario: Colocacao de utils
- **WHEN** uma funcao utilitaria eh especifica de partes (formatacao de documentos, nomes, etc)
- **THEN** DEVE residir em `src/features/partes/utils/`
- **AND** DEVE ser exportada via `@/features/partes`

### Requirement: Pages como Entrypoints Simples

As pages em `src/app/(dashboard)/partes/` DEVEM ser entrypoints simples que:
1. Importam componentes de `@/features/partes`
2. Fazem data fetching server-side quando necessario
3. Renderizam layout com PageShell

#### Scenario: Page de listagem de clientes
- **WHEN** usuario acessa `/partes/clientes`
- **THEN** a page DEVE importar `ClientesTableWrapper` de `@/features/partes`
- **AND** DEVE fazer fetch inicial no servidor
- **AND** DEVE renderizar dentro de `PageShell`

#### Scenario: Page de listagem de partes contrarias
- **WHEN** usuario acessa `/partes/partes-contrarias`
- **THEN** a page DEVE importar `PartesContrariasTab` de `@/features/partes`
- **AND** DEVE renderizar com Suspense para loading state

#### Scenario: Page de listagem de terceiros
- **WHEN** usuario acessa `/partes/terceiros`
- **THEN** a page DEVE importar `TerceirosTab` de `@/features/partes`
- **AND** DEVE renderizar com Suspense para loading state

#### Scenario: Page de listagem de representantes
- **WHEN** usuario acessa `/partes/representantes`
- **THEN** a page DEVE importar `RepresentantesTab` de `@/features/partes`
- **AND** DEVE renderizar com Suspense para loading state

### Requirement: Barrel Exports

O modulo DEVE ter um arquivo `index.ts` na raiz que exporta todos os componentes, hooks e utils publicos.

#### Scenario: Importacao simplificada
- **WHEN** codigo externo precisa de multiplos itens do modulo
- **THEN** DEVE poder importar tudo de `@/features/partes`
- **AND** NAO DEVE precisar conhecer a estrutura interna de diretorios
