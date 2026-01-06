# DevOps Infrastructure Specification

## ADDED Requirements

### Requirement: Docker Multi-Stage Build
The system SHALL utilize Docker multi-stage build to create optimized images for the Next.js application.

#### Scenario: Build with optimized base image
- **WHEN** the Dockerfile is executed
- **THEN** it MUST use `node:24-alpine` as base image
- **AND** MUST use pinning with SHA256 digest for deterministic builds
- **AND** MUST produce final image smaller than 300MB

#### Scenario: Cache optimization with mount
- **WHEN** npm ci is executed in the dependencies stage
- **THEN** it MUST use cache mount for `/root/.npm`
- **AND** MUST use cache mount for `/root/.cache`
- **AND** MUST use `--prefer-offline` flag to speed up installation

#### Scenario: Standalone output configuration
- **WHEN** next build is executed in the builder stage
- **THEN** it MUST generate standalone output
- **AND** MUST copy `.next/standalone`, `.next/static` and `public` to the runner
- **AND** NODE_OPTIONS MUST be configured to 3072MB

#### Scenario: Security hardening in runner
- **WHEN** the container is started
- **THEN** it MUST run with non-root user (nextjs:nodejs)
- **AND** MUST expose only port 3000
- **AND** MUST have healthcheck configured

### Requirement: GitHub Actions CI/CD Pipeline
The system SHALL have automated CI/CD pipeline via GitHub Actions for build and deploy.

#### Scenario: Docker build workflow
- **WHEN** push is made to main/master branch
- **THEN** it MUST execute Docker build workflow
- **AND** MUST use docker/build-push-action v6
- **AND** MUST use docker/setup-buildx-action v3 with buildkit latest
- **AND** MUST push to Docker Hub

#### Scenario: Registry cache utilization
- **WHEN** build workflow is executed
- **THEN** it MUST use cache-from with `type=registry`
- **AND** MUST use cache-to with `mode=max`
- **AND** MUST reduce subsequent build times by at least 50%

#### Scenario: Build arguments handling
- **WHEN** Docker image is built
- **THEN** it MUST receive NEXT_PUBLIC_SUPABASE_URL via build-arg
- **AND** MUST receive NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY via build-arg
- **AND** sensitive values MUST come from GitHub Secrets

### Requirement: Test Workflow Configuration
The system SHALL have automated test workflow with Node.js 24.

#### Scenario: Node.js version alignment
- **WHEN** test workflow is executed
- **THEN** it MUST use Node.js 24.x
- **AND** MUST use npm cache to speed up installation
- **AND** MUST have timeout configured to avoid stuck builds

#### Scenario: Test execution
- **WHEN** pull request is created or updated
- **THEN** it MUST execute lint, type-check and tests
- **AND** MUST report status on PR
- **AND** MUST block merge if tests fail

### Requirement: CapRover Deployment
The system SHALL support automated deployment via CapRover.

#### Scenario: Captain definition file
- **WHEN** CapRover initiates deployment
- **THEN** it MUST find `captain-definition` in project root
- **AND** file MUST specify `schemaVersion: 2`
- **AND** file MUST point to `./Dockerfile`

#### Scenario: Webhook deployment trigger
- **WHEN** GitHub Actions build completes successfully
- **THEN** it MAY trigger CapRover webhook
- **AND** CapRover MUST pull image from Docker Hub
- **AND** CapRover MUST deploy with zero-downtime if possible

#### Scenario: Health check validation
- **WHEN** container is started in CapRover
- **THEN** it MUST wait for healthcheck to pass before redirecting traffic
- **AND** healthcheck MUST verify `/api/health` endpoint
- **AND** MUST return 200 OK when application is ready

### Requirement: Secrets Management
The system SHALL have clear documentation of secrets required for CI/CD.

#### Scenario: GitHub secrets configuration
- **WHEN** developer configures CI/CD
- **THEN** there MUST be documentation of all required secrets
- **AND** MUST include: DOCKERHUB_USERNAME, DOCKERHUB_TOKEN
- **AND** MUST include: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- **AND** MAY include: CAPROVER_SERVER, CAPROVER_APP_TOKEN (for auto-deploy)

#### Scenario: Secrets protection
- **WHEN** workflow is executed
- **THEN** secrets MUST NOT appear in logs
- **AND** secrets MUST NOT be exposed in final image
- **AND** public build-args MUST be clearly identified
