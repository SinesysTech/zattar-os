/**
 * Portal Feature - Barrel exports
 * 
 * IMPORTANT: Only export types, actions, and components here.
 * DO NOT export service functions to avoid client/server boundary violations.
 */

// Types and Utils (safe for client)
export * from "./types";
export * from "./utils";

// Actions - Server Actions (safe for client)
export * from "./actions/portal-actions";

// Components (safe for client)
export * from "./components/cards";
export * from "./components/hero/cpf-hero-form";
export * from "./components/navbar/portal-navbar";
export { DashboardView } from "./components/dashboard/dashboard-view";
export { PortalShell } from "./components/layout/portal-shell";

// Portal base components (design system primitives for the portal)
export * from "./components/portal";

// Service - Server-only exports (use in Server Components and Actions only)
// Import directly from "./service" when needed in server context
