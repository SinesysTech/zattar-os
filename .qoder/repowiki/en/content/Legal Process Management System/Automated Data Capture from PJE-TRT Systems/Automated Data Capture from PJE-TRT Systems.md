# Automated Data Capture from PJE-TRT Systems

<cite>
**Referenced Files in This Document**
- [trt-driver.ts](file://src/app/(authenticated)/captura/drivers/pje/trt-driver.ts)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts)
- [trt-capture.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-capture.service.ts)
- [pje-trt.ts](file://src/types/contracts/pje-trt.ts)
- [trt-types.ts](file://src/app/(authenticated)/captura/types/trt-types.ts)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts)
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts)
- [pje-documento-types.ts](file://src/app/(authenticated)/captura/types/pje-documento-types.ts)
- [cadastros-pje-repository.ts](file://src/shared/partes/repositories/cadastros-pje-repository.ts)
- [cadastros-pje-repository.ts](file://src/app/(authenticated)/partes/repositories/cadastros-pje-repository.ts)
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
10. [Appendices](#appendices)

## Introduction
This document describes the automated data capture system that integrates with PJE-TRT legal databases. It covers the authentication architecture, session lifecycle, and end-to-end capture workflows for process movements, audiência schedules, and party information. It also documents error handling, retry mechanisms, data validation, mapping between PJE-TRT data structures and internal Processo entities, and operational guidance for configuration, monitoring, and troubleshooting.

## Project Structure
The capture system is organized around:
- Authentication and session management for PJE-TRT
- Data capture orchestration for multiple domains (audiências, expedientes, timeline, partes)
- Persistence services for timelines, audiências, expedientes, and parties
- Document capture pipeline for pending manifestação documents
- Shared type definitions and repositories for cross-cutting concerns

```mermaid
graph TB
subgraph "Authentication"
AUTH["trt-auth.service.ts"]
DRIVER["trt-driver.ts"]
end
subgraph "Capture Orchestration"
COMB["captura-combinada.service.ts"]
CAPTURE_TYPES["trt-capture.service.ts"]
PJE_TYPES["pje-trt.ts"]
end
subgraph "Persistence"
TIMELINE["timeline persistence"]
PARTES["partes capture"]
AUDIENCIAS["audiencias persistence"]
EXPEDIENTES["pendentes persistence"]
end
subgraph "Documents"
DOC_SERVICE["pje-expediente-documento.service.ts"]
DOC_TYPES["pje-documento-types.ts"]
end
subgraph "Repositories"
CAD_PJE["cadastros-pje-repository.ts"]
end
DRIVER --> AUTH
AUTH --> COMB
CAPTURE_TYPES --> COMB
PJE_TYPES --> COMB
COMB --> TIMELINE
COMB --> PARTES
COMB --> AUDIENCIAS
COMB --> EXPEDIENTES
PARTES --> CAD_PJE
DOC_SERVICE --> EXPEDIENTES
DOC_TYPES --> DOC_SERVICE
```

**Diagram sources**
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L592-L652)
- [trt-driver.ts](file://src/app/(authenticated)/captura/drivers/pje/trt-driver.ts#L33-L81)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L230-L257)
- [trt-capture.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-capture.service.ts#L12-L49)
- [pje-trt.ts:13-172](file://src/types/contracts/pje-trt.ts#L13-L172)
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L218-L297)
- [pje-documento-types.ts](file://src/app/(authenticated)/captura/types/pje-documento-types.ts#L5-L14)
- [cadastros-pje-repository.ts:45-73](file://src/shared/partes/repositories/cadastros-pje-repository.ts#L45-L73)

**Section sources**
- [trt-driver.ts](file://src/app/(authenticated)/captura/drivers/pje/trt-driver.ts#L1-L81)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L592-L652)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L1-L967)
- [trt-capture.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-capture.service.ts#L1-L49)
- [pje-trt.ts:1-379](file://src/types/contracts/pje-trt.ts#L1-L379)
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L1-L298)
- [pje-documento-types.ts](file://src/app/(authenticated)/captura/types/pje-documento-types.ts#L1-L16)
- [cadastros-pje-repository.ts:1-117](file://src/shared/partes/repositories/cadastros-pje-repository.ts#L1-L117)
- [cadastros-pje-repository.ts](file://src/app/(authenticated)/partes/repositories/cadastros-pje-repository.ts#L1-L5)

## Core Components
- Authentication and session management:
  - Anti-detection browser configuration, SSO gov.br login, OTP processing, token extraction, and robust retry logic.
- Capture orchestration:
  - Combined capture workflow spanning audiências, expedientes, and timeline+partes for unique processes.
- Data contracts:
  - Strongly typed PJE-TRT shapes for timelines, audiências, expedientes, and documents.
- Document capture:
  - End-to-end pipeline for fetching pending manifestação documents, validating content, uploading to storage, and updating database records.
- Repositories:
  - Upsert and lookup of PJE entity mappings for clients, parties, third parties, and representatives.

**Section sources**
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L65-L84)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L90-L279)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L592-L652)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L230-L257)
- [pje-trt.ts:13-172](file://src/types/contracts/pje-trt.ts#L13-L172)
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L68-L168)
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L218-L297)
- [cadastros-pje-repository.ts:45-73](file://src/shared/partes/repositories/cadastros-pje-repository.ts#L45-L73)

## Architecture Overview
The system authenticates via SSO gov.br with OTP, maintains a browser session, and executes targeted captures. It consolidates unique process identifiers, enriches with timeline and parties, and persists results to PostgreSQL and storage systems.

```mermaid
sequenceDiagram
participant Orchestrator as "CapturaCombinada"
participant Auth as "trt-auth.service.ts"
participant PJE as "PJE-TRT APIs"
participant Store as "Storage (Backblaze)"
participant DB as "PostgreSQL"
Orchestrator->>Auth : autenticarComRetry(params)
Auth-->>Orchestrator : AuthResult (page, tokens, advogadoInfo)
Orchestrator->>PJE : obterTodasAudiencias(...)
PJE-->>Orchestrator : audiências
Orchestrator->>PJE : obterTodosProcessosPendentesManifestacao(...)
PJE-->>Orchestrator : expedientes
Orchestrator->>PJE : obterPericias(...)
PJE-->>Orchestrator : perícias
Orchestrator->>PJE : buscarDadosComplementaresProcessos(processosIds)
PJE-->>Orchestrator : timeline + partes
Orchestrator->>DB : salvarAudiencias/salvarPendentes/salvarAcervoBatch
Orchestrator->>DB : salvarTimeline
Orchestrator->>DB : persistirPartesProcesso
Orchestrator->>Store : uploadToBackblaze (pendentes)
DB-->>Orchestrator : mapeamentoIds
Orchestrator-->>Orchestrator : resumo e logs
```

**Diagram sources**
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L230-L257)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L659-L677)
- [pje-trt.ts:349-367](file://src/types/contracts/pje-trt.ts#L349-L367)

## Detailed Component Analysis

### Authentication and Session Management
- Anti-detection browser configuration removes automation flags.
- SSO gov.br login with retry on navigation/network errors.
- OTP detection and submission with fallback to next OTP if current fails.
- Token extraction (access_token, XSRF) and JWT decoding to obtain attorney info.
- Robust retry wrapper for authentication failures.

```mermaid
flowchart TD
Start(["Start"]) --> InitBrowser["Initialize Firefox (remote/local)"]
InitBrowser --> Stealth["Apply anti-detection scripts"]
Stealth --> Login["Navigate to SSO login and submit credentials"]
Login --> OTPWait["Wait for OTP field (selector variants)"]
OTPWait --> OTPFill["Get OTP and fill field"]
OTPFill --> SubmitOTP["Submit OTP and validate"]
SubmitOTP --> Redirect["Wait for SSO exit and PJE domain"]
Redirect --> Tokens["Extract access_token and XSRF"]
Tokens --> JWTDecode["Decode JWT to get attorney info"]
JWTDecode --> Done(["Authenticated"])
```

**Diagram sources**
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L65-L84)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L338-L423)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L429-L451)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L579-L652)

**Section sources**
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L65-L84)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L90-L279)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L592-L652)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L659-L677)

### Capture Orchestration and Workflows
- Combined capture executes multiple domains in a single authenticated session:
  - Audiências (designadas, realizadas, canceladas) within specified date ranges.
  - Expedientes (no prazo, sem prazo) with configurable filters.
  - Perícias (first degree only).
  - Timeline and partes enrichment for unique processes, with recapture thresholds and delays.
- Consolidation phase extracts unique process IDs and persists results to PostgreSQL and storage.

```mermaid
flowchart TD
A["Start Combined Capture"] --> Auth["Authenticate"]
Auth --> FetchA["Fetch Audiências (M/F/C)"]
Auth --> FetchE["Fetch Expedientes (N/I)"]
Auth --> FetchP["Fetch Perícias (1º grau)"]
FetchA --> Unique["Extract Unique Process IDs"]
FetchE --> Unique
FetchP --> Unique
Unique --> Enrich["Enrich: Timeline + Partes"]
Enrich --> Persist["Persist to DB and Storage"]
Persist --> Close["Close Browser"]
Close --> End(["Done"])
```

**Diagram sources**
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L230-L257)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L287-L306)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L362-L386)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L422-L434)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L458-L491)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L646-L757)

