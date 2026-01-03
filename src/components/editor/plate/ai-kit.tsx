'use client';

import * as ai from '@platejs/ai';
import * as aiReact from '@platejs/ai/react';
import { type AnyPluginConfig, type Path, getPluginType, KEYS, PathApi } from 'platejs';
import { type PlateEditor, usePluginOption } from 'platejs/react';

import { AILoadingBar, AIMenu } from '@/components/editor/plate-ui/ai-menu';
import { AIAnchorElement, AILeaf } from '@/components/editor/plate-ui/ai-node';

import { useChat } from '../use-chat';
import { CursorOverlayKit } from './cursor-overlay-kit';
import { MarkdownKit } from './markdown-kit';

type UnknownFn = (...args: unknown[]) => unknown;

const aiExports = ai as unknown as Record<string, unknown>;
const aiReactExports = aiReact as unknown as Record<string, unknown>;

export const getAIContent = aiExports['getAIContent'] as UnknownFn;
export const isAINode = aiExports['isAINode'] as UnknownFn;
export const useAIState = aiReactExports['useAIState'] as UnknownFn;

const withAIBatch = aiExports['withAIBatch'] as unknown as (
  editor: PlateEditor,
  fn: () => void,
  options?: unknown
) => void;

interface PluginConfig {
  extend: (config: unknown) => unknown;
  key?: string;
}

const AIChatPlugin = aiReactExports['AIChatPlugin'] as PluginConfig;
const AIPlugin = aiReactExports['AIPlugin'] as unknown as { withComponent: (component: unknown) => unknown };
const applyAISuggestions = aiReactExports['applyAISuggestions'] as unknown as (
  editor: PlateEditor,
  content: unknown
) => void;
const streamInsertChunk = aiReactExports['streamInsertChunk'] as unknown as (
  editor: PlateEditor,
  chunk: unknown,
  options?: unknown
) => void;
const useChatChunk = aiReactExports['useChatChunk'] as unknown as (options: {
  onChunk: (args: {
    chunk: unknown;
    isFirst: boolean;
    nodes: unknown[];
    text: unknown;
  }) => void;
  onFinish: () => void;
}) => void;

const AIMarkdownPlugin = aiReactExports['AIMarkdownPlugin'] as unknown;
const AIMdxPlugin = aiReactExports['AIMdxPlugin'] as unknown;

export const aiChatPlugin = AIChatPlugin.extend({
  options: {
    chatOptions: {
      // Rota segura com API key gerenciada no servidor e prompts jurídicos brasileiros
      api: '/api/plate/ai',
      body: {},
    },
  },
  render: {
    afterContainer: AILoadingBar,
    afterEditable: AIMenu,
    node: AIAnchorElement,
  },
  shortcuts: { show: { keys: 'mod+j' } },
  useHooks: ({ editor, getOption }: { editor: PlateEditor; getOption: (key: string) => unknown }) => {
    useChat();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Plugin type from external library
    const mode = usePluginOption(AIChatPlugin as any, 'mode');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Plugin type from external library
    const toolName = usePluginOption(AIChatPlugin as any, 'toolName');
    useChatChunk({
      onChunk: ({ chunk, isFirst, nodes, text: content }) => {
        if (isFirst && mode === 'insert') {
          editor.tf.withoutSaving(() => {
            // Verificar se há seleção válida antes de acessar
            let insertPath: Path;
            if (editor.selection?.focus?.path) {
              insertPath = PathApi.next(editor.selection.focus.path.slice(0, 1));
            } else {
              // Fallback: usar o bloco atual se não houver seleção
              const block = editor.api.block();
              if (block) {
                insertPath = PathApi.next(block[1].slice(0, 1));
              } else {
                // Último fallback: usar o início do documento
                insertPath = [0];
              }
            }

            editor.tf.insertNodes(
              {
                children: [{ text: '' }],
                type: getPluginType(editor, KEYS.aiChat),
              },
              {
                at: insertPath,
              }
            );
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Plugin type from external library
          editor.setOption(AIChatPlugin as any, 'streaming', true);
        }

        if (mode === 'insert' && nodes.length > 0) {
          withAIBatch(
            editor,
            () => {
              if (!getOption('streaming')) return;
              editor.tf.withScrolling(() => {
                streamInsertChunk(editor, chunk, {
                  textProps: {
                    [getPluginType(editor, KEYS.ai)]: true,
                  },
                });
              });
            },
            { split: isFirst }
          );
        }

        if (toolName === 'edit' && mode === 'chat') {
          withAIBatch(
            editor,
            () => {
              applyAISuggestions(editor, content);
            },
            {
              split: isFirst,
            }
          );
        }
      },
      onFinish: () => {
        /* eslint-disable @typescript-eslint/no-explicit-any -- Plugin type from external library */
        editor.setOption(AIChatPlugin as any, 'streaming', false);
        editor.setOption(AIChatPlugin as any, '_blockChunks', '');
        editor.setOption(AIChatPlugin as any, '_blockPath', null);
        editor.setOption(AIChatPlugin as any, '_mdxName', null);
        /* eslint-enable @typescript-eslint/no-explicit-any */
      },
    });
  },
}) as AnyPluginConfig;

export const AIKit: AnyPluginConfig[] = [
  ...CursorOverlayKit,
  ...MarkdownKit,
  ...(AIMarkdownPlugin ? [AIMarkdownPlugin as AnyPluginConfig] : []),
  ...(AIMdxPlugin ? [AIMdxPlugin as AnyPluginConfig] : []),
  AIPlugin.withComponent(AILeaf) as AnyPluginConfig,
  aiChatPlugin,
];
