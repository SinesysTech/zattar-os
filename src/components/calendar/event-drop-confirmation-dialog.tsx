"use client";

import {format} from "date-fns";
import {ptBR} from "date-fns/locale";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {IEvent} from "@/components/calendar/interfaces";
import {formatTime, getColorClass} from "@/components/calendar/helpers";
import {cn} from "@/lib/utils";
import {useCalendar} from "@/components/calendar/calendar-context";

interface EventDropConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: IEvent | null;
    newStartDate: Date | null;
    newEndDate: Date | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export function EventDropConfirmationDialog({
                                                open,
                                                onOpenChange,
                                                event,
                                                newStartDate,
                                                newEndDate,
                                                onConfirm,
                                                onCancel,
                                            }: EventDropConfirmationDialogProps) {

    const {use24HourFormat} = useCalendar();

    if (!event || !newStartDate || !newEndDate) {
        return null;
    }

    const originalStart = new Date(event.startDate);

    const formatDate = (date: Date) => {
        return format(date, "dd 'de' MMM 'de' yyyy 'às' ", { locale: ptBR }) + formatTime(date, use24HourFormat);
    };

    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    const handleCancel = () => {
        onCancel();
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Movimentação</AlertDialogTitle>
                    <AlertDialogDescription>
                        Deseja mover o evento
                        <span className={cn(getColorClass(event.color), "mx-1 py-0.5 px-1 rounded-md")}>
							{event.title}
						</span>
                        de
                        <strong className="mx-1">{formatDate(originalStart)}</strong> para
                        <strong className="mx-1">{formatDate(newStartDate)}</strong>?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm}>
                        Mover Evento
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
