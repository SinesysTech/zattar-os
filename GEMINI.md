                # Gemini Project Context: Sinesys

This document provides a comprehensive overview of the Sinesys project, its architecture, and development conventions to be used as instructional context for Gemini.

## 1. Project Overview

**Sinesys** is a full-stack legal management application for the law firm **Zattar Advogados**. It appears to be a comprehensive internal tool for managing cases, clients, hearings, and other legal data. A key feature is the automated data scraping from the PJE (Processo Judicial Eletrônico), a Brazilian electronic court system.

### Core Technologies

- **Framework:** Next.js v16 (using App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 with shadcn/ui components
- **Backend-as-a-Service:** Supabase (PostgreSQL, Auth)
- **Caching:** Redis (ioredis) using a Cache-Aside pattern
- **Database (secondary):** MongoDB (for specific features like "timeline")
- **Data Scraping:** Playwright and Puppeteer
- **Containerization:** Docker and Docker Compose
- **API Documentation:** Swagger/OpenAPI, generated from JSDoc comments.

### Architecture

The project follows a well-defined, modular architecture:

- `app/`: Contains the Next.js App Router structure.
  - `(dashboard)/`: Protected routes for the main application interface.
  - `api/`: REST API endpoints that serve as the presentation layer for the backend logic.
- `backend/`: A dedicated directory for core business logic, decoupled from the Next.js API routes. It's structured with `services` (business logic) and `persistence` (database access) layers for each feature.
- `components/`: Reusable React components, with `components/ui` housing the shadcn/ui elements.
- `lib/`: Shared utility functions and clients for Redis, Supabase, etc.
- `supabase/`: Contains database migrations and schema definitions.
- `scripts/` & `dev_data/scripts`: Various utility, testing, and data population scripts written in TypeScript and executed with `tsx`.

## 2. Building and Running

### Development

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### Production

- **Local Build & Run:**
  ```bash
  npm run build
  npm start
  ```
- **Docker:** The recommended way to run all services together.
  ```bash
  docker-compose up -d
  ```

### API Documentation

The interactive Swagger API documentation is available at `/docs` when the development server is running:
`http://localhost:3000/docs`

## 3. Development Conventions

### Code Style & Quality

- **Linting:** ESLint is configured. Run `npm run lint` to check for issues.
- **Type Checking:** TypeScript is used with `strict` mode enabled. Run `npm run type-check` to verify types.
- **Naming Conventions:**
  - **Files:** `kebab-case.ts`
  - **React Components:** `PascalCase.tsx`
  - **Variables/Functions:** `camelCase`
  - **Types/Interfaces:** `PascalCase`
  - **Database Columns:** `snake_case`

### Key Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Creates a production build.
- `npm run lint`: Runs the linter.
- `npm run type-check`: Runs the TypeScript compiler for type validation.
- `npm run test:api-*`: A suite of scripts in `package.json` to test the PJE data scraping APIs (e.g., `npm run test:api-audiencias`).
- `npm run sincronizar-usuarios`: A utility script to synchronize users between Supabase Auth and the public `usuarios` table.

### API Development

- API logic is defined in the `backend/` directory and exposed via simple handlers in `app/api/`.
- Endpoints are documented using JSDoc with `@swagger` annotations.
- Responses follow a standard format: `{ success: true, data: {...} }` for success and `{ error: "..." }` for failures.

### Component Development

- The project uses **shadcn/ui**. New components should be added via the CLI: `npx shadcn-ui@latest add [component-name]`.
- A powerful, reusable `TableToolbar` component exists at `components/ui/table-toolbar.tsx` for pages with data tables, providing integrated search and filtering.
