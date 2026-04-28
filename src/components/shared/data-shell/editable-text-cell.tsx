'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface EditableTextCellProps {
    value: string | null;
    onSave: (newValue: string) => Promise<void>;
    title?: string;
    placeholder?: string;
    emptyPlaceholder?: string;
    className?: string;
    triggerClassName?: string;
}

export function EditableTextCell({
    value,
    onSave,
    title = 'Editar Observações',
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
                    'group relative min-w-10 min-h-5 cursor-pointer hover:bg-muted/50 transition-colors rounded px-1 -mx-1',
                    triggerClassName
                )}
            >
                <div className={cn(
                    'text-xs whitespace-pre-wrap wrap-break-word max-h-20 overflow-hidden text-ellipsis text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed',
                    className
                )}>
                    {value || (emptyPlaceholder ? <span className="opacity-30 italic">{emptyPlaceholder}</span> : null)}
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="sm:max-w-md glass-dialog overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
                >
                    <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription className="sr-only">Edite o texto e salve as alterações</DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <div className="px-6 py-4">
                            <Textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={placeholder}
                                className="resize-none min-h-37.5"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                    </DialogBody>
                    <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleSave}
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                                Salvar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
