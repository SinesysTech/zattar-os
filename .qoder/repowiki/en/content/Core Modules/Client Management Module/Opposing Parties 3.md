# Opposing Parties

<cite>
**Referenced Files in This Document**   
- [partes-contrarias-tab.tsx](file://app/(dashboard)/partes/components/partes-contrarias-tab.tsx)
- [partes-contrarias-toolbar-filters.tsx](file://app/(dashboard)/partes/components/partes-contrarias-toolbar-filters.tsx)
- [atualizar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/atualizar-parte-contraria.service.ts)
- [buscar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/buscar-parte-contraria.service.ts)
- [criar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/criar-parte-contraria.service.ts)
- [parte-contraria-persistence.service.ts](file://backend/partes-contrarias/services/persistence/parte-contraria-persistence.service.ts)
- [10_partes_contrarias.sql](file://supabase/schemas/10_partes_contrarias.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Frontend Components](#frontend-components)
3. [Backend Services](#backend-services)
4. [Data Model and Persistence](#data-model-and-persistence)
5. [Search Functionality](#search-functionality)
6. [Client vs. Opposing Party Distinction](#client-vs-opposing-party-distinction)
7. [Conclusion](#conclusion)

## Introduction

The Opposing Parties feature in the Sinesys application provides comprehensive management of parties involved in legal processes who are not the firm's clients. This system enables legal professionals to maintain detailed records of opposing parties, including their identification, contact information, and relationship to various legal processes. The implementation follows a clean architecture pattern with clear separation between frontend components, backend services, and data persistence layers.

The feature supports both individuals (Pessoa Física - PF) and organizations (Pessoa Jurídica - PJ) with distinct data models for each type. Key capabilities include creating, updating, and listing opposing parties, with robust search functionality by name, CPF (individual taxpayer registry), and CNPJ (corporate taxpayer registry). The system integrates with the PJE (Processo Judicial Eletrônico) platform, synchronizing relevant data from the electronic court system.

**Section sources**
- [partes-contrarias-tab.tsx](file://app/(dashboard)/partes/components/partes-contrarias-tab.tsx#L1-L417)
- [10_partes_contrarias.sql](file://supabase/schemas/10_partes_contrarias.sql#L1-L139)

## Frontend Components

The frontend implementation of the Opposing Parties feature consists of two main components: `partes-contrarias-tab.tsx` and `partes-contrarias-toolbar-filters.tsx`. These components work together to provide a user-friendly interface for managing opposing party records.

The `PartesContrariasTab` component serves as the main interface, rendering a data table that displays opposing parties with their identification, contact details, addresses, and associated processes. The table includes sorting capabilities on the "Identificação" column and provides action buttons for viewing details. Each row in the table presents comprehensive information in a compact format, with copy-to-clipboard functionality for quick access to names, CPF/CNPJ numbers, emails, and phone numbers.

The component implements debounced search functionality with a 500ms delay to optimize performance when users are typing search queries. It also manages pagination state, allowing users to navigate through large datasets efficiently. The UI includes a toolbar with search functionality and filter options, enhancing the user's ability to locate specific records.

The `partes-contrarias-toolbar-filters.tsx` component defines the filtering capabilities for the opposing parties list. It provides two main filter categories: "Tipo de Pessoa" (Individual or Organization) and "Situação" (Active or Inactive). These filters are implemented as combobox options that can be selected to narrow down the displayed results. The component exports utility functions for building filter options, parsing selected filters, and constructing filter groups for the UI.

**Section sources**
- [partes-contrarias-tab.tsx](file://app/(dashboard)/partes/components/partes-contrarias-tab.tsx#L1-L417)
- [partes-contrarias-toolbar-filters.tsx](file://app/(dashboard)/partes/components/partes-contrarias-toolbar-filters.tsx#L1-L136)

## Backend Services

The backend services for the Opposing Parties feature implement the business logic layer, acting as an intermediary between the frontend and the data persistence layer. These services follow a clean architecture pattern, with each service focusing on a specific domain operation.

The `criar-parte-contraria.service.ts` file contains the `cadastrarParteContraria` function, which handles the creation of new opposing parties. This service validates input data, checks for duplicates based on CPF or CNPJ, and creates records in the database. The service includes comprehensive logging to track the creation process, with success and error messages that aid in debugging and monitoring.

The `atualizar-parte-contraria.service.ts` file implements the `atualizarParteContraria` function, which manages updates to existing opposing party records. This service enforces business rules such as preventing changes to the party type (from individual to organization or vice versa) after creation. It also maintains an audit trail by storing previous data in the `dados_anteriores` field, allowing for change tracking and potential rollback if needed.

The `buscar-parte-contraria.service.ts` file provides search functionality through three specialized functions: `obterParteContrariaPorId`, `obterParteContrariaPorCpf`, and `obterParteContrariaPorCnpj`. These services offer optimized lookup capabilities by different identifiers, supporting both exact matches and partial searches. The service layer ensures that search operations are performed efficiently, leveraging database indexes for optimal performance.

All backend services follow a consistent error handling pattern, returning structured results with success flags, error messages, and data payloads. This approach enables the frontend to handle different scenarios appropriately, providing meaningful feedback to users.

**Section sources**
- [atualizar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/atualizar-parte-contraria.service.ts#L1-L48)
- [buscar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/buscar-parte-contraria.service.ts#L1-L32)
- [criar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/criar-parte-contraria.service.ts#L1-L54)

## Data Model and Persistence

The data model for opposing parties is implemented in the Supabase database schema file `10_partes_contrarias.sql` and reflected in the TypeScript types used throughout the application. The model supports both individuals (PF) and organizations (PJ) through a discriminated union pattern, with shared fields and type-specific attributes.

The core table `partes_contrarias` contains 60 fields that capture comprehensive information about opposing parties. Key identification fields include `tipo_pessoa` (PF/PJ), `nome` (full name or company name), `cpf` (individual taxpayer registry), and `cnpj` (corporate taxpayer registry). These fields have unique constraints to prevent duplicate entries and ensure data integrity.

For individuals (PF), the model includes personal information such as `rg` (identity document), `data_nascimento` (date of birth), `genero` (gender), `estado_civil` (marital status), and `nome_genitora` (mother's name). It also captures detailed PJE-specific data like naturalidade (place of birth), UF de nascimento (state of birth), and país de nascimento (country of birth).

For organizations (PJ), the model includes business-specific information such as `inscricao_estadual` (state registration), `data_abertura` (incorporation date), `orgao_publico` (public agency indicator), and `ramo_atividade` (business sector). It also stores PJE-specific organizational data like `tipo_pessoa_codigo_pje` (PJE type code), `porte_codigo` (size classification), and `ultima_atualizacao_pje` (last PJE update timestamp).

The table includes contact information fields for emails (stored as JSONB array) and multiple phone numbers (mobile, residential, and commercial with separate DDD and number fields). It also maintains an `endereco_id` foreign key linking to the addresses table, enabling comprehensive address management.

Additional fields support system functionality, including `observacoes` (notes), `created_by` (user who created the record), `ativo` (active status), and `dados_anteriores` (previous version of the record for audit purposes). The table has row-level security policies that allow authenticated users to read records and service roles to have full access.

The persistence service in `parte-contraria-persistence.service.ts` implements CRUD operations with proper validation and error handling. It includes functions for creating, updating, and deleting records, as well as specialized search functions by ID, CPF, CNPJ, and name. The service normalizes CPF and CNPJ values by removing formatting characters before storage and comparison.

**Section sources**
- [parte-contraria-persistence.service.ts](file://backend/partes-contrarias/services/persistence/parte-contraria-persistence.service.ts#L1-L800)
- [10_partes_contrarias.sql](file://supabase/schemas/10_partes_contrarias.sql#L1-L139)

## Search Functionality

The Opposing Parties feature implements comprehensive search functionality to help users quickly locate specific records. The search system supports multiple search methods, each optimized for different use cases and performance requirements.

The primary search interface is the global search field in the `PartesContrariasTab` component, which performs a partial match search across multiple fields including name, social name/fantasy name, CPF, and CNPJ. This search uses the PostgreSQL ILIKE operator with wildcards to find records containing the search term anywhere in the specified fields. The search is debounced with a 500ms delay to prevent excessive database queries during typing.

For more targeted searches, the system provides specialized lookup functions through the backend services. The `buscarParteContrariaPorCPF` and `buscarParteContrariaPorCNPJ` functions perform exact matches on the respective document numbers, leveraging unique indexes for optimal performance. These functions normalize the input by removing formatting characters before comparison, allowing users to search with or without formatting.

The `buscarPartesContrariasPorNome` function implements a partial name search using ILIKE with wildcards, returning up to 100 results to prevent performance issues with large result sets. This function is used when users need to find parties by name when they don't know the exact spelling or when multiple parties have similar names.

The filtering system complements the search functionality by allowing users to narrow results based on specific criteria. Users can filter by party type (individual or organization) and situation (active or inactive). These filters are implemented as combobox options that modify the query parameters sent to the backend.

All search operations are designed with performance in mind, utilizing database indexes on key fields such as `tipo_pessoa`, `cpf`, `cnpj`, and `nome`. The pagination system limits the number of records returned in each request, with default page sizes of 50 records that can be adjusted by the user.

**Section sources**
- [partes-contrarias-tab.tsx](file://app/(dashboard)/partes/components/partes-contrarias-tab.tsx#L1-L417)
- [parte-contraria-persistence.service.ts](file://backend/partes-contrarias/services/persistence/parte-contraria-persistence.service.ts#L561-L585)
- [partes-contrarias-toolbar-filters.tsx](file://app/(dashboard)/partes/components/partes-contrarias-toolbar-filters.tsx#L1-L136)

## Client vs. Opposing Party Distinction

The Sinesys application clearly distinguishes between clients and opposing parties through separate data models, UI components, and business logic. This distinction is crucial for maintaining proper legal ethics and avoiding conflicts of interest.

Clients are managed through a separate feature set with their own data model, UI components, and backend services. The client data model focuses on relationship management, billing information, and matter history, while the opposing party model emphasizes identification, contact details, and process relationships. This separation ensures that client confidentiality is maintained and that opposing party information is appropriately categorized.

The application prevents confusion between clients and opposing parties through distinct navigation paths and visual design. The opposing parties feature is accessible through a dedicated menu item, with a UI that emphasizes the adversarial nature of these relationships. The data model includes explicit fields that capture the party's role in specific processes, allowing the system to accurately represent their position in each legal matter.

When a person or organization appears as both a client and an opposing party in different matters, the system treats them as separate entities with distinct records. This approach maintains data integrity and prevents potential conflicts. The application could implement a warning system to alert users when creating an opposing party record for an existing client, helping to prevent ethical violations.

The distinction is also reflected in the permission system, with different access controls for client and opposing party data. This ensures that sensitive client information is protected while allowing appropriate access to opposing party information for case preparation.

**Section sources**
- [partes-contrarias-tab.tsx](file://app/(dashboard)/partes/components/partes-contrarias-tab.tsx#L1-L417)
- [10_partes_contrarias.sql](file://supabase/schemas/10_partes_contrarias.sql#L1-L139)

## Conclusion

The Opposing Parties feature in the Sinesys application provides a comprehensive solution for managing non-client parties in legal processes. The implementation follows modern software architecture principles with a clear separation of concerns between frontend components, backend services, and data persistence layers.

The system effectively handles both individuals and organizations with a flexible data model that captures extensive identification and contact information. The integration with the PJE platform ensures that critical data from the electronic court system is synchronized and available to legal professionals.

Key strengths of the implementation include robust search functionality, comprehensive validation, and proper handling of edge cases such as duplicate records and data integrity constraints. The user interface is designed for efficiency, with features like copy-to-clipboard functionality and debounced search that enhance the user experience.

The clear distinction between clients and opposing parties helps maintain ethical standards and prevents conflicts of interest. The audit trail functionality, with storage of previous data versions, supports compliance and accountability requirements.

Future enhancements could include additional integration with external data sources for party verification, advanced analytics on opposing party patterns, and improved conflict checking between clients and opposing parties across the firm's entire matter portfolio.