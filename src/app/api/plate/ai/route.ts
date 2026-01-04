/**
 * @swagger
 * /api/plate/ai:
 *   post:
 *     summary: Processa comandos AI no editor de documentos
 *     description: |
 *       Endpoint seguro para processar comandos de AI no editor Plate.
 *       A API key é gerenciada exclusivamente no servidor via variável de ambiente.
 *       Inclui system prompts especializados em Direito Brasileiro.
 *     tags:
 *       - AI
 *       - Documentos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ctx
 *             properties:
 *               ctx:
 *                 type: object
 *                 description: Contexto do editor
 *                 properties:
 *                   children:
 *                     type: array
 *                     description: Conteúdo do editor
 *                   selection:
 *                     type: object
 *                     description: Seleção atual
 *                   toolName:
 *                     type: string
 *                     enum: [generate, edit, comment]
 *                     description: Ferramenta a ser usada
 *               messages:
 *                 type: array
 *                 description: Histórico de mensagens do chat
 *               model:
 *                 type: string
 *                 description: Modelo de linguagem a ser usado (opcional)
 *     responses:
 *       200:
 *         description: Stream de resposta AI
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       401:
 *         description: API key do servidor não configurada
 *       500:
 *         description: Erro ao processar requisição AI
 */

import type {
  ChatMessage,
  ToolName,
} from '@/components/editor/types/chat-editor-types';
import type { NextRequest } from 'next/server';

import {
  type LanguageModel,
  type UIMessageStreamWriter,
  createGateway,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateObject,
  streamObject,
  streamText,
  tool,
} from 'ai';
import { NextResponse } from 'next/server';
import { type SlateEditor, createSlateEditor, nanoid } from 'platejs';
import { z } from 'zod';

import { BaseEditorKit } from '@/components/editor/plate/editor-base-kit';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  checkRateLimit,
  getRateLimitHeaders,
  type RateLimitTier,
} from '@/lib/mcp/rate-limit';

import {
  getChooseToolPrompt,
  getCommentPrompt,
  getEditPrompt,
  getGeneratePrompt,
} from './prompts';

// Modelos padrão para o editor de documentos jurídicos
const DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL || 'openai/gpt-4o-mini';
const TOOL_CHOICE_MODEL =
  process.env.AI_TOOL_CHOICE_MODEL || 'google/gemini-2.5-flash';
const COMMENT_MODEL = process.env.AI_COMMENT_MODEL || 'google/gemini-2.5-flash';

