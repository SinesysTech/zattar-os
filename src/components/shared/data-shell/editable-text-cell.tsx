'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DialogFormShell } from '@/components/shared/dialog-form-shell';
import { cn } from '@/lib/utils';

interface EditableTextCellProps {
    value: string | null;
    onSave: (newValue: string) => Promise<void>;
    title?: string;
    description?: string;
    placeholder?: string;
    emptyPlaceholder?: string;
    className?: string;
    triggerClassName?: string;
}

export function EditableTextCell({
    value,
    onSave,
    title = 'Editar Observações',
    description = 'Adicione ou edite as observações.',
    placeholder = 'Adicione observações...',
    emptyPlaceholder,
    className,
    triggerClassName,
}: EditableTextCellProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [text, setText] = React.useState(value || '');
    const [isLoading, setIsLoading] = React.useState(false);

    // Sync state with value prop when it changes or dialog opens
    React.useEffect(() => {
        if (isOpen) {
            setText(value || '');
        }
    }, [value, isOpen]);

    const handleSave = async () => {
        if (text === (value || '')) {
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            await onSave(text);
            setIsOpen(false);
        } catch (error) {
            console.error('Erro ao salvar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div
                onClick={() => setIsOpen(true)}
                className={cn(
                    'group relative min-w-10 min-h-[20px] cursor-pointer hover:bg-muted/50 transition-colors rounded px-1 -mx-1',
                    triggerClassName
                )}
            >
                <div className={cn(
                    'text-sm whitespace-pre-wrap break-words max-h-[80px] overflow-hidden text-ellipsis text-muted-foreground group-hover:text-foreground transition-colors',
                    className
                )}>
                    {value || (emptyPlaceholder ? <span className="opacity-30 italic">{emptyPlaceholder}</span> : null)}
                </div>
            </div>

            <DialogFormShell
                open={isOpen}
                onOpenChange={setIsOpen}
                title={title}
                description={description}
                maxWidth="md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading && <span className="mr-2 animate-spin">⏳</span>}
                            Salvar
                        </Button>
                    </div>
                }
            >
                <div className="py-2">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={placeholder}
                        className="resize-none min-h-[150px]"
                        disabled={isLoading}
                        autoFocus
                    />
                </div>
            </DialogFormShell>
        </>
    );
}
