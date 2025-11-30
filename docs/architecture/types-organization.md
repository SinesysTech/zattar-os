# Organização de Tipos no Sinesys

## 1. Visão Geral

A organização dos tipos no projeto Sinesys segue princípios de Domain-Driven Design (DDD) para garantir clareza, coesão e baixo acoplamento entre as diferentes camadas da aplicação (frontend, backend, domínio). O objetivo é centralizar os tipos de domínio e contratos de aplicação em um local compartilhado, enquanto mantém tipos específicos de infraestrutura e interface em suas respectivas camadas.

Essa estrutura promove:
- **Reutilização**: Tipos de domínio e contratos podem ser usados em todo o projeto sem duplicação.
- **Coerência**: Uma única fonte de verdade para a definição das estruturas de dados do negócio.
- **Separação de Preocupações**: Claramente distingue entre o que é o "negócio" (domínio), o "como o negócio é usado" (contratos/aplicação) e o "como o negócio é implementado" (infraestrutura/interface).
- **Manutenção Simplificada**: Alterações em tipos centrais refletem-se de forma controlada nas camadas dependentes.

## 2. Estrutura de Pastas

A nova estrutura de tipos compartilhados reside na pasta `/types` na raiz do projeto, organizada da seguinte forma:

```
/types
├── domain/        # Tipos da camada de Domínio (DDD)
│   ├── common.ts  # Tipos genéricos como Paginacao, TipoPessoa, GrauProcesso
│   ├── acervo.ts  # Entidades e Value Objects do domínio de Acervo
│   ├── audiencias.ts # Entidades e Value Objects do domínio de Audiências
│   ├── partes.ts  # Entidades e Value Objects para Cliente, ParteContraria, Terceiro
│   ├── enderecos.ts # Entidades e Value Objects para Endereços
│   ├── processo-partes.ts # Entidades e Value Objects para ProcessoPartes
│   ├── processo-relacionado.ts # Tipos para processos relacionados
│   └── index.ts   # Exporta todos os tipos de domínio
├── contracts/     # Tipos da camada de Aplicação (DDD)
│   ├── acervo.ts  # DTOs e interfaces de serviço para Acervo
│   ├── audiencias.ts # DTOs e interfaces de serviço para Audiências
│   ├── partes.ts  # DTOs e interfaces de serviço para Cliente, ParteContraria, Terceiro
│   ├── enderecos.ts # DTOs e interfaces de serviço para Endereços
│   ├── processo-partes.ts # DTOs e interfaces de serviço para ProcessoPartes
│   └── index.ts   # Exporta todos os tipos de contratos
└── index.ts       # Exporta todos os tipos de domínio e contratos para acesso simplificado
```

### Detalhamento das Subpastas:

-   **`/types/domain`**:
    -   Contém as definições mais puras do modelo de domínio.
    -   Inclui Entidades, Value Objects, e Enums que representam conceitos centrais do negócio.
    -   São agnósticos a qualquer tecnologia (banco de dados, framework web, etc.).
    -   Exemplos: `Acervo`, `Cliente`, `Endereco`, `TipoPessoa`, `GrauProcesso`.

-   **`/types/contracts`**:
    -   Contém os Data Transfer Objects (DTOs) e interfaces de comunicação entre camadas ou serviços.
    -   Define a "linguagem" pela qual a camada de aplicação interage com o domínio ou com outros serviços.
    -   Inclui parâmetros de entrada para operações (e.g., `CriarClienteParams`), resultados de operações (e.g., `ListarClientesResult`), e estruturas para ordenação e filtragem.
    -   Exemplos: `ListarAcervoParams`, `CriarAudienciaParams`.

### Outras Camadas de Tipos:

-   **`backend/types/`**:
    -   Após a refatoração, esta pasta deve conter apenas tipos que são estritamente específicos da infraestrutura ou de integrações de baixo nível do backend.
    -   Exemplos: Tipos de integração com APIs externas (PJE-TRT), tipos de esquemas de banco de dados (MongoDB), configurações de ambiente específicas do servidor.

-   **`app/_lib/types/`**:
    -   Contém tipos específicos da camada de apresentação (frontend/UI).
    -   Inclui:
        -   `*ApiResponse`: Respostas padronizadas de APIs para o frontend.
        -   `*Filters`: Interfaces para o estado de filtros da UI.
        -   `*FormData`: Tipos para dados de formulários na UI.
        -   Funções utilitárias de formatação e validação específicas da UI.
    -   Estes tipos importam e utilizam os tipos de `/types/domain` e `/types/contracts`, adaptando-os para as necessidades da interface do usuário.

## 3. Convenções de Nomenclatura

-   **Arquivos de Domínio**: Nome do conceito em `kebab-case.ts` (e.g., `acervo.ts`, `processo-partes.ts`).
-   **Arquivos de Contratos**: Nome do conceito em `kebab-case.ts` (e.g., `acervo.ts`, `partes.ts`).
-   **Interfaces/Tipos de Domínio**: `PascalCase` para entidades e value objects (e.g., `Cliente`, `Endereco`).
-   **Interfaces/Tipos de Contratos**:
    -   Parâmetros de entrada: `AcaoConceitoParams` (e.g., `CriarClienteParams`, `ListarAcervoParams`).
    -   Resultados: `AcaoConceitoResult` (e.g., `ListarClientesResult`).
    -   Ordenação: `OrdenarPorConceito`, `OrdemConceito`.
-   **Interfaces/Tipos de Frontend**:
    -   Respostas de API: `ConceitoApiResponse` (e.g., `ClientesApiResponse`).
    -   Filtros: `ConceitoFilters` (e.g., `ProcessosFilters`).
    -   Dados de formulário: `ConceitoFormData` (e.g., `ClienteFormData`).

## 4. Guia de Uso

-   **Importar Tipos de Domínio**: Use `@/types/domain` para importar entidades, VOs e enums que representam o coração do seu negócio.
    ```typescript
    import type { Cliente, GrauProcesso } from '@/types/domain';
    // ou mais específico
    import type { Cliente } from '@/types/domain/partes';
    import type { GrauProcesso } from '@/types/domain/common';
    ```
-   **Importar Contratos/DTOs**: Use `@/types/contracts` para interagir com as interfaces de serviço.
    ```typescript
    import type { ListarClientesParams, CriarAudienciaParams } from '@/types/contracts';
    // ou mais específico
    import type { ListarClientesParams } from '@/types/contracts/partes';
    ```
-   **Frontend-specific Types**: Use `app/_lib/types` apenas para tipos que são exclusivos da camada de apresentação e que não fariam sentido existirem no backend.
-   **Evitar Ciclagem**: Garanta que as camadas superiores (Application/UI) importem de camadas inferiores (Domain), mas nunca o contrário.

## 5. Migração

-   Todos os tipos que eram compartilhados entre frontend e backend, ou que representavam o domínio puro, foram movidos de `backend/types` para a nova estrutura `/types`.
-   As pastas `backend/types/acervo`, `backend/types/audiencias`, `backend/types/partes` (e seus subarquivos) e `backend/types/global.ts` foram removidas ou esvaziadas.
-   Módulos que referenciavam os tipos antigos devem atualizar seus imports para `@{/types/domain}` ou `@{/types/contracts}`.
-   O `tsconfig.json` foi atualizado com aliases de caminho (`paths`) para facilitar esses imports.