function getClientIp(request: NextRequest) {
  const headers = request.headers;
  if (headers.get('x-forwarded-for')) {
    return headers.get('x-forwarded-for')!.split(',')[0].trim();
  }

  if (headers.get('x-real-ip')) return headers.get('x-real-ip')!;
  if (headers.get('cf-connecting-ip')) return headers.get('cf-connecting-ip')!;
  if (headers.get('x-client-ip')) return headers.get('x-client-ip')!;
  if (headers.get('x-cluster-client-ip')) return headers.get('x-cluster-client-ip')!;
  return 'unknown';
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const authResult = await authenticateRequest(req);
  const userId = authResult.usuarioId || null;

  let tier: RateLimitTier = 'anonymous';
  if (authResult.source === 'service') {
    tier = 'service';
  } else if (authResult.authenticated && userId) {
    tier = 'authenticated';
  }

  const identifier = userId?.toString() || getClientIp(req);

  const rateLimitResult = await checkRateLimit(identifier, tier);
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
  if (!rateLimitResult.allowed) {
    console.log(`[Plate AI] Rate limit excedido para ${identifier} (tier: ${tier})`);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT',
        retryAfter: rateLimitResult.resetAt.toISOString(),
      },
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    );
  }

  const {
    ctx,
    messages: messagesRaw = [],
    model,
  } = await req.json();

  const { children, selection, toolName: toolNameParam } = ctx;

  const editor = createSlateEditor({
    plugins: BaseEditorKit,
    selection,
    value: children,
  });

  // SEGURANÇA: Usar APENAS a API key do servidor
  // Não aceitar API key do cliente para evitar exposição de chaves
  const apiKey = process.env.AI_GATEWAY_API_KEY;

  if (!apiKey) {
    console.warn('[Plate AI] API key não configurada. Configure AI_GATEWAY_API_KEY para habilitar recursos de IA.');
    return NextResponse.json(
      {
        error: 'AI Gateway API key não configurada no servidor. Configure a variável de ambiente AI_GATEWAY_API_KEY.',
        code: 'MISSING_API_KEY'
      },
      { status: 401, headers: rateLimitHeaders }
    );
  }

  const isSelecting = editor.api.isExpanded();

  const gatewayProvider = createGateway({
    apiKey,
  });

  try {
    const stream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        let toolName = toolNameParam;

        if (!toolName) {
          const { object: AIToolName } = await generateObject({
            enum: isSelecting
              ? ['generate', 'edit', 'comment']
              : ['generate', 'comment'],
            model: gatewayProvider(model || TOOL_CHOICE_MODEL),
            output: 'enum',
            prompt: getChooseToolPrompt({ messages: messagesRaw }),
          });

          writer.write({
            data: AIToolName as ToolName,
            type: 'data-toolName',
          });

          toolName = AIToolName;
        }

        const stream = streamText({
          model: gatewayProvider(model || DEFAULT_MODEL),
          // Not used
          prompt: '',
          tools: {
            comment: getCommentTool(editor, {
              messagesRaw,
              model: gatewayProvider(model || COMMENT_MODEL),
              writer,
            }),
          },
          prepareStep: async (step) => {
            if (toolName === 'comment') {
              return {
                ...step,
                toolChoice: { toolName: 'comment', type: 'tool' },
              };
            }

            if (toolName === 'edit') {
              const editPrompt = getEditPrompt(editor, {
                isSelecting,
                messages: messagesRaw,
              });

              return {
                ...step,
                activeTools: [],
                messages: [
                  {
                    content: editPrompt,
                    role: 'user',
                  },
                ],
              };
            }

            if (toolName === 'generate') {
              const generatePrompt = getGeneratePrompt(editor, {
                messages: messagesRaw,
              });

              return {
                ...step,
                activeTools: [],
                messages: [
                  {
                    content: generatePrompt,
                    role: 'user',
                  },
                ],
                model: gatewayProvider(model || DEFAULT_MODEL),
              };
            }
          },
        });

        writer.merge(stream.toUIMessageStream({ sendFinish: false }));
      },
    });

    const response = createUIMessageStreamResponse({ stream });
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        ...rateLimitHeaders,
      },
    });
  } catch (error) {
    console.error('[Plate AI] Erro ao processar requisição:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao processar requisição AI. Tente novamente em alguns instantes.',
        code: 'PROCESSING_ERROR'
      },
      { status: 500, headers: rateLimitHeaders }
    );
  } finally {
    const elapsedMs = Date.now() - startedAt;
    console.log(
      `[Plate AI] Request finished tier=${tier} identifier=${identifier} elapsedMs=${elapsedMs}`
    );
  }
}

const getCommentTool = (
  editor: SlateEditor,
  {
    messagesRaw,
    model,
    writer,
  }: {
    messagesRaw: ChatMessage[];
    model: LanguageModel;
    writer: UIMessageStreamWriter<ChatMessage>;
  }
) =>
  tool({
    description: 'Comentar sobre o conteúdo jurídico',
    inputSchema: z.object({}),
    execute: async () => {
      const { elementStream } = streamObject({
        model,
        output: 'array',
        prompt: getCommentPrompt(editor, {
          messages: messagesRaw,
        }),
        schema: z
          .object({
            blockId: z
              .string()
              .describe(
                'O id do bloco inicial. Se o comentário abranger múltiplos blocos, use o id do primeiro bloco.'
              ),
            comment: z
              .string()
              .describe('Um breve comentário ou explicação jurídica para este fragmento.'),
            content: z
              .string()
              .describe(
                String.raw`O fragmento original do documento a ser comentado. Pode ser o bloco inteiro, uma pequena parte dentro de um bloco, ou abranger múltiplos blocos. Se abranger múltiplos blocos, separe-os com dois \n\n.`
              ),
          })
          .describe('Um comentário jurídico'),
      });

      for await (const comment of elementStream) {
        const commentDataId = nanoid();

        writer.write({
          id: commentDataId,
          data: {
            comment,
            status: 'streaming',
          },
          type: 'data-comment',
        });
      }

      writer.write({
        id: nanoid(),
        data: {
          comment: null,
          status: 'finished',
        },
        type: 'data-comment',
      });
    },
  });