**Section sources**
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L230-L257)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L287-L306)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L362-L386)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L422-L434)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L458-L491)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L646-L757)

### Data Contracts and Type Definitions
- Timeline items support both documents and movements with distinct fields.
- Audiência entities include process, type, room, and polo details.
- Document metadata and content types define document capture behavior.
- Strong typing ensures consistency across capture and persistence layers.

```mermaid
classDiagram
class TimelineItem {
+number id
+string titulo
+string data
+boolean documento
+number idUsuario
+boolean documentoSigiloso
+boolean documentoApreciavel
+boolean expediente
+number numeroOrdem
+string idUnicoDocumento
+string tipo
+string codigoDocumento
+number idTipo
}
class Audiencia {
+number id
+string dataInicio
+string dataFim
+string status
+number idProcesso
+string nrProcesso
+ProcessoAudiencia processo
+TipoAudiencia tipo
+SalaAudiencia salaAudiencia
+PoloAudiencia poloAtivo
+PoloAudiencia poloPassivo
+PautaAudienciaHorario pautaAudienciaHorario
}
class DocumentoDetalhes {
+number id
+string idUnicoDocumento
+string identificadorUnico
+number idTipoDocumento
+string titulo
+string tipo
+number idTipo
+string codigoTipoDocumento
+string criador
+string signatario
+number idPessoaInclusao
+string criadoEm
+string juntadoEm
+number idProcesso
+boolean sigiloso
+boolean assinado
+boolean apreciado
+string tipoArquivo
+number tamanho
+string md5
}
TimelineItem <.. DocumentoDetalhes : "documentos"
Audiencia --> ProcessoAudiencia : "relates to"
```

