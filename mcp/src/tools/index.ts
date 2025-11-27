/**
 * Barrel export for all MCP tools.
 * 
 * This file consolidates tools from different modules (clientes, contratos, acervo) into a single export
 * for easy registration in the MCP server. It also provides an `allTools` array that combines all tool definitions.
 * 
 * Structure:
 * - Individual tool arrays are re-exported for direct access.
 * - `allTools` is a flattened array of all tool definitions, used by the MCP server to register tools.
 * 
 * To add new tools:
 * 1. Create a new file in this directory (e.g., `newModule.ts`) that exports an array of `ToolDefinition` objects.
 * 2. Import the new array here and add it to the `allTools` array (e.g., `...newModuleTools`).
 * 3. Re-export the new array if needed (e.g., `export { newModuleTools } from './newModule';`).
 */
export { clientesTools } from './clientes';
export { contratosTools } from './contratos';
export { acervoTools } from './acervo';

// Consolidar todas as tools em um único array para facilitar registro no servidor MCP
import { clientesTools } from './clientes';
import { contratosTools } from './contratos';
import { acervoTools } from './acervo';

export const allTools = [
  ...clientesTools,
  ...contratosTools,
  ...acervoTools,
];