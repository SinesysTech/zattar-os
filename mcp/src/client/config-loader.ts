import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ApiClientConfig } from '../types/index';

export function loadConfig(): ApiClientConfig {
    // Attempt 1: Load from user config file
    const configPath = path.join(os.homedir(), '.sinesys', 'config.json');
    try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const config: ApiClientConfig = JSON.parse(fileContent);
        
        // Basic validation
        if (!config.baseUrl || typeof config.baseUrl !== 'string') {
            throw new Error('Invalid baseUrl in config file');
        }
        
        // Remove trailing slash from baseUrl
        config.baseUrl = config.baseUrl.replace(/\/$/, '');
        
        // Check for authentication
        if (!config.apiKey && !config.sessionToken) {
            console.warn('Warning: No authentication method configured in config file. Using for development only.');
        }
        
        console.log('Configuration loaded from ~/.sinesys/config.json');
        return config;
    } catch (error) {
        console.log('Config file not found or invalid, falling back to environment variables.');
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
    
    // Check for authentication
    if (!config.apiKey && !config.sessionToken) {
        console.warn('Warning: No authentication method configured via environment variables. Using for development only.');
    }
    
    console.log('Configuration loaded from environment variables.');
    return config;
}