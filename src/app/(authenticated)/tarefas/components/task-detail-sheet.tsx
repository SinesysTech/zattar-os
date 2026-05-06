"use client";

import { cn } from '@/lib/utils';
import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Calendar as CalendarIcon,
    CheckCircle2,
    MessageSquare,
    Paperclip,
    Star,
    Trash2,
    Plus,
    MoreVertical,
    Upload,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Heading } from "@/components/ui/typography";

import type { Task, TarefaDisplayItem } from "../domain";
import { useTarefaStore } from "../store";
import { labels, priorities, statuses } from "../constants";
import * as actions from "../actions/tarefas-actions";
import { toast } from "sonner";

export function TaskDetailSheet() {
    const {
        selectedTarefaId,
        isTarefaSheetOpen,
        setTarefaSheetOpen,
        setSelectedTarefaId,
        tarefas,
        upsertTarefa,
        removeTarefa
    } = useTarefaStore();

    const [newSubtask, setNewSubtask] = React.useState("");
    const [newComment, setNewComment] = React.useState("");
    const [isPending, startTransition] = React.useTransition();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const tarefa = React.useMemo(
        () => tarefas.find((t) => t.id === selectedTarefaId),
        [tarefas, selectedTarefaId]
    );

    if (!tarefa && isTarefaSheetOpen) {
        return null;
    }

    // Preserva campos de display (url, prazoVencido etc.) ao converter Task → TarefaDisplayItem
    const preserveDisplayData = (task: Task, display: TarefaDisplayItem): TarefaDisplayItem => ({
        ...task,
        url: display.url,
        prazoVencido: display.prazoVencido,
        responsavelNome: display.responsavelNome,
        date: display.date,
        isVirtual: false,
    });

    // Materializa tarefa virtual em registro real no banco (se necessário)
    const ensureMaterialized = async (): Promise<TarefaDisplayItem | null> => {
        if (!tarefa) return null;
        if (!tarefa.isVirtual) return tarefa;

        const result = await actions.actionMaterializarTarefaVirtual({
            title: tarefa.title,
            status: tarefa.status,
            label: tarefa.label,
            priority: tarefa.priority,
            dueDate: tarefa.dueDate ?? null,
            source: tarefa.source!,
            sourceEntityId: tarefa.sourceEntityId!,
        });

        if (!result.success) {
            toast.error("Erro ao preparar tarefa para edição");
            return null;
        }

        const displayItem = preserveDisplayData(result.data as Task, tarefa);

        // Substituir tarefa virtual pela materializada no store
        removeTarefa(tarefa.id);
        upsertTarefa(displayItem);
        setSelectedTarefaId(displayItem.id);

        return displayItem;
    };

    const handleClose = () => {
        setTarefaSheetOpen(false);
        setSelectedTarefaId(null);
    };

    const handleToggleStarred = () => {
        if (!tarefa) return;
        startTransition(async () => {
            const result = await actions.actionAtualizarTarefa({
                id: tarefa.id,
                starred: !tarefa.starred,
            });
            if (result.success) {
                upsertTarefa({ ...tarefa, starred: !tarefa.starred });
            }
        });
    };

    const handleDeleteTask = () => {
        if (!tarefa) return;
        if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
            startTransition(async () => {
                const result = await actions.actionRemoverTarefa({ id: tarefa.id });
                if (result.success) {
                    removeTarefa(tarefa.id);
                    handleClose();
                    toast.success("Tarefa excluída com sucesso");
                }
            });
        }
    };

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tarefa || !newSubtask.trim()) return;

        startTransition(async () => {
            const current = await ensureMaterialized();
            if (!current) return;

            const result = await actions.actionCriarSubtarefa({
                taskId: current.id,
                title: newSubtask,
            });
            if (result.success) {
                upsertTarefa(preserveDisplayData(result.data as Task, current));
                setNewSubtask("");
            }
        });
    };

    const handleToggleSubtask = (subTaskId: string, completed: boolean) => {
        if (!tarefa) return;
        startTransition(async () => {
            const result = await actions.actionAtualizarSubtarefa({
                taskId: tarefa.id,
                subTaskId,
                completed,
            });
            if (result.success) {
                upsertTarefa(result.data as TarefaDisplayItem);
            }
        });
    };

    const handleDeleteSubtask = (subTaskId: string) => {
        if (!tarefa) return;
        startTransition(async () => {
            const result = await actions.actionRemoverSubtarefa({
                taskId: tarefa.id,
                subTaskId,
            });
            if (result.success) {
                upsertTarefa(result.data as TarefaDisplayItem);
            }
        });
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tarefa || !newComment.trim()) return;

        startTransition(async () => {
            const current = await ensureMaterialized();
            if (!current) return;

            const result = await actions.actionAdicionarComentario({
                taskId: current.id,
                body: newComment,
            });
            if (result.success) {
                upsertTarefa(preserveDisplayData(result.data as Task, current));
                setNewComment("");
            }
        });
    };

    const handleDeleteComment = (commentId: string) => {
        if (!tarefa) return;
        startTransition(async () => {
            const result = await actions.actionRemoverComentario({
                taskId: tarefa.id,
                commentId,
            });
            if (result.success) {
                upsertTarefa(result.data as TarefaDisplayItem);
            }
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !tarefa) return;

        // Reset input para permitir selecionar o mesmo arquivo novamente
        e.target.value = "";

        const reader = new FileReader();
        reader.onload = () => {
            startTransition(async () => {
                const current = await ensureMaterialized();
                if (!current) return;

                const result = await actions.actionAdicionarAnexo({
                    taskId: current.id,
                    name: file.name,
                    url: reader.result as string,
                    type: file.type || undefined,
                    size: file.size,
                });
                if (result.success) {
                    upsertTarefa(preserveDisplayData(result.data as Task, current));
                    toast.success("Anexo adicionado");
                }
            });
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveFile = (fileId: string) => {
        if (!tarefa) return;
        startTransition(async () => {
            const result = await actions.actionRemoverAnexo({
                taskId: tarefa.id,
                fileId,
            });
            if (result.success) {
                upsertTarefa(result.data as TarefaDisplayItem);
                toast.success("Anexo removido");
            }
        });
    };

    const statusInfo = statuses.find((s) => s.value === tarefa?.status);
    const priorityInfo = priorities.find((p) => p.value === tarefa?.priority);
    const labelInfo = labels.find((l) => l.value === tarefa?.label);

    return (
        <Dialog open={isTarefaSheetOpen} onOpenChange={handleClose}>
            <DialogContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ " max-w-2xl max-h-[90vh] w-full p-0 flex flex-col")}>
                {tarefa && (
                    <div className="flex flex-1 min-h-0 flex-col">
                        <DialogHeader className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "border-b border-border/30 p-6 shrink-0")}>
                            <div className="flex items-center justify-between">
                                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                                    <Badge variant="outline" className="capitalize">
                                        {labelInfo?.icon && <labelInfo.icon className="mr-1 h-3 w-3" />}
                                        {labelInfo?.label || tarefa.label}
                                    </Badge>
                                    {tarefa.isVirtual && (
                                        <Badge variant="secondary" className="text-[10px]">Virtual</Badge>
                                    )}
                                </div>
                                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                                    <Button
                                        variant="ghost"
                                        size="icon" aria-label="Favoritar"
                                        className={tarefa.starred ? "text-warning" : "text-muted-foreground"}
                                        onClick={handleToggleStarred}
                                    >
                                        <Star className="h-5 w-5 fill-current" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" aria-label="Mais opções">
                                                <MoreVertical className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={handleDeleteTask}
                                                disabled={tarefa.isVirtual}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Excluir tarefa
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <DialogTitle className="mt-4 text-page-title leading-tight">
                                {tarefa.title}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Detalhes da tarefa, incluindo status, subtarefas, anexos e comentários.
                            </DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="flex-1">
                            <div className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "p-6")}>
                                {/* Status & Details Grid */}
                                <div className={cn(/* design-system-escape: gap-6 → migrar para <Inline gap="loose"> */ "grid grid-cols-2 gap-6 sm:grid-cols-3")}>
                                    <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1")}>
                                        <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-xs font-medium text-muted-foreground uppercase tracking-wider")}>Status</span>
                                        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                                            {statusInfo?.icon && <statusInfo.icon className="h-4 w-4 text-muted-foreground" />}
                                            <span className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium")}>{statusInfo?.label || tarefa.status}</span>
                                        </div>
                                    </div>
                                    <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1")}>
                                        <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-xs font-medium text-muted-foreground uppercase tracking-wider")}>Prioridade</span>
                                        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                                            {priorityInfo?.icon && <priorityInfo.icon className="h-4 w-4 text-muted-foreground" />}
                                            <span className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium")}>{priorityInfo?.label || tarefa.priority}</span>
                                        </div>
                                    </div>
                                    <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1 col-span-2 sm:col-span-1")}>
                                        <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-xs font-medium text-muted-foreground uppercase tracking-wider")}>Prazo</span>
                                        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-sm → migrar para <Text variant="body-sm"> */ "flex items-center gap-2 text-sm")}>
                                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                            <span>{tarefa.dueDate ? format(new Date(tarefa.dueDate), "dd/MM/yyyy", { locale: ptBR }) : "Sem prazo"}</span>
                                        </div>
                                    </div>
                                </div>

                                {tarefa.description && (
                                    <>
                                        <Separator className={cn(/* design-system-escape: my-6 margin sem primitiva DS */ "my-6")} />
                                        <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                                            <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-xs font-medium text-muted-foreground uppercase tracking-wider")}>Descrição</span>
                                            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; leading-relaxed sem token DS */ "text-sm text-foreground whitespace-pre-wrap leading-relaxed")}>
                                                {tarefa.description}
                                            </p>
                                        </div>
                                    </>
                                )}

                                <Separator className={cn(/* design-system-escape: my-6 margin sem primitiva DS */ "my-6")} />

                                {/* Subtasks Section */}
                                <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
                                    <div className="flex items-center justify-between">
                                        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                            <Heading level="card" className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-semibold → className de <Text>/<Heading> */ "text-sm font-semibold")}>Subtarefas</Heading>
                                        </div>
                                        {tarefa.subTasks && tarefa.subTasks.length > 0 && (
                                            <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground")}>
                                                {tarefa.subTasks.filter(st => st.completed).length} de {tarefa.subTasks.length}
                                            </span>
                                        )}
                                    </div>

                                    <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                                        {tarefa.subTasks?.map((st) => (
                                            <div key={st.id} className={cn(/* design-system-escape: gap-3 gap sem token DS; p-3 → usar <Inset> */ "group flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors")}>
                                                <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3")}>
                                                    <Checkbox
                                                        checked={st.completed}
                                                        onCheckedChange={(checked) => handleToggleSubtask(st.id, !!checked)}
                                                    />
                                                    <span className={`text-sm ${st.completed ? "text-muted-foreground line-through" : ""}`}>
                                                        {st.title}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon" aria-label="Excluir"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleDeleteSubtask(st.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}

                                        <form onSubmit={handleAddSubtask} className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; pt-2 padding direcional sem Inset equiv. */ "flex items-center gap-2 pt-2")}>
                                            <Input
                                                placeholder="Adicionar subtarefa..."
                                                value={newSubtask}
                                                onChange={(e) => setNewSubtask(e.target.value)}
                                                className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "h-10 text-sm")}
                                            />
                                            <Button type="submit" size="icon" aria-label="Adicionar" className="h-10 w-10 shrink-0" disabled={!newSubtask.trim() || isPending}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </div>

                                <Separator className={cn(/* design-system-escape: my-6 margin sem primitiva DS */ "my-6")} />

                                {/* Attachments Section */}
                                <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
                                    <div className="flex items-center justify-between">
                                        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                                            <Heading level="card" className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-semibold → className de <Text>/<Heading> */ "text-sm font-semibold")}>Anexos</Heading>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(/* design-system-escape: gap-1.5 gap sem token DS; text-xs → migrar para <Text variant="caption"> */ "h-8 gap-1.5 text-xs")}
                                            disabled={isPending}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            Adicionar
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </div>

                                    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "grid grid-cols-1 gap-2 sm:grid-cols-2")}>
                                        {tarefa.files?.map((file) => (
                                            <div
                                                key={file.id}
                                                className={cn(/* design-system-escape: gap-3 gap sem token DS; p-3 → usar <Inset> */ "group flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors")}
                                            >
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3 flex-1 min-w-0")}
                                                >
                                                    <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "rounded bg-primary/10 p-2 shrink-0")}>
                                                        <Paperclip className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ "text-xs font-medium truncate")}>{file.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "Arquivo"}
                                                        </p>
                                                    </div>
                                                </a>
                                                <Button
                                                    variant="ghost"
                                                    size="icon" aria-label="Excluir"
                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                    onClick={() => handleRemoveFile(file.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                        {!tarefa.files?.length && (
                                            <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground col-span-2 italic")}>Nenhum anexo.</p>
                                        )}
                                    </div>
                                </div>

                                <Separator className={cn(/* design-system-escape: my-6 margin sem primitiva DS */ "my-6")} />

                                {/* Comments Section */}
                                <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
                                    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                        <Heading level="card" className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-semibold → className de <Text>/<Heading> */ "text-sm font-semibold")}>Comentários</Heading>
                                    </div>

                                    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default">; pb-4 padding direcional sem Inset equiv. */ "space-y-4 pb-4")}>
                                        <form onSubmit={handleAddComment} className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                                            <Textarea
                                                placeholder="Escreva um comentário..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "min-h-20 text-sm resize-none")}
                                            />
                                            <div className="flex justify-end">
                                                <Button type="submit" size="sm" disabled={!newComment.trim() || isPending}>
                                                    Comentar
                                                </Button>
                                            </div>
                                        </form>

                                        <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose">; pt-2 padding direcional sem Inset equiv. */ "space-y-6 pt-2")}>
                                            {tarefa.comments?.map((comment) => (
                                                <div key={comment.id} className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "group relative flex gap-4")}>
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                                        <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-[10px] font-bold")}>U</span>
                                                    </div>
                                                    <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "flex-1 space-y-1")}>
                                                        <div className="flex items-center justify-between">
                                                            <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-semibold → className de <Text>/<Heading> */ "text-xs font-semibold")}>Você</span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                            </span>
                                                        </div>
                                                        <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; leading-relaxed sem token DS */ "text-sm text-foreground/90 leading-relaxed")}>
                                                            {comment.body}
                                                        </p>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv. */ "h-6 px-2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity")}
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                        >
                                                            Excluir
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <DialogFooter className="shrink-0 border-t border-border/30 px-6 py-3">
                            <Button variant="outline" size="sm" onClick={handleClose}>
                                Fechar
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
