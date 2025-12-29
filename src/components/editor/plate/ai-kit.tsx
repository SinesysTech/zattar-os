'use client';

import * as ai from '@platejs/ai';
import * as aiReact from '@platejs/ai/react';
import { type AnyPluginConfig, getPluginType, KEYS, PathApi } from 'platejs';
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

    const mode = usePluginOption(AIChatPlugin as any, 'mode');
    const toolName = usePluginOption(AIChatPlugin as any, 'toolName');
    useChatChunk({
      onChunk: ({ chunk, isFirst, nodes, text: content }) => {
        if (isFirst && mode === 'insert') {
          editor.tf.withoutSaving(() => {
            editor.tf.insertNodes(
              {
                children: [{ text: '' }],
                type: getPluginType(editor, KEYS.aiChat),
              },
              {
                at: PathApi.next(editor.selection!.focus.path.slice(0, 1)),
              }
            );
          });
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
        editor.setOption(AIChatPlugin as any, 'streaming', false);
        editor.setOption(AIChatPlugin as any, '_blockChunks', '');
        editor.setOption(AIChatPlugin as any, '_blockPath', null);
        editor.setOption(AIChatPlugin as any, '_mdxName', null);
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
