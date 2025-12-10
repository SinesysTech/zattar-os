import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, format, set } from "date-fns";
import { type ReactNode, useEffect, useMemo, useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/date-time-picker";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Modal,
	ModalClose,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	ModalTrigger,
} from "@/components/responsive-modal";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COLORS } from "@/components/constants";
import { useCalendar } from "@/components/calendar-context";
import { useDisclosure } from "@/components/hooks";
import type { IEvent } from "@/components/interfaces";
import {
	eventSchema,
	type TEventFormData,
} from "@/components/schemas";

interface IProps {
	children: ReactNode;
	startDate?: Date;
	startTime?: { hour: number; minute: number };
	event?: IEvent;
}

export function AddEditEventDialog({
	children,
	startDate,
	startTime,
	event,
}: IProps) {
	const { isOpen, onClose, onToggle } = useDisclosure();
	const { addEvent, updateEvent } = useCalendar();
	const isEditing = !!event;
	// Usar useId para gerar IDs estáveis em vez de Math.random
	const generatedEventId = useId();
	const generatedUserId = useId();

	const initialDates = useMemo(() => {
		if (!isEditing && !event) {
			if (!startDate) {
				const now = new Date();
				return { startDate: now, endDate: addMinutes(now, 30) };
			}
			const start = startTime
				? set(new Date(startDate), {
						hours: startTime.hour,
						minutes: startTime.minute,
						seconds: 0,
					})
				: new Date(startDate);
			const end = addMinutes(start, 30);
			return { startDate: start, endDate: end };
		}

		return {
			startDate: new Date(event.startDate),
			endDate: new Date(event.endDate),
		};
	}, [startDate, startTime, event, isEditing]);

	const form = useForm<TEventFormData>({
		resolver: zodResolver(eventSchema),
		defaultValues: {
			title: event?.title ?? "",
			description: event?.description ?? "",
			startDate: initialDates.startDate,
			endDate: initialDates.endDate,
			color: event?.color ?? "blue",
		},
	});

	useEffect(() => {
		form.reset({
			title: event?.title ?? "",
			description: event?.description ?? "",
			startDate: initialDates.startDate,
			endDate: initialDates.endDate,
			color: event?.color ?? "blue",
		});
	}, [event, initialDates, form]);

	const onSubmit = (values: TEventFormData) => {
		try {
			const formattedEvent: IEvent = {
				...values,
				startDate: format(values.startDate, "yyyy-MM-dd'T'HH:mm:ss"),
				endDate: format(values.endDate, "yyyy-MM-dd'T'HH:mm:ss"),
				id: isEditing ? event.id : generatedEventId.replace(/:/g, '').slice(0, 10),
				user: isEditing
					? event.user
					: {
							id: generatedUserId.replace(/:/g, '').slice(0, 10),
							name: "Jeraidi Yassir",
							picturePath: null,
						},
				color: values.color,
			};

			if (isEditing) {
				updateEvent(formattedEvent);
				toast.success("Evento atualizado com sucesso");
			} else {
				addEvent(formattedEvent);
				toast.success("Evento criado com sucesso");
			}

			onClose();
			form.reset();
		} catch (error) {
			console.error(`Erro ao ${isEditing ? "editar" : "adicionar"} evento:`, error);
			toast.error(`Falha ao ${isEditing ? "editar" : "adicionar"} evento`);
		}
	};

	return (
		<Modal open={isOpen} onOpenChange={onToggle} modal={false}>
			<ModalTrigger asChild>{children}</ModalTrigger>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{isEditing ? "Editar Evento" : "Adicionar Novo Evento"}</ModalTitle>
					<ModalDescription>
						{isEditing
							? "Modifique seu evento existente."
							: "Crie um novo evento para seu calendário."}
					</ModalDescription>
				</ModalHeader>

				<Form {...form}>
					<form
						id="event-form"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid gap-4 py-4"
					>
						<FormField
							control={form.control}
							name="title"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel htmlFor="title" className="required">
										Título
									</FormLabel>
									<FormControl>
										<Input
											id="title"
											placeholder="Digite um título"
											{...field}
											className={fieldState.invalid ? "border-red-500" : ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="startDate"
							render={({ field }) => (
								<DateTimePicker form={form} field={field} />
							)}
						/>
						<FormField
							control={form.control}
							name="endDate"
							render={({ field }) => (
								<DateTimePicker form={form} field={field} />
							)}
						/>
						<FormField
							control={form.control}
							name="color"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel className="required">Cor</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger
												className={`w-full ${
													fieldState.invalid ? "border-red-500" : ""
												}`}
											>
												<SelectValue placeholder="Selecione uma cor" />
											</SelectTrigger>
											<SelectContent>
												{COLORS.map((color) => (
													<SelectItem value={color} key={color}>
														<div className="flex items-center gap-2">
															<div
																className={`size-3.5 rounded-full bg-${color}-600 dark:bg-${color}-700`}
															/>
															{color}
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel className="required">Descrição</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Digite uma descrição"
											className={fieldState.invalid ? "border-red-500" : ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>
				<ModalFooter className="flex justify-end gap-2">
					<ModalClose asChild>
						<Button type="button" variant="outline">
							Cancelar
						</Button>
					</ModalClose>
					<Button form="event-form" type="submit">
						{isEditing ? "Salvar Alterações" : "Criar Evento"}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
