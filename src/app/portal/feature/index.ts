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

// Service - Server-only exports (use in Server Components and Actions only)
// Import directly from "./service" when needed in server context
