'use client';

import { type AnyPluginConfig, type Value, TrailingBlockPlugin } from 'platejs';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

import { AIKit } from '@/components/editor/plate/ai-kit';
import { AlignKit } from '@/components/editor/plate/align-kit';
import { AutoformatKit } from '@/components/editor/plate/autoformat-kit';
import { BasicBlocksKit } from '@/components/editor/plate/basic-blocks-kit';
import { BasicMarksKit } from '@/components/editor/plate/basic-marks-kit';
import { BlockMenuKit } from '@/components/editor/plate/block-menu-kit';
import { BlockPlaceholderKit } from '@/components/editor/plate/block-placeholder-kit';
import { CalloutKit } from '@/components/editor/plate/callout-kit';
import { CodeBlockKit } from '@/components/editor/plate/code-block-kit';
import { ColumnKit } from '@/components/editor/plate/column-kit';
import { CommentKit } from '@/components/editor/plate/comment-kit';
import { CopilotKit } from '@/components/editor/plate/copilot-kit';
import { CursorOverlayKit } from '@/components/editor/plate/cursor-overlay-kit';
import { DateKit } from '@/components/editor/plate/date-kit';
import { DiscussionKit } from '@/components/editor/plate/discussion-kit';
import { DndKit } from '@/components/editor/plate/dnd-kit';
import { DocxKit } from '@/components/editor/plate/docx-kit';
import { EmojiKit } from '@/components/editor/plate/emoji-kit';
import { ExitBreakKit } from '@/components/editor/plate/exit-break-kit';
import { FloatingToolbarKit } from '@/components/editor/plate/floating-toolbar-kit';
import { FontKit } from '@/components/editor/plate/font-kit';
import { LineHeightKit } from '@/components/editor/plate/line-height-kit';
import { LinkKit } from '@/components/editor/plate/link-kit';
import { ListKit } from '@/components/editor/plate/list-kit';
import { MarkdownKit } from '@/components/editor/plate/markdown-kit';
import { MathKit } from '@/components/editor/plate/math-kit';
import { MediaKit } from '@/components/editor/plate/media-kit';
import { MentionKit } from '@/components/editor/plate/mention-kit';
import { SlashKit } from '@/components/editor/plate/slash-kit';
import { SuggestionKit } from '@/components/editor/plate/suggestion-kit';
import { TableKit } from '@/components/editor/plate/table-kit';
import { TocKit } from '@/components/editor/plate/toc-kit';
import { ToggleKit } from '@/components/editor/plate/toggle-kit';
import { ResponsiveFixedToolbarKit } from '@/components/editor/plate/responsive-fixed-toolbar-kit';

/**
 * Editor Kit responsivo para Plate
 *
 * Usa ResponsiveFixedToolbarKit em vez de FixedToolbarKit
 * para suporte a mobile, tablet e desktop
 */
export const ResponsiveEditorKit: AnyPluginConfig[] = [
    ...CopilotKit,
    ...AIKit,

    // Elements
    ...BasicBlocksKit,
    ...CodeBlockKit,
    ...TableKit,
    ...ToggleKit,
    ...TocKit,
    ...MediaKit,
    ...CalloutKit,
    ...ColumnKit,
    ...MathKit,
    ...DateKit,
    ...LinkKit,
    ...MentionKit,

    // Marks
    ...BasicMarksKit,
    ...FontKit,

    // Block Style
    ...ListKit,
    ...AlignKit,
    ...LineHeightKit,

    // Collaboration
    ...DiscussionKit,
    ...CommentKit,
    ...SuggestionKit,

    // Editing
    ...SlashKit,
    ...AutoformatKit,
    ...CursorOverlayKit,
    ...BlockMenuKit,
    ...DndKit,
    ...EmojiKit,
    ...ExitBreakKit,
    TrailingBlockPlugin,

    // Parsers
    ...DocxKit,
    ...MarkdownKit,

    // UI
    ...BlockPlaceholderKit,
    ...ResponsiveFixedToolbarKit, // Usa toolbar responsiva
    ...FloatingToolbarKit,
];

export type ResponsiveEditor = TPlateEditor<Value, AnyPluginConfig>;

export const useResponsiveEditor = () => useEditorRef<ResponsiveEditor>();
