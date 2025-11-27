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
 * 3. Re-export the new array if needed (e.g., `export { audienciasTools } from './audiencias.js';`).
 */
export { clientesTools } from './clientes.js';
export { contratosTools } from './contratos.js';
export { acervoTools } from './acervo.js';
export { audienciasTools } from './audiencias.js';
export { pendentesManifestacaoTools } from './pendentes-manifestacao.js';
export { expedientesManuaisTools } from './expedientes-manuais.js';
export { capturaTools } from './captura.js';
export { advogadosTools } from './advogados.js';
export { usuariosTools } from './usuarios.js';
export { adminTools } from './admin.js';

// Consolidar todas as tools em um único array para facilitar registro no servidor MCP
import { clientesTools } from './clientes.js';
import { contratosTools } from './contratos.js';
import { acervoTools } from './acervo.js';
import { audienciasTools } from './audiencias.js';
import { pendentesManifestacaoTools } from './pendentes-manifestacao.js';
import { expedientesManuaisTools } from './expedientes-manuais.js';
import { capturaTools } from './captura.js';
import { advogadosTools } from './advogados.js';
import { usuariosTools } from './usuarios.js';
import { adminTools } from './admin.js';

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
