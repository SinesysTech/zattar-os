"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TarefaDisplayItem } from "../domain";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Star, FileIcon, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useTarefaStore } from "../store";

interface TaskCardProps {
    tarefa: TarefaDisplayItem;
    isDragging?: boolean;
}

export function TaskCard({ tarefa, isDragging = false }: TaskCardProps) {
    const { setSelectedTarefaId, setTarefaSheetOpen } = useTarefaStore();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSorting
    } = useSortable({
        id: tarefa.id,
        disabled: tarefa.isVirtual
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSorting ? 0.4 : 1,
    };

    const handleTaskClick = () => {
        setSelectedTarefaId(tarefa.id);
        setTarefaSheetOpen(true);
    };

    const totalSubtasks = tarefa.subTasks?.length || 0;
    const completedSubtasks = tarefa.subTasks?.filter(s => s.completed).length || 0;
    const totalComments = tarefa.comments?.length || 0;
    const totalFiles = tarefa.files?.length || 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group"
            onClick={handleTaskClick}
        >
            <Card className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                tarefa.isVirtual && "bg-muted/50 border-dashed",
                isDragging && "shadow-xl scale-105 rotate-2"
            )}>
                <CardContent className="p-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                            "font-medium text-sm leading-tight line-clamp-2",
                            tarefa.status === "done" && "text-muted-foreground line-through"
                        )}>
                            {tarefa.title}
                        </h4>
                        {tarefa.starred && (
                            <Star className="h-3 w-3 fill-primary text-primary shrink-0" />
                        )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px] px-1 h-5 capitalize">
                            {tarefa.label}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1 h-5 capitalize">
                            {tarefa.priority}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                            {tarefa.dueDate && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(tarefa.dueDate), "dd/MM")}</span>
                                </div>
                            )}
                            {totalSubtasks > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-primary">
                                        {completedSubtasks}/{totalSubtasks}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {totalComments > 0 && (
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{totalComments}</span>
                                </div>
                            )}
                            {totalFiles > 0 && (
                                <div className="flex items-center gap-1">
                                    <FileIcon className="h-3 w-3" />
                                    <span>{totalFiles}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
