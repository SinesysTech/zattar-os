import { z } from 'zod';
import { SinesysApiClient } from '../client/index.js';
import type { ToolDefinition, ToolResponse } from '../types/index.js';
import { formatToolResponse, handleToolError } from './utils.js';

// Permissões são gerenciadas via campo `isSuperAdmin` (não há endpoint separado de permissões)

const usuariosTools: ToolDefinition[] = [
  {
    name: 'sinesys_listar_usuarios',
    description: 'Lista usuários do sistema com filtros (busca em nome completo, nome de exibição, CPF ou e-mail corporativo). Exemplo: {"pagina": 1, "limite": 10, "busca": "João", "ufOab": "MG"}',
    inputSchema: z.object({
      pagina: z.number().int().positive().optional(),
      limite: z.number().int().positive().optional(),
      busca: z.string().optional(),
      ativo: z.boolean().optional(),
      oab: z.string().optional(),
      ufOab: z.string().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        // API espera campos camelCase, enviar diretamente sem conversão
        const response = await client.get('/api/usuarios', args as Record<string, unknown>);
        if (!response.success) {
          return handleToolError(response.error || 'Erro desconhecido ao listar usuários');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_buscar_usuario_por_id',
    description: 'Busca usuário específico por ID com dados completos',
    inputSchema: z.object({
      usuario_id: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { usuario_id: number };
        const response = await client.get(`/api/usuarios/${typedArgs.usuario_id}`);
        if (!response.success) {
          return handleToolError(response.error || 'Usuário não encontrado');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_buscar_usuario_por_email',
    description: 'Busca usuário por e-mail corporativo (útil para verificar existência antes de criar)',
    inputSchema: z.object({
      email: z.string(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { email: string };
        const response = await client.get(`/api/usuarios/buscar/por-email/${encodeURIComponent(typedArgs.email)}`);
        if (!response.success) {
          return handleToolError(response.error || 'Usuário não encontrado');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_buscar_usuario_por_cpf',
    description: 'Busca usuário por CPF (aceita com ou sem formatação)',
    inputSchema: z.object({
      cpf: z.string(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { cpf: string };
        const response = await client.get(`/api/usuarios/buscar/por-cpf/${typedArgs.cpf}`);
        if (!response.success) {
          return handleToolError(response.error || 'Usuário não encontrado');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_criar_usuario',
    description: 'Cria novo usuário no sistema (cria conta em auth.users + registro em public.usuarios). Exemplo: {"nomeCompleto": "João Silva", "nomeExibicao": "João", "cpf": "12345678900", "emailCorporativo": "joao@email.com", "senha": "senha123"}',
    inputSchema: z.object({
      nomeCompleto: z.string(),
      nomeExibicao: z.string(),
      cpf: z.string(),
      emailCorporativo: z.string(),
      senha: z.string().min(6),
      rg: z.string().optional(),
      dataNascimento: z.string().optional(),
      genero: z.enum(['masculino', 'feminino', 'outro', 'prefiro_nao_informar']).optional(),
      oab: z.string().optional(),
      ufOab: z.string().optional(),
      emailPessoal: z.string().optional(),
      telefone: z.string().optional(),
      ramal: z.string().optional(),
      endereco: z.object({
        logradouro: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().optional(),
        pais: z.string().optional(),
        cep: z.string().optional(),
      }).optional(),
      ativo: z.boolean().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        // API espera campos camelCase, enviar diretamente sem conversão
        const response = await client.post('/api/usuarios', args as Record<string, unknown>);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao criar usuário');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_atualizar_usuario',
    description: 'Atualiza usuário existente (atualização parcial). Campo `isSuperAdmin` só pode ser alterado por outro super admin. Ao desativar (ativo=false), todos os itens atribuídos ao usuário serão automaticamente desatribuídos. Exemplo: {"usuarioId": 123, "nomeCompleto": "Novo Nome", "ativo": true}',
    inputSchema: z.object({
      usuarioId: z.number().int().positive(),
      nomeCompleto: z.string().optional(),
      nomeExibicao: z.string().optional(),
      cpf: z.string().optional(),
      rg: z.string().optional(),
      dataNascimento: z.string().optional(),
      genero: z.enum(['masculino', 'feminino', 'outro', 'prefiro_nao_informar']).optional(),
      oab: z.string().optional(),
      ufOab: z.string().optional(),
      emailPessoal: z.string().optional(),
      emailCorporativo: z.string().optional(),
      telefone: z.string().optional(),
      ramal: z.string().optional(),
      endereco: z.object({}).optional(), // Partial object, as per API
      ativo: z.boolean().optional(),
      isSuperAdmin: z.boolean().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const typedArgs = args as { usuarioId: number; [key: string]: unknown };
        const { usuarioId, ...dados } = typedArgs;
        // API espera campos camelCase, enviar diretamente sem conversão
        const response = await client.patch(`/api/usuarios/${usuarioId}`, dados);
        if (!response.success) {
          return handleToolError(response.error || 'Erro ao atualizar usuário');
        }
        return formatToolResponse(response.data);
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
];

export { usuariosTools };