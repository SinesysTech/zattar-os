# Data Access Patterns

<cite>
**Referenced Files in This Document**   
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)
- [server-client.ts](file://backend/utils/supabase/server-client.ts)
- [service-client.ts](file://backend/utils/supabase/service-client.ts)
- [client.ts](file://backend/utils/mongodb/client.ts)
- [collections.ts](file://backend/utils/mongodb/collections.ts)
- [index.ts](file://types/domain/index.ts)
- [index.ts](file://types/contracts/index.ts)
- [cache-utils.ts](file://backend/utils/redis/cache-utils.ts)
- [cache-keys.ts](file://backend/utils/redis/cache-keys.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive documentation for the Sinesys data access patterns and persistence layer implementation. It details how the repository pattern is implemented in backend services to abstract database interactions from business logic, covering both PostgreSQL (via Supabase) and MongoDB operations. The documentation explains the separation between domain models and data transfer objects, connection management, query construction, transaction handling, and error handling strategies.

## Project Structure
The Sinesys application follows a modular architecture with clear separation between frontend, backend, and shared components. The backend persistence layer is organized under the `backend` directory with services grouped by domain (acervo, usuarios, audiencias, etc.). Each service contains a `persistence` subdirectory housing data access logic. The application uses Supabase for PostgreSQL operations (relational data) and MongoDB for timeline data (document-based storage).

```mermaid
graph TB
subgraph "Frontend"
A[Next.js App Router]
B[React Components]
C[Client-side Logic]
end
subgraph "Backend"
D[API Routes]
E[Services]
F[Persistence Layer]
end
subgraph "Data Storage"
G[Supabase/PostgreSQL]
H[MongoDB]
I[Redis Cache]
end
A --> D
D --> E
E --> F
F --> G
F --> H
F --> I
```

**Diagram sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)
- [client.ts](file://backend/utils/mongodb/client.ts)

**Section sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)

## Core Components
The core components of the data access layer include the repository pattern implementation in persistence services, the Supabase client for PostgreSQL operations, the MongoDB client for timeline data, and the Redis-based caching system. These components work together to provide a robust data access layer that abstracts database interactions from business logic while maintaining data consistency and enforcing business rules.

**Section sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)
- [service-client.ts](file://backend/utils/supabase/service-client.ts)
- [client.ts](file://backend/utils/mongodb/client.ts)

## Architecture Overview
The data access architecture in Sinesys follows a layered approach with clear separation of concerns. The persistence layer sits between business logic services and database clients, implementing the repository pattern to abstract data access operations. The system uses Supabase for relational data (PostgreSQL) and MongoDB for timeline data, with Redis providing caching capabilities to improve performance.

```mermaid
graph TD
A[Business Logic] --> B[Persistence Layer]
B --> C[Supabase Client]
B --> D[MongoDB Client]
B --> E[Redis Cache]
C --> F[PostgreSQL Database]
D --> G[MongoDB Database]
E --> H[In-Memory Cache]
classDef layer fill:#f9f,stroke:#333;
class A,B,C,D,E layer;
```

**Diagram sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)
- [service-client.ts](file://backend/utils/supabase/service-client.ts)
- [client.ts](file://backend/utils/mongodb/client.ts)

## Detailed Component Analysis

### Repository Pattern Implementation
The repository pattern is implemented in various persistence services throughout the backend, with `acervo-persistence.service.ts` and `usuario-persistence.service.ts` serving as primary examples. These services abstract database interactions from business logic, providing a clean interface for data access operations.

```mermaid
classDiagram
class AcervoPersistence {
+salvarAcervo(params) SalvarAcervoResult
+buscarProcessoNoAcervo(id, trt, grau, numero) {id} | null
}
class UsuarioPersistence {
+criarUsuario(params) OperacaoUsuarioResult
+atualizarUsuario(id, params) OperacaoUsuarioResult
+buscarUsuarioPorId(id) Usuario | null
+buscarUsuarioPorCpf(cpf) Usuario | null
+buscarUsuarioPorEmail(email) Usuario | null
+listarUsuarios(params) ListarUsuariosResult
}
class SupabaseClient {
+from(table) QueryBuilder
+insert(data) Promise
+update(data) Promise
+select() Promise
+eq(column, value) QueryBuilder
}
class MongoDBClient {
+getMongoClient() Promise~MongoClient~
+getMongoDatabase() Promise~Db~
+closeMongoConnection() Promise
+testMongoConnection() Promise~boolean~
}
AcervoPersistence --> SupabaseClient : "uses"
UsuarioPersistence --> SupabaseClient : "uses"
UsuarioPersistence --> MongoDBClient : "uses"
```

**Diagram sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)
- [service-client.ts](file://backend/utils/supabase/service-client.ts)
- [client.ts](file://backend/utils/mongodb/client.ts)

**Section sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)

### Domain Models and Data Transfer Objects
The system maintains a clear separation between domain models (business entities) and data transfer objects (DTOs) used for data persistence. Domain models are defined in `types/domain/` while DTOs are defined in `types/contracts/`. This separation allows for independent evolution of business logic and data storage schemas.

```mermaid
classDiagram
class DomainModel {
+id : number
+name : string
+createdAt : Date
+updatedAt : Date
}
class DTO {
+id : number
+name : string
+created_at : string
+updated_at : string
}
DomainModel --> DTO : "maps to"
DTO --> DomainModel : "maps from"
```

**Diagram sources**
- [index.ts](file://types/domain/index.ts)
- [index.ts](file://types/contracts/index.ts)

**Section sources**
- [index.ts](file://types/domain/index.ts)
- [index.ts](file://types/contracts/index.ts)

### Supabase Client for PostgreSQL Operations
The Supabase client is used for all PostgreSQL operations, with two distinct client types: a service client for administrative operations that bypass Row Level Security (RLS), and a server client for authenticated user operations. The service client uses a secret key for administrative access, while the server client uses publishable keys with cookie-based authentication.

```mermaid
sequenceDiagram
participant Service as "Service Logic"
participant ServiceClient as "createServiceClient()"
participant Supabase as "Supabase"
Service->>ServiceClient : createServiceClient()
ServiceClient-->>Service : Supabase Client
Service->>ServiceClient : insert/update/select
ServiceClient->>Supabase : Execute with secret key
Supabase-->>ServiceClient : Result
ServiceClient-->>Service : Return result
```

**Diagram sources**
- [service-client.ts](file://backend/utils/supabase/service-client.ts)
- [server-client.ts](file://backend/utils/supabase/server-client.ts)

**Section sources**
- [service-client.ts](file://backend/utils/supabase/service-client.ts)
- [server-client.ts](file://backend/utils/supabase/server-client.ts)

### MongoDB Client for Timeline Data
The MongoDB client implements a singleton pattern to maintain a single connection pool across the application. It provides methods for obtaining a database connection, testing connectivity, and closing the connection gracefully. The client is configured with connection pooling parameters to optimize performance in serverless environments.

```mermaid
classDiagram
class MongoDBClient {
-client : MongoClient
-clientPromise : Promise~MongoClient~
+getMongoClient() Promise~MongoClient~
+getMongoDatabase() Promise~Db~
+closeMongoConnection() Promise
+testMongoConnection() Promise~boolean~
}
class ConnectionConfig {
+maxPoolSize : 10
+minPoolSize : 2
+maxIdleTimeMS : 60000
}
MongoDBClient --> ConnectionConfig : "uses"
```

**Diagram sources**
- [client.ts](file://backend/utils/mongodb/client.ts)
- [collections.ts](file://backend/utils/mongodb/collections.ts)

**Section sources**
- [client.ts](file://backend/utils/mongodb/client.ts)
- [collections.ts](file://backend/utils/mongodb/collections.ts)

### Transaction Handling and Batch Operations
The data access layer implements transaction handling and batch operations through Supabase's query builder and PostgreSQL's transaction capabilities. The `salvarAcervo` function in `acervo-persistence.service.ts` demonstrates batch processing with individual transaction handling for each record, ensuring data consistency while providing detailed results for each operation.

```mermaid
flowchart TD
Start([Start Batch Operation]) --> ValidateInput["Validate Input Parameters"]
ValidateInput --> InputValid{"Input Valid?"}
InputValid --> |No| ReturnError["Return Error Response"]
InputValid --> |Yes| ProcessRecords["Process Each Record"]
ProcessRecords --> CheckExistence["Check if Record Exists"]
CheckExistence --> RecordExists{"Record Exists?"}
RecordExists --> |No| InsertRecord["Insert New Record"]
RecordExists --> |Yes| CompareData["Compare Data"]
CompareData --> DataChanged{"Data Changed?"}
DataChanged --> |No| SkipUpdate["Skip Update"]
DataChanged --> |Yes| UpdateRecord["Update Record"]
InsertRecord --> TrackResult["Track Insert Result"]
UpdateRecord --> TrackResult
SkipUpdate --> TrackResult
TrackResult --> NextRecord["Next Record?"]
NextRecord --> |Yes| ProcessRecords
NextRecord --> |No| ReturnResults["Return Results"]
ReturnResults --> End([End])
ReturnError --> End
```

**Diagram sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)

**Section sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)

### Error Handling Strategies
The data access layer implements comprehensive error handling strategies, including specific error codes for different scenarios (e.g., 'PGRST116' for record not found), detailed error logging, and graceful error recovery. The services use try-catch blocks to handle exceptions and provide meaningful error messages to calling functions.

```mermaid
flowchart TD
Start([Function Entry]) --> TryBlock["Try Block"]
TryBlock --> DatabaseOperation["Database Operation"]
DatabaseOperation --> ErrorOccurred{"Error Occurred?"}
ErrorOccurred --> |No| ReturnSuccess["Return Success"]
ErrorOccurred --> |Yes| CatchBlock["Catch Block"]
CatchBlock --> ErrorType{"Error Type?"}
ErrorType --> |PGRST116| HandleNotFound["Handle Not Found"]
ErrorType --> |Other| LogError["Log Error Details"]
HandleNotFound --> ReturnNull["Return Null"]
LogError --> ReturnError["Return Error Response"]
ReturnNull --> End([Function Exit])
ReturnError --> End
ReturnSuccess --> End
```

**Diagram sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)

**Section sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)

### Complex Queries with Filtering, Sorting, and Pagination
The data access layer supports complex queries with filtering, sorting, and pagination capabilities. The `listarUsuarios` function in `usuario-persistence.service.ts` demonstrates these capabilities, allowing filtering by multiple criteria, sorting by creation date, and paginated results with total count.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Service as "UsuarioPersistence"
participant Supabase as "Supabase"
Client->>Service : listarUsuarios(params)
Service->>Supabase : Build Query
Supabase-->>Service : Apply Filters
Service->>Supabase : Apply Sorting
Service->>Supabase : Apply Pagination
Supabase-->>Service : Execute Query
Service->>Service : Process Results
Service-->>Client : Return Results with Metadata
```

**Diagram sources**
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)

**Section sources**
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)

## Dependency Analysis
The data access layer has well-defined dependencies between components, with clear separation between database clients, persistence services, and business logic. The Supabase and MongoDB clients are used by multiple persistence services, creating a shared dependency on these database access layers.

```mermaid
graph TD
A[acervo-persistence.service.ts] --> B[Supabase Client]
C[usuario-persistence.service.ts] --> B[Supabase Client]
C --> D[MongoDB Client]
E[other-persistence.service.ts] --> B[Supabase Client]
B --> F[PostgreSQL]
D --> G[MongoDB]
C --> H[Redis Cache]
style A fill:#e6f3ff,stroke:#333
style C fill:#e6f3ff,stroke:#333
style B fill:#fff2cc,stroke:#333
style D fill:#fff2cc,stroke:#333
style H fill:#d9ead3,stroke:#333
```

**Diagram sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)
- [service-client.ts](file://backend/utils/supabase/service-client.ts)
- [client.ts](file://backend/utils/mongodb/client.ts)
- [cache-utils.ts](file://backend/utils/redis/cache-utils.ts)

**Section sources**
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)

## Performance Considerations
The data access layer incorporates several performance optimization strategies, including connection pooling, query optimization, and caching. The MongoDB client uses connection pooling with configurable parameters (maxPoolSize, minPoolSize, maxIdleTimeMS) to optimize database connections. The Redis-based caching system reduces database load by caching frequently accessed data with appropriate TTL values.

```mermaid
graph TD
A[Performance Considerations] --> B[Connection Pooling]
A --> C[Query Optimization]
A --> D[Caching Strategy]
A --> E[Batch Operations]
B --> F["MongoDB: maxPoolSize=10, minPoolSize=2"]
B --> G["Supabase: Connection reuse"]
C --> H["Index usage"]
C --> I["Efficient query construction"]
D --> J["Redis cache with TTL"]
D --> K["Cache invalidation on update"]
E --> L["Batch processing with individual transactions"]
E --> M["Progressive result tracking"]
```

**Diagram sources**
- [client.ts](file://backend/utils/mongodb/client.ts)
- [cache-utils.ts](file://backend/utils/redis/cache-utils.ts)
- [cache-keys.ts](file://backend/utils/redis/cache-keys.ts)
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)

**Section sources**
- [client.ts](file://backend/utils/mongodb/client.ts)
- [cache-utils.ts](file://backend/utils/redis/cache-utils.ts)
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)

## Troubleshooting Guide
When troubleshooting data access issues in Sinesys, consider the following common scenarios and their solutions:

1. **Database Connection Issues**: Verify environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, MONGODB_URL, MONGODB_DATABASE) are correctly set. Use the `testMongoConnection()` function to verify MongoDB connectivity.

2. **Authentication/Authorization Errors**: Ensure the correct Supabase client is being used (service client for administrative operations, server client for user operations). Verify RLS (Row Level Security) policies are correctly configured.

3. **Caching Issues**: Check Redis connection and configuration. Use cache invalidation functions when data is updated to ensure consistency between cache and database.

4. **Query Performance Problems**: Verify appropriate indexes exist on frequently queried fields. Monitor query execution time and optimize as needed.

5. **Data Consistency Issues**: Ensure transaction handling is properly implemented, especially for batch operations. Verify that business rules are enforced at the persistence layer.

**Section sources**
- [service-client.ts](file://backend/utils/supabase/service-client.ts)
- [client.ts](file://backend/utils/mongodb/client.ts)
- [cache-utils.ts](file://backend/utils/redis/cache-utils.ts)
- [acervo-persistence.service.ts](file://backend/captura/services/persistence/acervo-persistence.service.ts)

## Conclusion
The Sinesys data access layer implements a robust and scalable architecture using the repository pattern to abstract database interactions from business logic. By leveraging Supabase for PostgreSQL operations and MongoDB for timeline data, the system can handle both relational and document-based data efficiently. The clear separation between domain models and DTOs, combined with comprehensive error handling and performance optimizations, ensures data consistency and system reliability. The implementation demonstrates best practices in data access patterns, providing a solid foundation for the application's data management needs.