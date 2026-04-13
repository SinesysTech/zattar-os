/* eslint-disable @typescript-eslint/no-explicit-any */
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
 * Adapter: Usa getUserMailConfig para obter MailConfig do usuário autenticado.
 * As funções de @/lib/mail/ operam diretamente via IMAP/SMTP (não são services FSD).
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo Mail
 */
export async function registerMailTools(): Promise<void> {
  const { listFolders, listMessages, getMessage, searchMessages } = await import('@/lib/mail/imap-client');
  const { sendEmail } = await import('@/lib/mail/smtp-client');
  const { getUserMailConfig } = await import('@/lib/mail/credentials');
  const { getCurrentUser } = await import('@/lib/auth/server');

  /**
   * Helper: obtém MailConfig do usuário autenticado
   */
  async function getAuthenticatedMailConfig() {
    const user = await getCurrentUser();
    if (!user) return { error: 'Usuário não autenticado' as const, config: null, userId: null };
    const config = await getUserMailConfig(user.id);
    if (!config) return { error: 'Credenciais de email não configuradas' as const, config: null, userId: user.id };
    return { error: null, config, userId: user.id };
  }

  /**
   * Lista pastas do email (INBOX, Sent, Drafts, etc.)
   */
  registerMcpTool({
    name: 'mail_listar_pastas',
    description: 'Lista pastas do email do usuário (INBOX, Sent, Drafts, etc.) com contagem de mensagens e não lidas',
    feature: 'mail',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const { error, config } = await getAuthenticatedMailConfig();
        if (error || !config) return errorResult(error || 'Erro ao obter configuração');

        const folders = await listFolders(config);
        return jsonResult({
          message: `${folders.length} pasta(s) encontrada(s)`,
          data: folders,
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
      pasta: z.string().describe('Nome da pasta (ex: INBOX, Sent, Drafts)'),
      pagina: z.number().min(1).default(1).describe('Página'),
      limite: z.number().min(1).max(50).default(20).describe('Mensagens por página'),
    }),
    handler: async (args) => {
      try {
        const { error, config } = await getAuthenticatedMailConfig();
        if (error || !config) return errorResult(error || 'Erro ao obter configuração');

         
        const result = await listMessages(config, (args as any).pasta, (args as any).pagina, (args as any).limite);
        return jsonResult({
          message: `${result.data.length} mensagem(ns) na pasta ${args.pasta}`,
          data: result,
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
      pasta: z.string().describe('Pasta onde a mensagem está'),
      uid: z.number().describe('UID da mensagem'),
    }),
    handler: async (args) => {
      try {
        const { error, config } = await getAuthenticatedMailConfig();
        if (error || !config) return errorResult(error || 'Erro ao obter configuração');

        const message = await getMessage(config, args.pasta, args.uid);
        if (!message) return errorResult('Mensagem não encontrada');

        return jsonResult({
          message: `Mensagem: ${message.subject}`,
          data: {
            uid: message.uid,
            from: message.from,
            to: message.to,
            cc: message.cc,
            subject: message.subject,
            text: message.text,
            date: message.date,
            flags: message.flags,
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
      pasta: z.string().describe('Pasta onde buscar'),
      busca: z.string().describe('Texto para buscar (assunto, remetente, conteúdo)'),
    }),
    handler: async (args) => {
      try {
        const { error, config } = await getAuthenticatedMailConfig();
        if (error || !config) return errorResult(error || 'Erro ao obter configuração');

        const messages = await searchMessages(config, args.pasta, args.busca);
        return jsonResult({
          message: `${messages.length} mensagem(ns) encontrada(s)`,
          data: messages,
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
      para: z.array(z.string().email()).describe('Destinatários (emails)'),
      assunto: z.string().describe('Assunto do email'),
      texto: z.string().describe('Corpo do email em texto'),
      cc: z.array(z.string().email()).optional().describe('Cópia (CC)'),
      cco: z.array(z.string().email()).optional().describe('Cópia oculta (BCC)'),
    }),
    handler: async (args) => {
      try {
        const { error, config } = await getAuthenticatedMailConfig();
        if (error || !config) return errorResult(error || 'Erro ao obter configuração');

        await sendEmail(config, {
          to: args.para,
          subject: args.assunto,
          text: args.texto,
          cc: args.cc,
          bcc: args.cco,
        });

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
