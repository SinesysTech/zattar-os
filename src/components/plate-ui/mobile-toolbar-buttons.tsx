'use client';

import * as React from 'react';
import {
    BoldIcon,
    ItalicIcon,
    UnderlineIcon,
    WandSparklesIcon,
    List,
    ListOrdered,
    ImageIcon,
    Link as LinkIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';
import { AIToolbarButton } from './ai-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import { MediaToolbarButton } from './media-toolbar-button';
import {
    BulletedListToolbarButton,
    NumberedListToolbarButton,
} from './list-toolbar-button';
import { ToolbarGroup } from './toolbar';

/**
 * Botões essenciais da toolbar para mobile
 * Apenas as opções mais usadas para economizar espaço
 */
export function MobileToolbarButtons() {
    const readOnly = useEditorReadOnly();

    return (
        <div className="flex w-full flex-wrap gap-1">
            {!readOnly && (
                <>
                    <ToolbarGroup>
                        <AIToolbarButton tooltip="AI">
                            <WandSparklesIcon className="h-4 w-4" />
                        </AIToolbarButton>
                    </ToolbarGroup>

                    <ToolbarGroup>
                        <MarkToolbarButton nodeType={KEYS.bold} tooltip="Negrito">
                            <BoldIcon className="h-4 w-4" />
                        </MarkToolbarButton>

                        <MarkToolbarButton nodeType={KEYS.italic} tooltip="Itálico">
                            <ItalicIcon className="h-4 w-4" />
                        </MarkToolbarButton>

                        <MarkToolbarButton nodeType={KEYS.underline} tooltip="Sublinhado">
                            <UnderlineIcon className="h-4 w-4" />
                        </MarkToolbarButton>
                    </ToolbarGroup>

                    <ToolbarGroup>
                        <NumberedListToolbarButton />
                        <BulletedListToolbarButton />
                    </ToolbarGroup>

                    <ToolbarGroup>
                        <LinkToolbarButton />
                        <MediaToolbarButton nodeType={KEYS.img} />
                    </ToolbarGroup>
                </>
            )}
        </div>
    );
}