**Diagram sources**
- [pje-trt.ts:13-172](file://src/types/contracts/pje-trt.ts#L13-L172)
- [pje-trt.ts:298-367](file://src/types/contracts/pje-trt.ts#L298-L367)
- [pje-trt.ts:69-143](file://src/types/contracts/pje-trt.ts#L69-L143)

**Section sources**
- [pje-trt.ts:13-172](file://src/types/contracts/pje-trt.ts#L13-L172)
- [pje-trt.ts:298-367](file://src/types/contracts/pje-trt.ts#L298-L367)
- [pje-trt.ts:69-143](file://src/types/contracts/pje-trt.ts#L69-L143)

### Document Capture Pipeline (Pending Manifestação)
- Fetch document metadata and validate type.
- Download content (PDF) and convert to base64.
- Upload to Backblaze B2 with generated key and filename.
- Update database record with file metadata.

```mermaid
sequenceDiagram
participant Service as "pje-expediente-documento.service.ts"
participant PJE as "PJE API"
participant Storage as "Backblaze B2"
participant DB as "PostgreSQL"
Service->>PJE : fetchDocumentoMetadata(processoId, documentoId)
PJE-->>Service : DocumentoMetadata
Service->>PJE : fetchDocumentoConteudo(processoId, documentoId)
PJE-->>Service : DocumentoConteudo (PDF base64)
Service->>Storage : uploadToBackblaze(buffer, key)
Storage-->>Service : UploadResult (url, key, bucket)
Service->>DB : atualizarDocumentoPendente(expedienteId, arquivoInfo)
DB-->>Service : OK
Service-->>Service : FetchDocumentoResult
```

**Diagram sources**
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L68-L99)
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L124-L168)
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L218-L297)

**Section sources**
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L68-L168)
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L218-L297)
- [pje-documento-types.ts](file://src/app/(authenticated)/captura/types/pje-documento-types.ts#L5-L14)

### Party Information Capture and Mapping
- Parties are captured per process and persisted with associated Processo IDs.
- Entity-to-PJE ID mapping is maintained via a shared repository supporting multiple systems and tribunals.

```mermaid
flowchart TD
A["Unique Process IDs"] --> B["Fetch Partes per Process"]
B --> C["Persist Partes to DB"]
C --> D["Upsert Cadastro PJE (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau)"]
D --> E["Lookup/Map Entities to PJE IDs"]
```

**Diagram sources**
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L686-L757)
- [cadastros-pje-repository.ts:45-73](file://src/shared/partes/repositories/cadastros-pje-repository.ts#L45-L73)
- [cadastros-pje-repository.ts:78-115](file://src/shared/partes/repositories/cadastros-pje-repository.ts#L78-L115)

**Section sources**
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L686-L757)
- [cadastros-pje-repository.ts:45-73](file://src/shared/partes/repositories/cadastros-pje-repository.ts#L45-L73)
- [cadastros-pje-repository.ts:78-115](file://src/shared/partes/repositories/cadastros-pje-repository.ts#L78-L115)

### Driver Abstraction and Migration Notes
- The PJE TRT driver currently throws “not implemented” due to backend service migrations and is marked for reimplementation using new architecture paths.

**Section sources**
- [trt-driver.ts](file://src/app/(authenticated)/captura/drivers/pje/trt-driver.ts#L33-L81)

## Dependency Analysis
- Authentication depends on browser connection utilities and OTP retrieval.
- Combined capture orchestrator depends on PJE API fetchers, persistence services, and logging.
- Document capture depends on storage upload utilities and persistence updates.
- Repositories depend on Supabase client for upsert and lookup operations.

```mermaid
graph LR
AUTH["trt-auth.service.ts"] --> BROWSER["Browserless/Firefox"]
AUTH --> OTP["getDefaultOTP()"]
COMB["captura-combinada.service.ts"] --> AUTH
COMB --> PJE_API["PJE API Calls"]
COMB --> PERSIST["Persistence Services"]
DOC["pje-expediente-documento.service.ts"] --> STORAGE["Backblaze B2"]
DOC --> PERSIST
CAD["cadastros-pje-repository.ts"] --> SUPABASE["Supabase Client"]
```

**Diagram sources**
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L8-L10)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L185-L187)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L58-L87)
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L37-L39)
- [cadastros-pje-repository.ts](file://src/shared/partes/repositories/cadastros-pje-repository.ts#L6)

**Section sources**
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L8-L10)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L58-L87)
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L37-L39)
- [cadastros-pje-repository.ts](file://src/shared/partes/repositories/cadastros-pje-repository.ts#L6)

## Performance Considerations
- Session reuse across multiple capture domains reduces authentication overhead.
- Batch operations for acervo insertion and timeline persistence minimize round trips.
- Configurable delays between requests and recapture thresholds prevent API saturation.
- Anti-detection measures reduce timeouts and retries caused by automation detection.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and remedies:
- OTP field not found or invalid:
  - Verify OTP selectors and availability; the system attempts a fallback OTP if configured.
- SSO redirection timeout:
  - Ensure target host is reachable and network conditions are stable; the system waits for domain transitions.
- Missing access_token cookie:
  - Confirm successful login and JWT decoding; the system retries cookie acquisition.
- Document capture failures:
  - Validate PDF type, handle base64 conversion errors, and confirm storage upload success.
- Party capture errors:
  - Check process-to-acervo mapping and tribunal/grau configuration before persisting parties.

**Section sources**
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L164-L178)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L281-L332)
- [trt-auth.service.ts](file://src/app/(authenticated)/captura/services/trt/trt-auth.service.ts#L439-L450)
- [pje-expediente-documento.service.ts](file://src/app/(authenticated)/captura/services/pje/pje-expediente-documento.service.ts#L231-L235)
- [captura-combinada.service.ts](file://src/app/(authenticated)/captura/services/trt/captura-combinada.service.ts#L693-L697)

## Conclusion
The system provides a robust, session-reuse-based capture pipeline for PJE-TRT with strong typing, anti-detection, and resilient retry logic. It supports combined capture across audiências, expedientes, and enriched timeline+partes, with dedicated document capture for pending manifestação and entity-to-PJE ID mapping via repositories.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Practical Examples

- Combined capture configuration:
  - Use the combined capture service with credential and config parameters to execute audiências, expedientes, and perícias in a single authenticated session.

- Monitoring capture progress:
  - Inspect logs emitted during each phase and review the consolidated result object for totals, skipped processes, and persistence outcomes.

- Troubleshooting integration issues:
  - Review OTP handling, SSO exit timing, and cookie presence; validate document type and storage upload; confirm tribunal/grau and mapping IDs before persisting parties.

[No sources needed since this section provides general guidance]