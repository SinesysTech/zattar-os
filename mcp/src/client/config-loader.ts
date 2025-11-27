import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ApiClientConfig } from '../types/index';

// Flag para habilitar logs de debug via variável de ambiente
const MCP_DEBUG = process.env.MCP_DEBUG === 'true' || process.env.MCP_DEBUG === '1';

/**
 * Log condicional - só exibe se MCP_DEBUG estiver habilitado
 */
function debugLog(message: string): void {
    if (MCP_DEBUG) {
        console.debug(`[MCP Config] ${message}`);
    }
}

export function loadConfig(): ApiClientConfig {
    // Attempt 1: Load from user config file
    const configPath = path.join(os.homedir(), '.sinesys', 'config.json');
    try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        
        let config: ApiClientConfig;
        try {
            config = JSON.parse(fileContent);
        } catch (parseError) {
            // JSON inválido - loga warning com detalhes
            console.warn(`[MCP Config] Invalid JSON in config file: ${configPath}. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            throw parseError; // Re-throw para cair no fallback
        }
        
        // Basic validation
        if (!config.baseUrl || typeof config.baseUrl !== 'string') {
            console.warn(`[MCP Config] Invalid or missing baseUrl in config file: ${configPath}`);
            throw new Error('Invalid baseUrl in config file');
        }
        
        // Remove trailing slash from baseUrl
        config.baseUrl = config.baseUrl.replace(/\/$/, '');
        
        // Check for authentication - warning apenas se não houver autenticação
        if (!config.apiKey && !config.sessionToken) {
            console.warn('[MCP Config] No authentication method configured. Using for development only.');
        }
        
        debugLog(`Configuration loaded from ${configPath}`);
        return config;
    } catch (error) {
        // Diferencia entre arquivo não encontrado e outros erros
        if (error && typeof error === 'object' && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            // Arquivo não existe - log conciso de debug, não é um erro
            debugLog(`Config file not found at ${configPath}, falling back to environment variables`);
        }
        // Outros erros (JSON parse, validação) já foram logados acima
        // Continua para fallback com variáveis de ambiente
    }
    
    // Attempt 2: Load from environment variables
    const baseUrl = process.env.SINESYS_BASE_URL || 'http://localhost:3000';
    const apiKey = process.env.SINESYS_API_KEY;
    const sessionToken = process.env.SINESYS_SESSION_TOKEN;
    
    const config: ApiClientConfig = {
        baseUrl: baseUrl.replace(/\/$/, ''),
        apiKey,
        sessionToken
    };
    
    // Check for authentication - warning apenas se não houver autenticação
    if (!config.apiKey && !config.sessionToken) {
        console.warn('[MCP Config] No authentication method configured via environment variables. Using for development only.');
    }
    
    debugLog('Configuration loaded from environment variables');
    return config;
}