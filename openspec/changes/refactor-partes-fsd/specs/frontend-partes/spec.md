## MODIFIED Requirements

### Requirement: Arquitetura de Componentes de Partes

O modulo de partes MUST seguir a arquitetura Feature-Sliced Design (FSD), com todos os componentes, hooks, utils e tipos centralizados em `src/features/partes/`.

#### Scenario: Estrutura de diretorios FSD
- **WHEN** um desenvolvedor precisa modificar funcionalidade de partes
- **THEN** todo o codigo relevante MUST estar em `src/features/partes/`
- **AND** a estrutura MUST seguir o padrao:
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
- **THEN** MUST importar de `@/features/partes`
- **AND** MUST NOT importar de `@/app/(dashboard)/partes/components/`
- **AND** MUST NOT importar de `@/components/modules/partes/`

#### Scenario: Colocacao de hooks
- **WHEN** um hook eh especifico do modulo de partes
- **THEN** MUST residir em `src/features/partes/hooks/`
- **AND** MUST ser exportado via `@/features/partes`

#### Scenario: Colocacao de utils
- **WHEN** uma funcao utilitaria eh especifica de partes (formatacao de documentos, nomes, etc)
- **THEN** MUST residir em `src/features/partes/utils/`
- **AND** MUST ser exportada via `@/features/partes`

### Requirement: Pages como Entrypoints Simples

As pages em `src/app/(dashboard)/partes/` MUST ser entrypoints simples que:
1. Importam componentes de `@/features/partes`
2. Fazem data fetching server-side quando necessario
3. Renderizam layout com PageShell

#### Scenario: Page de listagem de clientes
- **WHEN** usuario acessa `/partes/clientes`
- **THEN** a page MUST importar `ClientesTableWrapper` de `@/features/partes`
- **AND** MUST fazer fetch inicial no servidor
- **AND** MUST renderizar dentro de `PageShell`

#### Scenario: Page de listagem de partes contrarias
- **WHEN** usuario acessa `/partes/partes-contrarias`
- **THEN** a page MUST importar `PartesContrariasTab` de `@/features/partes`
- **AND** MUST renderizar com Suspense para loading state

#### Scenario: Page de listagem de terceiros
- **WHEN** usuario acessa `/partes/terceiros`
- **THEN** a page MUST importar `TerceirosTab` de `@/features/partes`
- **AND** MUST renderizar com Suspense para loading state

#### Scenario: Page de listagem de representantes
- **WHEN** usuario acessa `/partes/representantes`
- **THEN** a page MUST importar `RepresentantesTab` de `@/features/partes`
- **AND** MUST renderizar com Suspense para loading state

### Requirement: Barrel Exports

O modulo MUST ter um arquivo `index.ts` na raiz que exporta todos os componentes, hooks e utils publicos.

#### Scenario: Importacao simplificada
- **WHEN** codigo externo precisa de multiplos itens do modulo
- **THEN** MUST poder importar tudo de `@/features/partes`
- **AND** MUST NOT precisar conhecer a estrutura interna de diretorios
