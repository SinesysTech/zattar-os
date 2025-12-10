# Deployment Guide

<cite>
**Referenced Files in This Document**   
- [vercel.json](file://vercel.json)
- [Dockerfile](file://Dockerfile)
- [docker-compose.yml](file://docker-compose.yml)
- [.env.example](file://.env.example)
- [next.config.ts](file://next.config.ts)
- [DEPLOY.md](file://DEPLOY.md)
- [package.json](file://package.json)
- [captain-definition](file://captain-definition)
- [backend/storage/MIGRACAO_BACKBLAZE_B2.md](file://backend/storage/MIGRACAO_BACKBLAZE_B2.md)
- [backend/storage/backblaze-b2.service.ts](file://backend/storage/backblaze-b2.service.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Environment Configuration](#environment-configuration)
3. [Build Process](#build-process)
4. [Production Deployment Options](#production-deployment-options)
5. [Infrastructure Requirements](#infrastructure-requirements)
6. [Step-by-Step Deployment Instructions](#step-by-step-deployment-instructions)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
9. [Performance Optimization](#performance-optimization)
10. [Common Deployment Issues](#common-deployment-issues)

## Introduction

The Sinesys application is a comprehensive legal technology platform built with Next.js 16, utilizing a microservices architecture with three independent services: the main Next.js application, an MCP server for AI agents, and a browser service for web scraping. This deployment guide provides comprehensive instructions for configuring, building, and deploying Sinesys in various environments, including Vercel, Docker containerization, and on-premise deployments.

The application leverages several external services including Supabase for database and authentication, Backblaze B2 for document storage, Redis for caching, and MongoDB for timeline data. The deployment process is optimized for Docker with a multi-stage build process that reduces image size and improves startup time.

**Section sources**
- [DEPLOY.md](file://DEPLOY.md#L1-L1121)
- [README.md](file://README.md)

## Environment Configuration

### Environment Variables

Sinesys requires several environment variables for proper operation, categorized by their purpose and required level. The `.env.example` file provides a complete template for configuration.

#### Supabase Configuration (Required)
These variables are essential for database connectivity and authentication:

- `NEXT_PUBLIC_SUPABASE_URL`: Public URL of your Supabase project
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`: Anonymous key for client-side operations
- `SUPABASE_SECRET_KEY`: Secret service role key for server-side operations

#### System Authentication (Required)
- `SERVICE_API_KEY`: Secure API key for internal service authentication

#### External Service Integrations (Optional)

**Backblaze B2 Storage**
```bash
STORAGE_PROVIDER=backblaze
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_BUCKET=your-bucket-name
B2_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_application_key
```

**Redis Cache**
```bash
ENABLE_REDIS_CACHE=true
REDIS_URL=redis://host:6379
REDIS_PASSWORD=your_password
REDIS_CACHE_TTL=600
REDIS_CACHE_MAX_MEMORY=256mb
```

**MongoDB**
```bash
MONGODB_URL=mongodb://user:password@host:27017/database?authSource=admin
MONGODB_DATABASE=sinesys
ENABLE_MONGODB_AUDIT=true
```

**Browser Service (for Production Scraping)**
```bash
BROWSER_WS_ENDPOINT=ws://sinesys_browser:3000
BROWSER_SERVICE_URL=http://sinesys_browser:3000
```

**MCP Server (AI Agents)**
```bash
MCP_SINESYS_API_URL=http://sinesys_app:3000
MCP_SINESYS_API_KEY=your_api_key
```

**Section sources**
- [.env.example](file://.env.example#L1-L104)
- [DEPLOY.md](file://DEPLOY.md#L126-L149)

### Database Setup

Sinesys uses Supabase as its primary database, with a comprehensive migration system located in the `supabase/migrations/` directory. The database schema is defined across multiple SQL files in `supabase/schemas/`, covering various domains including legal processes, financial management, and user permissions.

The migration system includes both applied and pending migrations, with the applied migrations in `supabase/migrations/aplicadas/` and pending ones in `supabase/migrations/nao-aplicadas/`. Database migrations should be applied using the Supabase CLI or through the Supabase dashboard.

For production deployments, ensure that the database has Row Level Security (RLS) properly configured, which can be applied using the script `scripts/database/apply-rls-simple.ts`.

**Section sources**
- [supabase/schemas/](file://supabase/schemas/)
- [scripts/database/apply-rls-simple.ts](file://scripts/database/apply-rls-simple.ts)

### External Service Integrations

#### Supabase Integration

Supabase serves as the primary database and authentication provider for Sinesys. The application uses `@supabase/supabase-js` for client-side operations and `@supabase/postgrest-js` for server-side operations. The Supabase client is configured in `lib/supabase/client.ts` and `app/_lib/supabase.ts`.

Key integration points include:
- Authentication flows in the `auth/` directory
- Real-time data synchronization using Supabase's real-time capabilities
- Row Level Security policies defined in database migrations

#### Backblaze B2 Integration

Sinesys has migrated from Google Drive to Backblaze B2 for document storage, providing a more cost-effective and scalable solution. The integration is implemented in `backend/storage/backblaze-b2.service.ts` and follows S3-compatible API standards.

The migration to Backblaze B2 includes:
- A dedicated service for uploading and deleting documents
- Presigned URL generation for secure document access
- Structured storage organization by process number and document type

The storage structure follows this pattern:
```
bucket: your-bucket-name/
├── processos/
│   ├── {process-number}/
│   │   ├── timeline/
│   │   ├── pendente_manifestacao/
│   │   ├── audiencias/
│   │   └── expedientes/
```

#### Redis Integration

Redis is used for distributed caching to improve application performance. The Redis client is configured through environment variables, with the connection managed by the application's caching layer. Redis is particularly useful for caching expensive database queries and API responses.

**Diagram sources**
- [backend/storage/MIGRACAO_BACKBLAZE_B2.md](file://backend/storage/MIGRACAO_BACKBLAZE_B2.md#L1-L247)
- [backend/storage/backblaze-b2.service.ts](file://backend/storage/backblaze-b2.service.ts#L1-L195)

**Section sources**
- [backend/storage/MIGRACAO_BACKBLAZE_B2.md](file://backend/storage/MIGRACAO_BACKBLAZE_B2.md#L1-L247)
- [backend/storage/backblaze-b2.service.ts](file://backend/storage/backblaze-b2.service.ts#L1-L195)

## Build Process

### Next.js Compilation

Sinesys uses Next.js 16 with Turbopack for development builds and Webpack for production builds. The build process is optimized for Docker deployment with the `output: 'standalone'` configuration in `next.config.ts`, which generates a minimal server bundle.

The application supports multiple build scripts for different scenarios:

| Script | Purpose | Build System |
|--------|-------|-------------|
| `build:prod` | Production build | Webpack |
| `build` | Development build | Turbopack |
| `build:prod:webpack` | Fallback production build | Webpack |
| `build:prod:turbopack` | Experimental production build | Turbopack |

The production build (`build:prod`) is specifically configured to work with the PWA functionality, as the `@ducanh2912/next-pwa` plugin requires Webpack to generate the service worker correctly.

**Section sources**
- [package.json](file://package.json#L1-L215)
- [next.config.ts](file://next.config.ts#L1-L131)

### Asset Optimization

The build process includes several optimizations for asset delivery:

1. **Image Optimization**: Configured in `next.config.ts` to support AVIF and WebP formats:
```typescript
images: {
  formats: ['image/avif', 'image/webp'],
}
```

2. **Source Map Optimization**: Disabled in production to save approximately 500MB of build time memory:
```typescript
productionBrowserSourceMaps: false,
experimental: {
  serverSourceMaps: false,
}
```

3. **Webpack Memory Optimizations**: Enabled to reduce memory usage during the build process:
```typescript
experimental: {
  webpackMemoryOptimizations: true,
  webpackBuildWorker: true,
}
```

4. **Bundle Analysis**: Available through the `analyze` script, which generates interactive bundle reports:
```bash
npm run analyze
```

### Dependency Installation

Dependencies are installed in a multi-stage Docker build process to optimize caching:

1. **Dependencies Stage**: Installs npm dependencies in a separate layer that is cached unless `package.json` changes
2. **Builder Stage**: Copies dependencies and application code, then runs the Next.js build
3. **Runner Stage**: Creates a minimal production image with only necessary files

The `.dockerignore` file is carefully configured to exclude development files and reduce the build context size from approximately 1GB to around 100MB, significantly improving build performance and cache efficiency.

**Section sources**
- [Dockerfile](file://Dockerfile#L1-L185)
- [next.config.ts](file://next.config.ts#L1-L131)

## Production Deployment Options

### Vercel Deployment

Sinesys can be deployed on Vercel using the configuration in `vercel.json`. The deployment includes a cron job for automatic cleanup of the trash bin:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/lixeira/limpar",
      "schedule": "0 3 * * *"
    }
  ]
}
```

To deploy on Vercel:

1. Import the project from GitHub
2. Configure environment variables in the Vercel dashboard
3. Set the build command to `npm run build:prod`
4. Set the output directory to `.next`
5. Deploy the application

The Vercel deployment automatically provides HTTPS and global CDN distribution.

**Section sources**
- [vercel.json](file://vercel.json#L1-L10)
- [DEPLOY.md](file://DEPLOY.md#L641-L653)

### Docker Containerization

The primary deployment method for Sinesys is Docker containerization, with a comprehensive `Dockerfile` that implements best practices for Next.js applications.

#### Dockerfile Structure

The Dockerfile uses a multi-stage build process:

1. **Dependencies Stage**: Installs npm dependencies with caching
2. **Builder Stage**: Builds the Next.js application with memory optimization
3. **Runner Stage**: Creates a minimal production image

Key features of the Dockerfile:

- **Memory Optimization**: Limits Node.js heap size to prevent OOM (Out of Memory) errors:
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=2048"
```

- **Security**: Runs the application as a non-root user:
```dockerfile
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs
USER nextjs
```

- **Health Check**: Includes a built-in health check for container orchestration:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
```

**Diagram sources**
- [Dockerfile](file://Dockerfile#L1-L185)

**Section sources**
- [Dockerfile](file://Dockerfile#L1-L185)

### On-Premise Deployment

On-premise deployment is supported through Docker Compose, with the configuration defined in `docker-compose.yml`.

#### Docker Compose Configuration

The `docker-compose.yml` file defines the main Sinesys application service:

```yaml
version: "3.8"
services:
  sinesys_app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
        - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY}
    image: sinesys_app:latest
    container_name: sinesys_app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - PORT=3000
      - HOSTNAME=0.0.0.0
      # ... other environment variables
    networks:
      - sinesys_network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

#### CapRover Deployment

For on-premise deployments, CapRover is recommended as a PaaS solution. The `captain-definition` file configures the application for CapRover:

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

To deploy on CapRover:

1. Install CapRover on your server
2. Create three applications: `sinesys`, `sinesys-mcp`, and `sinesys-browser`
3. Deploy each application from its respective repository
4. Configure environment variables for each service
5. Set up domain names and HTTPS certificates

The browser service requires WebSocket support to be enabled, while the other services do not.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L1-L79)
- [captain-definition](file://captain-definition#L1-L6)
- [DEPLOY.md](file://DEPLOY.md#L36-L160)

## Infrastructure Requirements

### Minimum Hardware Requirements

The infrastructure requirements vary depending on the deployment option and expected load.

#### Vercel
- No specific hardware requirements as Vercel manages the infrastructure
- Recommended plan: Pro or Enterprise for production workloads
- Automatic scaling based on traffic

#### Docker Containerization
- **CPU**: 2 cores minimum, 4+ cores recommended
- **Memory**: 4GB minimum, 8GB+ recommended
- **Storage**: 20GB minimum for system and application
- **Network**: 100Mbps minimum, HTTPS recommended

#### On-Premise Deployment
- **CPU**: 4 cores minimum, 8+ cores recommended for production
- **Memory**: 8GB minimum, 16GB+ recommended
- **Storage**: 50GB minimum, SSD recommended
- **Network**: 1Gbps recommended, static IP for production

### Service-Specific Requirements

#### Main Application (sinesys_app)
- **Memory**: 2GB dedicated for Node.js heap
- **CPU**: 2 cores for handling API requests and rendering
- **Storage**: Local storage not required (data stored in Supabase)
- **Network**: Port 3000 exposed for HTTP/HTTPS

#### Browser Service (sinesys-browser)
- **Memory**: 2GB minimum (Firefox can be memory intensive)
- **CPU**: 2 cores for handling multiple browser instances
- **Storage**: Minimal local storage
- **Network**: Port 3000 with WebSocket support enabled

#### MCP Server (sinesys-mcp)
- **Memory**: 1GB minimum
- **CPU**: 1-2 cores
- **Storage**: Minimal local storage
- **Network**: Port 3001 exposed

### External Service Requirements

#### Supabase
- **Plan**: Pro or Enterprise for production workloads
- **Database Size**: Scale based on document storage needs
- **Authentication**: Enable email/password and magic link authentication
- **Storage**: Configure storage buckets for document management

#### Backblaze B2
- **Bucket**: Create a dedicated bucket for Sinesys documents
- **Permissions**: Configure application keys with read/write access
- **Storage Class**: Standard storage class recommended
- **Bandwidth**: Monitor bandwidth usage for cost optimization

#### Redis
- **Memory**: 256MB-1GB depending on cache size
- **Persistence**: Optional, depending on use case
- **Replication**: Recommended for production environments

#### MongoDB
- **Memory**: 2GB+ for adequate performance
- **Storage**: SSD recommended for timeline data
- **Replication**: Configure replica set for production
- **Backup**: Regular backups recommended

**Section sources**
- [DEPLOY.md](file://DEPLOY.md#L81-L83)
- [Dockerfile](file://Dockerfile#L67-L97)

## Step-by-Step Deployment Instructions

### Vercel Deployment Steps

1. **Prepare Environment Variables**
   - Create a `.env.local` file with all required environment variables
   - Ensure Supabase credentials are correctly configured
   - Set `NODE_ENV=production`

2. **Configure Vercel Project**
   - Import the Sinesys repository from GitHub
   - In the Vercel dashboard, navigate to Settings > Environment Variables
   - Add all required environment variables

3. **Configure Build Settings**
   - Set Build Command: `npm run build:prod`
   - Set Output Directory: `.next`
   - Set Development Command: `npm run dev`

4. **Deploy Application**
   - Trigger deployment from the Vercel dashboard
   - Monitor build logs for any errors
   - Verify deployment by accessing the assigned URL

5. **Configure Domain and HTTPS**
   - Add your custom domain in the Vercel dashboard
   - Vercel will automatically provision an SSL certificate
   - Configure DNS records to point to Vercel

6. **Verify Deployment**
   - Access the application URL
   - Check that the health endpoint returns 200: `/api/health`
   - Test core functionality including authentication

**Section sources**
- [vercel.json](file://vercel.json#L1-L10)
- [DEPLOY.md](file://DEPLOY.md#L641-L653)

### Docker Containerization Steps

1. **Prepare Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required values, particularly Supabase and Backblaze credentials
   - Ensure sensitive keys are not exposed

2. **Build Docker Image**
   ```bash
   docker build \
     --build-arg NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
     --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY="your-anon-key" \
     -t sinesys:latest .
   ```

3. **Handle Memory Constraints**
   - If build fails with OOM (Out of Memory), increase Node.js memory:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```
   - Ensure the build server has sufficient swap space:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

4. **Run Container**
   ```bash
   docker run -d \
     --name sinesys \
     -p 3000:3000 \
     --env-file .env.local \
     --restart unless-stopped \
     sinesys:latest
   ```

5. **Verify Container Health**
   - Check container logs: `docker logs sinesys`
   - Verify health check is passing: `docker inspect sinesys`
   - Test application access: `curl http://localhost:3000`

**Section sources**
- [Dockerfile](file://Dockerfile#L1-L185)
- [DEPLOY.md](file://DEPLOY.md#L687-L713)

### On-Premise Deployment Steps

#### CapRover Deployment

1. **Install CapRover**
   - Follow official CapRover installation guide for your platform
   - Access the CapRover dashboard at `http://your-server-ip:3000`

2. **Create Applications**
   - Create three applications:
     - `sinesys` (main application)
     - `sinesys-mcp` (MCP server)
     - `sinesys-browser` (browser service)
   - For `sinesys-browser`, enable WebSocket support

3. **Deploy Browser Service**
   ```bash
   cd sinesys-browser-server
   caprover deploy -a sinesys-browser
   ```
   - Set environment variables:
     ```
     PORT=3000
     BROWSER_TOKEN=your_optional_token
     ```
   - Configure 2048MB memory in App Configs

4. **Deploy MCP Server**
   ```bash
   cd sinesys-mcp-server
   caprover deploy -a sinesys-mcp
   ```
   - Set environment variables:
     ```
     NODE_ENV=production
     PORT=3001
     SINESYS_API_URL=http://srv-captain--sinesys:3000
     SINESYS_API_KEY=your_api_key
     ```

5. **Deploy Main Application**
   ```bash
   cd sinesys
   caprover deploy -a sinesys
   ```
   - Provide build arguments when prompted:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
   - Set environment variables as specified in `.env.example`

6. **Configure Domains and HTTPS**
   - In CapRover dashboard, navigate to Apps > sinesys > App Settings
   - Add domain: `app.yourdomain.com`
   - Enable HTTPS and redirect HTTP to HTTPS
   - Repeat for other services as needed

#### Docker Compose Deployment

1. **Prepare Environment**
   - Copy `.env.example` to `.env`
   - Fill in all environment variables
   - Ensure Docker and Docker Compose are installed

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Verify Services**
   ```bash
   docker-compose logs -f
   docker-compose ps
   ```

4. **Access Application**
   - Application will be available at `http://localhost:3000`
   - For production, configure reverse proxy (e.g., Nginx) with SSL

**Section sources**
- [DEPLOY.md](file://DEPLOY.md#L36-L160)
- [docker-compose.yml](file://docker-compose.yml#L1-L79)

## Monitoring and Logging

### Health Checks

Sinesys includes built-in health checks for container orchestration:

- **HTTP Health Check**: `/api/health` endpoint returns 200 when application is healthy
- **Docker Health Check**: Configured in Dockerfile to verify application responsiveness
- **CapRover Health Monitoring**: Automatic restart if health check fails

The health check verifies that the application can respond to HTTP requests, but does not check database connectivity or external service availability.

### Logging Strategy

The application uses structured logging with the `pino` logger, configured in `backend/utils/logger/`. Key logging practices include:

1. **Error Logging**: All errors are logged with stack traces and context
2. **Performance Logging**: Key operations are timed and logged
3. **Audit Logging**: User actions and system changes are recorded
4. **External Service Logging**: Integration points with Supabase, Backblaze, etc.

Log levels can be controlled through environment variables, with production typically using "info" level to avoid excessive logging.

### Monitoring Tools

For production deployments, implement the following monitoring:

1. **Application Performance Monitoring (APM)**
   - Use tools like Datadog, New Relic, or Prometheus/Grafana
   - Monitor response times, error rates, and throughput

2. **Infrastructure Monitoring**
   - Monitor CPU, memory, disk, and network usage
   - Set up alerts for resource exhaustion

3. **Log Aggregation**
   - Use tools like ELK stack, Splunk, or Datadog Logs
   - Centralize logs from all services for easier analysis

4. **Uptime Monitoring**
   - Use external services like UptimeRobot or Pingdom
   - Monitor public endpoints for availability

**Section sources**
- [Dockerfile](file://Dockerfile#L160-L183)
- [DEPLOY.md](file://DEPLOY.md#L164-L183)

## Backup and Disaster Recovery

### Database Backup

Supabase provides automatic daily backups with point-in-time recovery. For additional protection:

1. **Regular Exports**: Schedule regular database exports using the Supabase dashboard
2. **Manual Backups**: Use the `supabase db dump` command for on-demand backups
3. **Backup Verification**: Regularly test backup restoration

### Document Storage Backup

With Backblaze B2 as the primary storage:

1. **Versioning**: Enable versioning on the Backblaze bucket to protect against accidental deletion
2. **Cross-Region Replication**: Consider replicating to a different region for disaster recovery
3. **Regular Audits**: Periodically verify document integrity and accessibility

### Disaster Recovery Plan

1. **Recovery Point Objective (RPO)**: 24 hours for database, immediate for documents
2. **Recovery Time Objective (RTO)**: 2 hours for full system restoration

**Recovery Steps:**
1. Restore database from latest backup
2. Re-deploy application containers
3. Verify document accessibility from Backblaze
4. Test core functionality
5. Notify users of service restoration

### Configuration Backup

Regularly backup configuration files:
- `.env` files with environment variables
- Docker configuration files
- CapRover or orchestration configurations
- SSL certificates and keys

Store backups in a secure, off-site location with appropriate access controls.

**Section sources**
- [DEPLOY.md](file://DEPLOY.md#L636-L639)
- [backend/storage/MIGRACAO_BACKBLAZE_B2.md](file://backend/storage/MIGRACAO_BACKBLAZE_B2.md#L1-L247)

## Performance Optimization

### Caching Strategies

#### Redis Caching
Enable Redis caching for frequently accessed data:
```bash
ENABLE_REDIS_CACHE=true
REDIS_URL=redis://host:6379
REDIS_CACHE_TTL=600
```

Cache commonly accessed database queries, API responses, and computed values. Implement cache invalidation strategies to ensure data freshness.

#### Browser Caching
The PWA configuration in `next.config.ts` includes Workbox strategies for efficient browser caching:

- **CacheFirst**: For static assets like fonts and images
- **NetworkFirst**: For API responses with a 1-hour cache
- **NetworkOnly**: For health checks to ensure fresh status

#### Supabase Query Optimization
- Use Supabase's built-in query optimization
- Implement proper indexing on frequently queried columns
- Use stored procedures for complex queries

### Database Indexing

Proper indexing is critical for performance. Key areas to index:

1. **Process Numbers**: Index on process number fields for quick lookups
2. **Dates**: Index on date fields used in filtering (e.g., hearing dates)
3. **Foreign Keys**: Index all foreign key relationships
4. **Frequently Queried Fields**: Identify and index fields used in WHERE clauses

Use the Supabase dashboard to analyze query performance and identify slow queries that need optimization.

### CDN Configuration

When deployed on Vercel, the application automatically benefits from Vercel's global CDN. For on-premise deployments:

1. **Reverse Proxy**: Use Nginx or similar as a reverse proxy with caching
2. **Static Assets**: Serve static assets (images, CSS, JS) through the CDN
3. **Caching Headers**: Configure appropriate cache headers for different asset types
4. **Compression**: Enable Gzip/Brotli compression for text assets

### Additional Optimization Tips

1. **Bundle Optimization**: Regularly analyze bundle size with `npm run analyze`
2. **Code Splitting**: Use dynamic imports for non-critical code
3. **Image Optimization**: Ensure all images are properly compressed and in modern formats
4. **Database Connection Pooling**: Configure appropriate connection pool sizes
5. **Memory Management**: Monitor and optimize memory usage, particularly during batch operations

**Section sources**
- [next.config.ts](file://next.config.ts#L74-L130)
- [DEPLOY.md](file://DEPLOY.md#L227-L255)

## Common Deployment Issues

### Migration Failures

**Issue**: Database migrations fail during deployment
**Solutions**:
1. Verify that the Supabase CLI is installed and configured
2. Check that migration files are present in `supabase/migrations/aplicadas/`
3. Run migrations manually: `npx supabase db push`
4. Check for syntax errors in migration SQL files
5. Verify database connectivity and credentials

### Environment Configuration Errors

**Issue**: Application fails to start due to missing or incorrect environment variables
**Solutions**:
1. Verify all required variables are present in `.env.local`
2. Check for typos in variable names
3. Ensure sensitive keys are properly formatted
4. Validate Supabase URL format (should include protocol)
5. Restart the application after making changes

### OOM (Out of Memory) Errors

**Issue**: Build or runtime fails with "JavaScript heap out of memory"
**Solutions**:
1. Increase Node.js memory limit:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```
2. Add swap space to the server:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo swapon /swapfile
   ```
3. Reduce concurrent build processes
4. Increase server memory if possible
5. Use the memory-optimized build script: `npm run build:debug-memory`

### Health Check Failures

**Issue**: Container fails health checks and restarts continuously
**Solutions**:
1. Check application logs for startup errors
2. Verify that port 3000 is not blocked by firewall
3. Ensure database connectivity is established
4. Check that required services (Supabase, Redis) are available
5. Increase health check start period if application takes time to initialize

### Browser Service Connection Issues

**Issue**: Main application cannot connect to browser service
**Solutions**:
1. Verify that the browser service is running
2. Check that WebSocket support is enabled (for CapRover)
3. Verify network connectivity between services
4. Check that the correct endpoint URLs are configured
5. Test connectivity with curl: `curl http://browser-service:3000/health`

### PWA Installation Issues

**Issue**: PWA installation prompt does not appear
**Solutions**:
1. Ensure you are using `npm run build:prod` (Webpack build)
2. Verify HTTPS is enabled (or using localhost)
3. Interact with the page for at least 30 seconds
4. Check that the service worker is registered (Application tab in DevTools)
5. Verify manifest.json is correctly configured
6. Ensure the app is not already installed

**Section sources**
- [DEPLOY.md](file://DEPLOY.md#L687-L727)
- [next.config.ts](file://next.config.ts#L55-L130)
- [Dockerfile](file://Dockerfile#L160-L183)