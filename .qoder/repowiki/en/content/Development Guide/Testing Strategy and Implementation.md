# Testing Strategy and Implementation

<cite>
**Referenced Files in This Document**
- [jest.config.js](file://jest.config.js)
- [playwright.config.ts](file://playwright.config.ts)
- [src/testing/INTEGRATION_TESTING_GUIDE.md](file://src/testing/INTEGRATION_TESTING_GUIDE.md)
- [src/testing/setup.ts](file://src/testing/setup.ts)
- [src/testing/integration-helpers.ts](file://src/testing/integration-helpers.ts)
- [src/testing/supabase-test-helpers.ts](file://src/testing/supabase-test-helpers.ts)
- [src/__mocks__/jest-dom-setup.ts](file://src/__mocks__/jest-dom-setup.ts)
- [src/__mocks__/env-setup.js](file://src/__mocks__/env-setup.js)
- [src/testing/factories.ts](file://src/testing/factories.ts)
- [src/app/__tests__/layout.test.tsx](file://src/app/__tests__/layout.test.tsx)
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
This document defines the testing strategy and implementation for ZattarOS across unit, integration, and end-to-end (E2E) testing. It explains the Jest configuration, test file organization, and testing patterns used in the codebase. It also covers component testing with React Testing Library, server action testing, database testing approaches, Playwright configuration for E2E testing, test data management, and mocking strategies. Practical examples are provided via file references to guide writing tests for different component types, testing asynchronous operations, and validating real-time features. Finally, it documents best practices, coverage expectations, and CI testing workflows.

## Project Structure
Testing in ZattarOS is organized around three layers:
- Unit and component tests: Jest with dual environments (Node and jsdom) for server-side and client-side logic.
- Integration tests: Feature-focused flows with mocked external services and Supabase client.
- E2E tests: Playwright-driven browser automation across multiple devices/browsers.

```mermaid
graph TB
subgraph "Unit & Component Tests (Jest)"
JCFG["Jest Config<br/>jest.config.js"]
SETUP["Global Setup<br/>src/testing/setup.ts"]
JDOM["DOM Globals Setup<br/>src/__mocks__/jest-dom-setup.ts"]
ENV["Env Defaults<br/>src/__mocks__/env-setup.js"]
end
subgraph "Integration Tests"
IG["Guide<br/>src/testing/INTEGRATION_TESTING_GUIDE.md"]
IH["Helpers<br/>src/testing/integration-helpers.ts"]
SH["Supabase Helpers<br/>src/testing/supabase-test-helpers.ts"]
FAC["Factories<br/>src/testing/factories.ts"]
end
subgraph "E2E Tests (Playwright)"
PCFG["Playwright Config<br/>playwright.config.ts"]
end
JCFG --> SETUP
SETUP --> JDOM
SETUP --> ENV
IG --> IH
IG --> SH
IG --> FAC
PCFG --> JCFG
```

**Diagram sources**
- [jest.config.js:1-119](file://jest.config.js#L1-L119)
- [src/testing/setup.ts:1-358](file://src/testing/setup.ts#L1-L358)
- [src/__mocks__/jest-dom-setup.ts:1-36](file://src/__mocks__/jest-dom-setup.ts#L1-L36)
- [src/__mocks__/env-setup.js:1-14](file://src/__mocks__/env-setup.js#L1-L14)
- [src/testing/INTEGRATION_TESTING_GUIDE.md:1-530](file://src/testing/INTEGRATION_TESTING_GUIDE.md#L1-L530)
- [src/testing/integration-helpers.ts:1-265](file://src/testing/integration-helpers.ts#L1-L265)
- [src/testing/supabase-test-helpers.ts:1-17](file://src/testing/supabase-test-helpers.ts#L1-L17)
- [src/testing/factories.ts:1-17](file://src/testing/factories.ts#L1-L17)
- [playwright.config.ts:1-46](file://playwright.config.ts#L1-L46)

**Section sources**
- [jest.config.js:1-119](file://jest.config.js#L1-L119)
- [playwright.config.ts:1-46](file://playwright.config.ts#L1-L46)
- [src/testing/INTEGRATION_TESTING_GUIDE.md:1-530](file://src/testing/INTEGRATION_TESTING_GUIDE.md#L1-L530)
- [src/testing/setup.ts:1-358](file://src/testing/setup.ts#L1-L358)
- [src/testing/integration-helpers.ts:1-265](file://src/testing/integration-helpers.ts#L1-L265)
- [src/testing/supabase-test-helpers.ts:1-17](file://src/testing/supabase-test-helpers.ts#L1-L17)
- [src/testing/factories.ts:1-17](file://src/testing/factories.ts#L1-L17)
- [src/__mocks__/jest-dom-setup.ts:1-36](file://src/__mocks__/jest-dom-setup.ts#L1-L36)
- [src/__mocks__/env-setup.js:1-14](file://src/__mocks__/env-setup.js#L1-L14)

## Core Components
- Jest configuration supports:
  - Dual test environments: Node for server-side logic and jsdom for component tests.
  - Module name mapping and asset mocking.
  - ESM transformation for selected packages.
  - Environment-specific setup files and module mocks.
- Global setup initializes Web APIs, Next.js navigation mocks, and polyfills for streams and encoders.
- Integration testing guide and helpers provide AAA-style flows, factory builders, assertion helpers, and Supabase mock factories.
- Playwright configuration orchestrates local development server startup, cross-browser/device testing, and tracing on failure.

**Section sources**
- [jest.config.js:12-119](file://jest.config.js#L12-L119)
- [src/testing/setup.ts:25-118](file://src/testing/setup.ts#L25-L118)
- [src/testing/INTEGRATION_TESTING_GUIDE.md:38-114](file://src/testing/INTEGRATION_TESTING_GUIDE.md#L38-L114)
- [src/testing/integration-helpers.ts:102-133](file://src/testing/integration-helpers.ts#L102-L133)
- [playwright.config.ts:3-46](file://playwright.config.ts#L3-L46)

## Architecture Overview
The testing architecture separates concerns across layers and environments, enabling fast feedback loops and reliable validations.

```mermaid
graph TB
A["Developer Commits"] --> B["Jest Unit/Component Tests"]
B --> C["Integration Tests (Mocked Services)"]
C --> D["Playwright E2E Tests"]
D --> E["CI Gate"]
subgraph "Jest Layer"
B1["Node Env<br/>server logic"]
B2["jsdom Env<br/>React components"]
end
subgraph "Integration Layer"
I1["Supabase Mocks"]
I2["External Service Mocks"]
I3["Factories & Builders"]
end
subgraph "E2E Layer"
E1["Web Server Dev Mode"]
E2["Multi-Browser Devices"]
end
B --> B1
B --> B2
C --> I1
C --> I2
C --> I3
D --> E1
D --> E2
```

**Diagram sources**
- [jest.config.js:43-115](file://jest.config.js#L43-L115)
- [src/testing/INTEGRATION_TESTING_GUIDE.md:15-32](file://src/testing/INTEGRATION_TESTING_GUIDE.md#L15-L32)
- [src/testing/integration-helpers.ts:17-92](file://src/testing/integration-helpers.ts#L17-L92)
- [playwright.config.ts:17-44](file://playwright.config.ts#L17-L44)

## Detailed Component Analysis

### Jest Configuration and Environments
- Projects:
  - Node project: server-side routes, libraries, and authenticated app tests.
  - jsdom project: components, hooks, providers, and shared UI tests.
- Environment-specific mocks and transforms:
  - ESM packages whitelisted for transformation.
  - Asset and module mocks for CSS, images, and Next.js modules.
  - Setup files inject DOM globals and environment defaults.
- Test discovery:
  - Matches files under __tests__ and *.test.* with ts/tsx/js/jsx.

```mermaid
flowchart TD
Start(["Jest Start"]) --> Detect["Detect Test File Location"]
Detect --> NodeProj{"Under server paths?"}
NodeProj --> |Yes| UseNode["Use Node Environment"]
NodeProj --> |No| UseJSDOM["Use jsdom Environment"]
UseNode --> ApplyNodeMocks["Apply Node Project Module Mappers"]
UseJSDOM --> ApplyDOMMocks["Apply jsdom Project Module Mappers"]
ApplyNodeMocks --> RunTests["Run Tests"]
ApplyDOMMocks --> RunTests
RunTests --> End(["Done"])
```

**Diagram sources**
- [jest.config.js:43-115](file://jest.config.js#L43-L115)

**Section sources**
- [jest.config.js:12-119](file://jest.config.js#L12-L119)
- [src/__mocks__/jest-dom-setup.ts:1-36](file://src/__mocks__/jest-dom-setup.ts#L1-L36)
- [src/__mocks__/env-setup.js:1-14](file://src/__mocks__/env-setup.js#L1-L14)

### Global Setup and Polyfills
- Ensures presence of Web APIs (TextEncoder/TextDecoder, ReadableStream/WritableStream/TransformStream).
- Provides Next.js navigation mocks for client components.
- Mocks server-only and cache modules for server actions.
- Initializes UUID and editor-related libraries for component tests.

```mermaid
sequenceDiagram
participant Jest as "Jest Runner"
participant Setup as "setup.ts"
participant DOM as "jest-dom-setup.ts"
participant Env as "env-setup.js"
Jest->>Setup : Load global setup
Setup->>Setup : Polyfill Web APIs
Setup->>Setup : Mock Next navigation
Setup->>Setup : Mock server-only/cache
Setup->>DOM : Inject DOM globals
Setup->>Env : Set env defaults if missing
Setup-->>Jest : Ready
```

**Diagram sources**
- [src/testing/setup.ts:25-118](file://src/testing/setup.ts#L25-L118)
- [src/__mocks__/jest-dom-setup.ts:7-35](file://src/__mocks__/jest-dom-setup.ts#L7-L35)
- [src/__mocks__/env-setup.js:8-13](file://src/__mocks__/env-setup.js#L8-L13)

**Section sources**
- [src/testing/setup.ts:1-358](file://src/testing/setup.ts#L1-L358)
- [src/__mocks__/jest-dom-setup.ts:1-36](file://src/__mocks__/jest-dom-setup.ts#L1-L36)
- [src/__mocks__/env-setup.js:1-14](file://src/__mocks__/env-setup.js#L1-L14)

### Integration Testing Patterns and Helpers
- AAA pattern: Arrange (prepare data/mocks), Act (execute action), Assert (validate outcomes).
- Mock factories for domain entities (contracts, dockets) and builders for bulk generation.
- Supabase mock factory returning a fluent API for queries, inserts, updates, deletes, and RPC calls.
- Assertion helpers for pagination correctness and error shaping.
- Date helpers for relative dates and formatting.
- Conditional execution helpers for Supabase-dependent tests.

```mermaid
flowchart TD
A["Arrange"] --> B["Prepare Inputs/Mocks"]
B --> C["Act"]
C --> D["Execute Service/Action"]
D --> E["Assert"]
E --> F{"Success?"}
F --> |Yes| G["Validate Outputs & Calls"]
F --> |No| H["Validate Error Path"]
G --> I["End"]
H --> I
```

**Diagram sources**
- [src/testing/INTEGRATION_TESTING_GUIDE.md:40-55](file://src/testing/INTEGRATION_TESTING_GUIDE.md#L40-L55)
- [src/testing/integration-helpers.ts:17-92](file://src/testing/integration-helpers.ts#L17-L92)
- [src/testing/integration-helpers.ts:102-133](file://src/testing/integration-helpers.ts#L102-L133)
- [src/testing/integration-helpers.ts:147-158](file://src/testing/integration-helpers.ts#L147-L158)

**Section sources**
- [src/testing/INTEGRATION_TESTING_GUIDE.md:38-114](file://src/testing/INTEGRATION_TESTING_GUIDE.md#L38-L114)
- [src/testing/integration-helpers.ts:1-265](file://src/testing/integration-helpers.ts#L1-L265)
- [src/testing/supabase-test-helpers.ts:1-17](file://src/testing/supabase-test-helpers.ts#L1-L17)
- [src/testing/factories.ts:1-17](file://src/testing/factories.ts#L1-L17)

### Component Testing with React Testing Library
- jsdom project enables DOM rendering and React Testing Library assertions.
- Global setup ensures Next.js navigation mocks and Web APIs are available.
- Example component test exists under the app’s test directory.

```mermaid
sequenceDiagram
participant TL as "React Testing Library"
participant Comp as "Component Under Test"
participant Setup as "setup.ts"
participant Mocks as "Module Mappers"
TL->>Setup : Initialize environment
TL->>Comp : Render with RTL
Comp->>Mocks : Import mocked modules
TL->>TL : Assert DOM interactions/results
```

**Diagram sources**
- [jest.config.js:71-115](file://jest.config.js#L71-L115)
- [src/testing/setup.ts:25-118](file://src/testing/setup.ts#L25-L118)
- [src/app/__tests__/layout.test.tsx:1-50](file://src/app/__tests__/layout.test.tsx#L1-L50)

**Section sources**
- [jest.config.js:71-115](file://jest.config.js#L71-L115)
- [src/testing/setup.ts:25-118](file://src/testing/setup.ts#L25-L118)
- [src/app/__tests__/layout.test.tsx:1-50](file://src/app/__tests__/layout.test.tsx#L1-L50)

### Server Action Testing
- Node project configuration allows testing server actions and route handlers.
- Environment defaults prevent Supabase client initialization errors.
- Mocks for server-only and cache modules support server action scenarios.

```mermaid
sequenceDiagram
participant Test as "Test Case"
participant SA as "Server Action"
participant Env as "env-setup.js"
participant Mocks as "Module Mappers"
Test->>Env : Ensure env vars present
Test->>SA : Invoke server action
SA->>Mocks : Import mocked modules
Test->>Test : Assert result/error
```

**Diagram sources**
- [jest.config.js:43-70](file://jest.config.js#L43-L70)
- [src/__mocks__/env-setup.js:8-13](file://src/__mocks__/env-setup.js#L8-L13)

**Section sources**
- [jest.config.js:43-70](file://jest.config.js#L43-L70)
- [src/__mocks__/env-setup.js:1-14](file://src/__mocks__/env-setup.js#L1-L14)

### Database Testing Approaches
- Integration tests mock Supabase client with a fluent API for queries and RPCs.
- Helpers provide paginated response and error mocks aligned with Supabase conventions.
- Conditional execution helpers enable tests to run only when Supabase credentials are available.

```mermaid
flowchart TD
S["Supabase Client Mock"] --> Q["Query Methods"]
S --> U["Mutation Methods"]
S --> R["RPC Calls"]
Q --> P["Paginated Responses"]
U --> E["Errors"]
R --> P
P --> V["Assertions"]
E --> V
```

**Diagram sources**
- [src/testing/integration-helpers.ts:102-133](file://src/testing/integration-helpers.ts#L102-L133)
- [src/testing/integration-helpers.ts:166-188](file://src/testing/integration-helpers.ts#L166-L188)
- [src/testing/supabase-test-helpers.ts:3-14](file://src/testing/supabase-test-helpers.ts#L3-L14)

**Section sources**
- [src/testing/integration-helpers.ts:1-265](file://src/testing/integration-helpers.ts#L1-L265)
- [src/testing/supabase-test-helpers.ts:1-17](file://src/testing/supabase-test-helpers.ts#L1-L17)

### Playwright Configuration for E2E Testing
- Test discovery under src for E2E specs.
- Timeout, retries, and parallelization configured for reliability.
- Tracing retained on failure for diagnostics.
- Web server launched via npm run dev with port 3000 and reuse policy.
- Multi-project matrix for Chromium, Firefox, Safari, and mobile devices.

```mermaid
sequenceDiagram
participant PW as "Playwright Runner"
participant CFG as "playwright.config.ts"
participant Dev as "Dev Server"
participant Browser as "Browser(s)"
PW->>CFG : Load config
PW->>Dev : Start/Reuse dev server
PW->>Browser : Launch devices/projects
Browser-->>PW : Execute E2E specs
PW-->>PW : Retain traces on failure
```

**Diagram sources**
- [playwright.config.ts:3-46](file://playwright.config.ts#L3-L46)

**Section sources**
- [playwright.config.ts:1-46](file://playwright.config.ts#L1-L46)

### Test Data Management and Mocking Strategies
- Factories produce realistic test users and dates.
- Integration helpers provide entity factories and builders for bulk generation.
- Supabase mock factory centralizes query/mutation/RPC stubbing.
- Global setup and module mappers ensure consistent mocking across tests.

**Section sources**
- [src/testing/factories.ts:1-17](file://src/testing/factories.ts#L1-L17)
- [src/testing/integration-helpers.ts:17-92](file://src/testing/integration-helpers.ts#L17-L92)
- [src/testing/integration-helpers.ts:102-133](file://src/testing/integration-helpers.ts#L102-L133)
- [src/testing/setup.ts:113-118](file://src/testing/setup.ts#L113-L118)

### Practical Examples and Patterns
- Writing unit tests for hooks and providers using jsdom environment and React Testing Library.
- Writing integration tests for service-layer flows with mocked repositories and Supabase client.
- Writing E2E tests for user journeys across desktop and mobile browsers with Playwright.
- Testing async operations with proper awaits and promise-based assertions.
- Validating real-time features by asserting reactive updates after state changes.

[No sources needed since this section provides general guidance]

## Dependency Analysis
Testing dependencies are decoupled via module mappers and global setup, minimizing circular dependencies and enabling isolated test runs.

```mermaid
graph LR
Jest["jest.config.js"] --> Setup["setup.ts"]
Jest --> JDOM["jest-dom-setup.ts"]
Jest --> ENV["env-setup.js"]
IG["INTEGRATION_TESTING_GUIDE.md"] --> IH["integration-helpers.ts"]
IG --> SH["supabase-test-helpers.ts"]
IG --> FAC["factories.ts"]
PW["playwright.config.ts"] --> Jest
```

**Diagram sources**
- [jest.config.js:12-119](file://jest.config.js#L12-L119)
- [src/testing/setup.ts:1-358](file://src/testing/setup.ts#L1-L358)
- [src/__mocks__/jest-dom-setup.ts:1-36](file://src/__mocks__/jest-dom-setup.ts#L1-L36)
- [src/__mocks__/env-setup.js:1-14](file://src/__mocks__/env-setup.js#L1-L14)
- [src/testing/INTEGRATION_TESTING_GUIDE.md:1-530](file://src/testing/INTEGRATION_TESTING_GUIDE.md#L1-L530)
- [src/testing/integration-helpers.ts:1-265](file://src/testing/integration-helpers.ts#L1-L265)
- [src/testing/supabase-test-helpers.ts:1-17](file://src/testing/supabase-test-helpers.ts#L1-L17)
- [src/testing/factories.ts:1-17](file://src/testing/factories.ts#L1-L17)
- [playwright.config.ts:1-46](file://playwright.config.ts#L1-L46)

**Section sources**
- [jest.config.js:12-119](file://jest.config.js#L12-L119)
- [src/testing/INTEGRATION_TESTING_GUIDE.md:1-530](file://src/testing/INTEGRATION_TESTING_GUIDE.md#L1-L530)
- [playwright.config.ts:1-46](file://playwright.config.ts#L1-L46)

## Performance Considerations
- Prefer mocking external services to avoid flaky network-bound tests.
- Use factory builders for bulk data to reduce duplication and speed up tests.
- Keep test suites focused and isolated to minimize teardown overhead.
- Leverage parallelism in Playwright projects judiciously while controlling timeouts.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Missing Web APIs in jsdom:
  - Ensure global setup polyfills TextEncoder/TextDecoder and streams.
- Supabase client initialization errors:
  - Confirm environment defaults are set via env-setup or override locally.
- Next.js navigation mocks failing:
  - Verify Next.js navigation mocks are applied in setup.
- E2E tests timing out:
  - Increase timeout or adjust device emulation; confirm dev server reuse policy.
- Conditional Supabase tests:
  - Use helpers to skip tests when credentials are not available.

**Section sources**
- [src/testing/setup.ts:39-86](file://src/testing/setup.ts#L39-L86)
- [src/__mocks__/env-setup.js:8-13](file://src/__mocks__/env-setup.js#L8-L13)
- [src/testing/supabase-test-helpers.ts:3-14](file://src/testing/supabase-test-helpers.ts#L3-L14)
- [playwright.config.ts:9-22](file://playwright.config.ts#L9-L22)

## Conclusion
ZattarOS employs a layered testing strategy with Jest for unit and integration tests and Playwright for E2E validation. The configuration supports dual environments, robust global setup, and reusable integration helpers. By following the AAA pattern, leveraging factories and builders, and mocking external services, teams can write reliable, maintainable tests across components, server actions, and real-time features. Coverage targets and CI workflows should emphasize critical business flows and user journeys.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices
- Example test files:
  - Component test: [layout.test.tsx](file://src/app/__tests__/layout.test.tsx)
- Integration testing guide and helpers:
  - [INTEGRATION_TESTING_GUIDE.md](file://src/testing/INTEGRATION_TESTING_GUIDE.md)
  - [integration-helpers.ts](file://src/testing/integration-helpers.ts)
  - [supabase-test-helpers.ts](file://src/testing/supabase-test-helpers.ts)
  - [factories.ts](file://src/testing/factories.ts)
- Configuration files:
  - [jest.config.js](file://jest.config.js)
  - [playwright.config.ts](file://playwright.config.ts)
  - [jest-dom-setup.ts](file://src/__mocks__/jest-dom-setup.ts)
  - [env-setup.js](file://src/__mocks__/env-setup.js)