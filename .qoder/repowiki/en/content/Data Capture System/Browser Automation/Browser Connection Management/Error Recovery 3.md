# Error Recovery

<cite>
**Referenced Files in This Document**   
- [browser-connection.service.ts](file://backend/captura/services/browser/browser-connection.service.ts)
- [trt-auth.service.ts](file://backend/captura/services/trt/trt-auth.service.ts)
- [captura-recovery.service.ts](file://backend/captura/services/recovery/captura-recovery.service.ts)
- [recovery-analysis.service.ts](file://backend/captura/services/recovery/recovery-analysis.service.ts)
- [credential.service.ts](file://backend/captura/credentials/credential.service.ts)
- [agendamento-scheduler.service.ts](file://backend/captura/services/scheduler/agendamento-scheduler.service.ts)
- [types.ts](file://backend/captura/services/recovery/types.ts)
- [errors.ts](file://backend/captura/services/partes/errors.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Error Detection and Classification](#error-detection-and-classification)
3. [Browser Connection Management](#browser-connection-management)
4. [Authentication and Credential Recovery](#authentication-and-credential-recovery)
5. [Retry Strategies and Exponential Backoff](#retry-strategies-and-exponential-backoff)
6. [Data Recovery and Gap Analysis](#data-recovery-and-gap-analysis)
7. [Scheduler Integration and Health Monitoring](#scheduler-integration-and-health-monitoring)
8. [Common Failure Scenarios and Solutions](#common-failure-scenarios-and-solutions)
9. [Conclusion](#conclusion)

## Introduction
The Sinesys browser connection management system implements a comprehensive error recovery framework for PJE-TRT data capture operations. This system ensures reliable data extraction from the PJE-TRT platform by handling various failure scenarios including network interruptions, authentication failures, and browser crashes. The recovery mechanisms are designed to maintain data integrity, prevent data loss, and ensure continuous operation through sophisticated retry strategies, credential management, and gap analysis. This document details the implementation of these error recovery mechanisms, focusing on how the system detects, handles, and recovers from connection failures during data capture operations.

**Section sources**
- [browser-connection.service.ts](file://backend/captura/services/browser/browser-connection.service.ts#L1-L274)
- [trt-auth.service.ts](file://backend/captura/services/trt/trt-auth.service.ts#L1-L603)

## Error Detection and Classification
The error recovery system in Sinesys employs a structured approach to error detection and classification, using custom error classes to differentiate between various failure types. The system implements a hierarchy of error types that enables precise error handling and appropriate recovery strategies.

The core error classification system is implemented through the `CapturaPartesError` base class and its specialized subclasses. This inheritance hierarchy allows for granular error handling based on the specific nature of the failure. The system distinguishes between validation errors, persistence errors, API errors, lock errors, timeout errors, and configuration errors, each with specific context information that aids in diagnosis and recovery.

```mermaid
classDiagram
class CapturaPartesError {
+string code
+string message
+Record<string, unknown> context
+toJSON() object
}
class ValidationError {
+string message
+Record<string, unknown> context
}
class PersistenceError {
+string message
+'insert' | 'update' | 'delete' | 'upsert' operation
+'cliente' | 'parte_contraria' | 'terceiro' | 'representante' | 'endereco' | 'vinculo' entity
+Record<string, unknown> context
}
class PJEAPIError {
+string message
+number statusCode
+Record<string, unknown> context
}
class LockError {
+string message
+string lockKey
+Record<string, unknown> context
}
class TimeoutError {
+string message
+number timeoutMs
+Record<string, unknown> context
}
class ConfigurationError {
+string message
+Record<string, unknown> context
}
CapturaPartesError <|-- ValidationError
CapturaPartesError <|-- PersistenceError
CapturaPartesError <|-- PJEAPIError
CapturaPartesError <|-- LockError
CapturaPartesError <|-- TimeoutError
CapturaPartesError <|-- ConfigurationError
note right of CapturaPartesError
Base error class for all capture operations
Provides structured error information
Includes code, message, context, and stack trace
end note
```

**Diagram sources **
- [errors.ts](file://backend/captura/services/partes/errors.ts#L9-L102)

**Section sources**
- [errors.ts](file://backend/captura/services/partes/errors.ts#L1-L139)

## Browser Connection Management
The browser connection management system in Sinesys implements a resilient connection strategy with automatic fallback mechanisms to ensure continuous operation during PJE-TRT data capture. The system supports two connection modes: remote Firefox via WebSocket and local Firefox as a fallback.

The connection process begins with an attempt to connect to a remote browser server. If this fails, the system automatically falls back to launching a local browser instance. This dual-mode approach ensures high availability and reliability, as the system can continue operations even if the remote browser service becomes unavailable.

```mermaid
sequenceDiagram
participant Client as "Capture Service"
participant Remote as "Remote Browser Server"
participant Local as "Local Browser"
Client->>Remote : Attempt connection to BROWSER_WS_ENDPOINT
alt Connection successful
Remote-->>Client : WebSocket connection established
Client->>Client : Initialize browser context and page
Client->>Client : Return browser connection
else Connection failed
Remote-->>Client : Connection error
Client->>Client : Log error and attempt fallback
Client->>Local : Launch local Firefox instance
Local-->>Client : Browser launched
Client->>Client : Initialize browser context and page
Client->>Client : Return browser connection
end
note right of Client
Automatic fallback ensures continuous operation
Remote connection preferred for production
Local browser used as backup
end note
```

**Diagram sources **
- [browser-connection.service.ts](file://backend/captura/services/browser/browser-connection.service.ts#L75-L184)

**Section sources**
- [browser-connection.service.ts](file://backend/captura/services/browser/browser-connection.service.ts#L1-L274)

## Authentication and Credential Recovery
The authentication system in Sinesys implements a robust recovery mechanism for handling authentication failures during PJE-TRT data capture. The system uses a multi-step authentication process that includes OTP (One-Time Password) handling with retry capabilities.

When authentication fails due to an invalid OTP, the system automatically attempts recovery using the next OTP in sequence. This prevents failed authentications due to timing issues with OTP generation. The system also implements distributed locks to prevent credential conflicts when multiple processes attempt to use the same credentials simultaneously.

```mermaid
sequenceDiagram
participant Service as "Authentication Service"
participant SSO as "SSO Provider"
participant 2FAuth as "2FAuth Service"
Service->>SSO : Navigate to login page
SSO-->>Service : Login form
Service->>SSO : Submit credentials (CPF and password)
SSO->>Service : Request OTP
Service->>2FAuth : Request current OTP
2FAuth-->>Service : Current OTP code
Service->>SSO : Submit OTP
alt OTP accepted
SSO-->>Service : Authentication successful
Service->>Service : Extract JWT tokens
Service->>Service : Return authenticated session
else OTP rejected
SSO-->>Service : OTP invalid error
Service->>2FAuth : Request next OTP
2FAuth-->>Service : Next OTP code
Service->>SSO : Submit next OTP
SSO-->>Service : Authentication successful
Service->>Service : Extract JWT tokens
Service->>Service : Return authenticated session
end
note right of Service
Automatic OTP retry prevents authentication failures
Uses current and next OTP codes from 2FAuth
Ensures successful authentication even with timing issues
end note
```

**Diagram sources **
- [trt-auth.service.ts](file://backend/captura/services/trt/trt-auth.service.ts#L89-L217)

**Section sources**
- [trt-auth.service.ts](file://backend/captura/services/trt/trt-auth.service.ts#L1-L603)
- [credential.service.ts](file://backend/captura/credentials/credential.service.ts#L1-L401)

## Retry Strategies and Exponential Backoff
The Sinesys system implements sophisticated retry strategies with exponential backoff to handle transient failures during PJE-TRT data capture operations. The retry mechanism is designed to balance between aggressive recovery attempts and system stability, preventing issues like infinite retry loops and credential lockouts.

The system uses a combination of retry limits, circuit breakers, and health-based routing to manage retry operations effectively. When a connection or authentication failure occurs, the system implements exponential backoff with jitter to prevent thundering herd problems. The retry strategy also incorporates circuit breaker patterns to temporarily halt operations when a service is detected as unhealthy.

```mermaid
flowchart TD
Start([Operation Start]) --> Attempt["Execute Operation"]
Attempt --> CheckSuccess{"Operation Successful?"}
CheckSuccess --> |Yes| Success["Operation Completed"]
CheckSuccess --> |No| CheckRetry{"Retry Limit Reached?"}
CheckRetry --> |Yes| Fail["Operation Failed"]
CheckRetry --> |No| CheckCircuit{"Circuit Breaker Open?"}
CheckCircuit --> |Yes| Wait["Wait for Circuit Reset"]
Wait --> Attempt
CheckCircuit --> |No| CalculateBackoff["Calculate Exponential Backoff"]
CalculateBackoff --> ApplyJitter["Apply Random Jitter"]
ApplyJitter --> WaitBackoff["Wait Backoff Period"]
WaitBackoff --> Attempt
Success --> End([Operation End])
Fail --> End
note right of CalculateBackoff
Backoff = base * 2^attempt
Prevents overwhelming the server
end note
note right of ApplyJitter
Adds randomness to backoff
Prevents synchronized retries
end note
```

**Diagram sources **
- [agendamento-scheduler.service.ts](file://backend/captura/services/scheduler/agendamento-scheduler.service.ts#L10-L43)

**Section sources**
- [agendamento-scheduler.service.ts](file://backend/captura/services/scheduler/agendamento-scheduler.service.ts#L1-L43)

## Data Recovery and Gap Analysis
The data recovery system in Sinesys implements comprehensive gap analysis to identify and recover missing data elements from PJE-TRT captures. The system stores raw capture data in MongoDB, allowing for reprocessing when data persistence failures occur.

The recovery process involves analyzing the raw capture logs to identify gaps between the captured data and the data persisted in the PostgreSQL database. The system can then selectively reprocess only the missing elements, minimizing the impact on system resources. This approach ensures data integrity and completeness without requiring full re-capture of entire datasets.

```mermaid
classDiagram
class AnaliseCaptura {
+string mongoId
+number capturaLogId
+TipoCaptura tipoCaptura
+Date dataCaptura
+StatusCapturaRaw status
+ProcessoRecovery processo
+TotaisAnalise totais
+GapsAnalise gaps
+boolean payloadDisponivel
+string erroOriginal
}
class ProcessoRecovery {
+number | null id
+number idPje
+string numeroProcesso
+CodigoTRT trt
+GrauTRT grau
}
class TotaisAnalise {
+number partes
+number partesPersistidas
+number enderecosEsperados
+number enderecosPersistidos
+number representantes
+number representantesPersistidos
}
class GapsAnalise {
+ElementoRecuperavel[] enderecosFaltantes
+ElementoRecuperavel[] partesFaltantes
+ElementoRecuperavel[] representantesFaltantes
}
class ElementoRecuperavel {
+TipoEntidadeRecuperavel tipo
+string identificador
+string nome
+Record<string, unknown> dadosBrutos
+StatusPersistencia statusPersistencia
+string erro
+Record<string, unknown> contexto
}
AnaliseCaptura --> ProcessoRecovery : "has"
AnaliseCaptura --> TotaisAnalise : "has"
AnaliseCaptura --> GapsAnalise : "has"
GapsAnalise --> ElementoRecuperavel : "contains"
note right of AnaliseCaptura
Main analysis result class
Contains all information about a capture
Used for gap identification and recovery
end note
```

**Diagram sources **
- [types.ts](file://backend/captura/services/recovery/types.ts#L98-L169)

**Section sources**
- [captura-recovery.service.ts](file://backend/captura/services/recovery/captura-recovery.service.ts#L1-L395)
- [recovery-analysis.service.ts](file://backend/captura/services/recovery/recovery-analysis.service.ts#L1-L800)
- [types.ts](file://backend/captura/services/recovery/types.ts#L1-L571)

## Scheduler Integration and Health Monitoring
The scheduler integration in Sinesys ensures that error recovery operations are coordinated and monitored for system health. The scheduler service periodically checks for pending capture operations and executes them, handling any errors that occur during execution.

The system implements health monitoring through the `checkBrowserServiceHealth` function, which verifies the availability of the remote browser service. This allows the system to make informed decisions about connection strategies and to alert administrators when services become unavailable. The scheduler also implements error isolation, ensuring that failures in one capture operation do not affect others.

```mermaid
sequenceDiagram
participant Scheduler as "Scheduler Service"
participant Health as "Health Monitor"
participant Capture as "Capture Service"
participant Browser as "Browser Connection"
Scheduler->>Scheduler : Execute scheduler loop
Scheduler->>Health : Check browser service health
Health-->>Scheduler : Health status
alt Service healthy
Scheduler->>Capture : Execute pending captures
Capture->>Browser : Get browser connection
alt Connection successful
Browser-->>Capture : Browser connection
Capture->>Capture : Execute capture
Capture-->>Scheduler : Success
else Connection failed
Browser-->>Capture : Connection error
Capture->>Capture : Fallback to local browser
Capture-->>Scheduler : Success with fallback
end
else Service unhealthy
Scheduler->>Scheduler : Log health warning
Scheduler->>Capture : Execute captures with local browser
Capture-->>Scheduler : Success with local browser
end
Scheduler->>Scheduler : Continue to next capture
Scheduler->>Scheduler : Log execution results
note right of Scheduler
Health monitoring informs connection decisions
Errors in one capture don't affect others
Fallback mechanisms ensure continuity
end note
```

**Diagram sources **
- [agendamento-scheduler.service.ts](file://backend/captura/services/scheduler/agendamento-scheduler.service.ts#L10-L37)

**Section sources**
- [agendamento-scheduler.service.ts](file://backend/captura/services/scheduler/agendamento-scheduler.service.ts#L1-L43)
- [browser-connection.service.ts](file://backend/captura/services/browser/browser-connection.service.ts#L218-L261)

## Common Failure Scenarios and Solutions
The Sinesys system addresses several common failure scenarios in PJE-TRT data capture operations through targeted solutions. These solutions prevent issues like infinite retry loops, credential lockouts, and cascading failures that could impact system stability.

For infinite retry loops, the system implements retry limits and circuit breakers that temporarily halt operations when a service is detected as unhealthy. This prevents the system from continuously attempting operations that are unlikely to succeed, conserving resources and preventing further issues.

To prevent credential lockouts, the system uses distributed locks when accessing credentials and implements OTP retry logic that uses both the current and next OTP codes. This ensures successful authentication even when timing issues occur with OTP generation.

For cascading failures, the system implements error isolation through the scheduler, ensuring that failures in one capture operation do not affect others. The system also uses health-based routing to direct operations to healthy services, preventing overwhelmed services from receiving additional load.

```mermaid
flowchart TD
A[Failure Detected] --> B{Failure Type}
B --> |Connection| C["Apply Exponential Backoff<br/>with Jitter"]
B --> |Authentication| D["Use Next OTP Code<br/>Rotate Credentials"]
B --> |Persistence| E["Check Data Integrity<br/>Reprocess Missing Elements"]
C --> F{Retry Limit Reached?}
D --> F
E --> F
F --> |No| G["Wait Backoff Period"]
G --> H["Retry Operation"]
F --> |Yes| I{Circuit Breaker Tripped?}
I --> |No| J["Open Circuit Breaker"]
J --> K["Wait Reset Period"]
K --> L["Resume Operations"]
I --> |Yes| M["Wait for Manual Reset<br/>or Automatic Recovery"]
M --> L
note right of C
Prevents overwhelming the server
Random jitter prevents synchronized retries
end note
note right of D
Prevents credential lockouts
OTP rotation handles timing issues
end note
note right of E
Ensures data integrity
Selective reprocessing minimizes load
end note
```

**Section sources**
- [browser-connection.service.ts](file://backend/captura/services/browser/browser-connection.service.ts#L177-L184)
- [trt-auth.service.ts](file://backend/captura/services/trt/trt-auth.service.ts#L189-L210)
- [agendamento-scheduler.service.ts](file://backend/captura/services/scheduler/agendamento-scheduler.service.ts#L30-L33)

## Conclusion
The error recovery mechanisms in the Sinesys browser connection management system provide a robust framework for handling failures during PJE-TRT data capture operations. The system implements comprehensive error detection, classification, and recovery strategies that ensure data integrity and system reliability.

Key components of the recovery system include browser connection management with automatic fallback, authentication with OTP retry capabilities, sophisticated retry strategies with exponential backoff, and comprehensive data recovery through gap analysis. The integration with the scheduler service ensures coordinated execution and health monitoring, while solutions for common failure scenarios prevent issues like infinite retry loops, credential lockouts, and cascading failures.

This multi-layered approach to error recovery enables the Sinesys system to maintain high availability and data integrity, even in the face of network interruptions, authentication failures, and browser crashes. The system's design prioritizes resilience and reliability, ensuring continuous operation and accurate data capture from the PJE-TRT platform.