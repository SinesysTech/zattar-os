/**
 * Barrel export for all MCP tools.
 * 
 * This file consolidates tools from different modules (clientes, contratos, acervo, audiencias, pendentes-manifestacao, expedientes-manuais, captura, advogados, usuarios, admin) into a single export
 * for easy registration in the MCP server. It also provides an `allTools` array that combines all tool definitions.
 * 
 * Structure:
 * - Individual tool arrays are re-exported for direct access.
 * - `allTools` is a flattened array of all tool definitions, used by the MCP server to register tools.
 * 
 * To add new tools:
 * 1. Create a new file in this directory (e.g., `audiencias.ts`) that exports an array of `ToolDefinition` objects.
 * 2. Import the new array here and add it to the `allTools` array (e.g., `...audienciasTools`).
 * 3. Re-export the new array if needed (e.g., `export { audienciasTools } from './audiencias';`).
 */
export { clientesTools } from './clientes';
export { contratosTools } from './contratos';
export { acervoTools } from './acervo';
export { audienciasTools } from './audiencias';
export { pendentesManifestacaoTools } from './pendentes-manifestacao';
export { expedientesManuaisTools } from './expedientes-manuais';
export { capturaTools } from './captura';
export { advogadosTools } from './advogados';
export { usuariosTools } from './usuarios';
export { adminTools } from './admin';

// Consolidar todas as tools em um único array para facilitar registro no servidor MCP
import { clientesTools } from './clientes';
import { contratosTools } from './contratos';
import { acervoTools } from './acervo';
import { audienciasTools } from './audiencias';
import { pendentesManifestacaoTools } from './pendentes-manifestacao';
import { expedientesManuaisTools } from './expedientes-manuais';
import { capturaTools } from './captura';
import { advogadosTools } from './advogados';
import { usuariosTools } from './usuarios';
import { adminTools } from './admin';

export const allTools = [
  ...clientesTools,
  ...contratosTools,
  ...acervoTools,
  ...audienciasTools,
  ...pendentesManifestacaoTools,
  ...expedientesManuaisTools,
  ...capturaTools,        // +7 tools
  ...advogadosTools,      // +7 tools
  ...usuariosTools,       // +6 tools
  ...adminTools,          // +3 tools
];
