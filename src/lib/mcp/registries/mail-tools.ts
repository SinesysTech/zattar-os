/**
 * Registro de Ferramentas MCP - Mail
 *
 * Tools disponíveis:
 * - mail_listar_pastas: Lista pastas do email (INBOX, Sent, etc.)
 * - mail_listar_mensagens: Lista mensagens de uma pasta com paginação
 * - mail_ler_mensagem: Lê mensagem completa por UID
 * - mail_buscar_mensagens: Busca mensagens por critérios
 * - mail_enviar_email: Envia email via SMTP
 *
 * IMPORTANTE: As ferramentas MCP chamam o SERVICE do módulo FSD diretamente,
 * não os clientes de protocolo em @/lib/mail/.
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo Mail
 */
export async function registerMailTools(): Promise<void> {
  const {
    listarPastas,
    listarMensagens,
    lerMensagem,
    buscarMensagens,
    enviarEmail,
  } = await import('@/app/(authenticated)/mail/service');
  const { getCurrentUser } = await import('@/lib/auth/server');

  /**
   * Helper: obtém userId autenticado
   */
  async function getAuthUserId() {
    const user = await getCurrentUser();
    if (!user) return null;
    return user.id;
  }

  /**
   * Lista pastas do email (INBOX, Sent, Drafts, etc.)
   */
  registerMcpTool({
    name: 'mail_listar_pastas',
    description: 'Lista pastas do email do usuário (INBOX, Sent, Drafts, etc.) com contagem de mensagens e não lidas',
    feature: 'mail',
    requiresAuth: true,
    schema: z.object({
      accountId: z.number().optional().describe('ID da conta de email (multi-conta)'),
    }),
    handler: async (args) => {
      try {
        const userId = await getAuthUserId();
        if (!userId) return errorResult('Usuário não autenticado');

        const result = await listarPastas(userId, args.accountId);
        if (!result.success) return errorResult(result.error.message);

        return jsonResult({
          message: `${result.data.length} pasta(s) encontrada(s)`,
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar pastas');
      }
    },
  });

  /**
   * Lista mensagens de uma pasta com paginação
   */
  registerMcpTool({
    name: 'mail_listar_mensagens',
    description: 'Lista mensagens de uma pasta de email com paginação (preview, remetente, assunto, data)',
    feature: 'mail',
    requiresAuth: true,
    schema: z.object({
      pasta: z.string().default('INBOX').describe('Nome da pasta (ex: INBOX, Sent, Drafts)'),
      pagina: z.number().min(1).default(1).describe('Página'),
      limite: z.number().min(1).max(50).default(20).describe('Mensagens por página'),
      accountId: z.number().optional().describe('ID da conta de email'),
    }),
    handler: async (args) => {
      try {
        const userId = await getAuthUserId();
        if (!userId) return errorResult('Usuário não autenticado');

        const result = await listarMensagens(userId, args);
        if (!result.success) return errorResult(result.error.message);

        return jsonResult({
          message: `${result.data.data.length} mensagem(ns) na pasta ${args.pasta}`,
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar mensagens');
      }
    },
  });

  /**
   * Lê mensagem completa por UID
   */
  registerMcpTool({
    name: 'mail_ler_mensagem',
    description: 'Lê o conteúdo completo de uma mensagem de email por UID (texto, remetente, destinatários, data)',
    feature: 'mail',
    requiresAuth: true,
    schema: z.object({
      pasta: z.string().default('INBOX').describe('Pasta onde a mensagem está'),
      uid: z.number().describe('UID da mensagem'),
      accountId: z.number().optional().describe('ID da conta de email'),
    }),
    handler: async (args) => {
      try {
        const userId = await getAuthUserId();
        if (!userId) return errorResult('Usuário não autenticado');

        const result = await lerMensagem(userId, { ...args, pasta: args.pasta ?? 'INBOX' });
        if (!result.success) return errorResult(result.error.message);
        if (!result.data) return errorResult('Mensagem não encontrada');

        return jsonResult({
          message: `Mensagem: ${result.data.subject}`,
          data: {
            uid: result.data.uid,
            from: result.data.from,
            to: result.data.to,
            cc: result.data.cc,
            subject: result.data.subject,
            text: result.data.text,
            date: result.data.date,
            flags: result.data.flags,
          },
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao ler mensagem');
      }
    },
  });

  /**
   * Busca mensagens por critérios textuais
   */
  registerMcpTool({
    name: 'mail_buscar_mensagens',
    description: 'Busca mensagens de email por critérios textuais (assunto, remetente, conteúdo)',
    feature: 'mail',
    requiresAuth: true,
    schema: z.object({
      pasta: z.string().default('INBOX').describe('Pasta onde buscar'),
      busca: z.string().describe('Texto para buscar (assunto, remetente, conteúdo)'),
      accountId: z.number().optional().describe('ID da conta de email'),
    }),
    handler: async (args) => {
      try {
        const userId = await getAuthUserId();
        if (!userId) return errorResult('Usuário não autenticado');

        const result = await buscarMensagens(userId, { ...args, pasta: args.pasta ?? 'INBOX' });
        if (!result.success) return errorResult(result.error.message);

        return jsonResult({
          message: `${result.data.length} mensagem(ns) encontrada(s)`,
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar mensagens');
      }
    },
  });

  /**
   * Envia email via SMTP
   */
  registerMcpTool({
    name: 'mail_enviar_email',
    description: 'Envia email via SMTP usando as credenciais do usuário autenticado',
    feature: 'mail',
    requiresAuth: true,
    schema: z.object({
      para: z.array(z.string()).describe('Destinatários (emails)'),
      assunto: z.string().describe('Assunto do email'),
      texto: z.string().describe('Corpo do email em texto'),
      cc: z.array(z.string()).optional().describe('Cópia (CC)'),
      cco: z.array(z.string()).optional().describe('Cópia oculta (BCC)'),
      accountId: z.number().optional().describe('ID da conta de email'),
    }),
    handler: async (args) => {
      try {
        const userId = await getAuthUserId();
        if (!userId) return errorResult('Usuário não autenticado');

        const result = await enviarEmail(userId, args);
        if (!result.success) return errorResult(result.error.message);

        return jsonResult({
          message: `Email enviado para ${args.para.join(', ')}`,
          data: { enviado: true, destinatarios: args.para },
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao enviar email');
      }
    },
  });
}
