// Domain types and constants (client-safe)
export * from "./domain";

// Components (client-safe)
export { ConfigAtribuicaoDialog } from "./components/config-atribuicao-dialog";
export { RegiaoFormDialog } from "./components/regiao-form-dialog";

// Note: service.ts and repository.ts use "server-only" and should be imported directly
// in server components or server actions, not through this barrel file.
