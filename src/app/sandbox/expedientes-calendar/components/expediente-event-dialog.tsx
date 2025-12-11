/**
 * Dialog customizado para visualizar e editar expedientes no calendário
 * Substitui o EventDetailsDialog padrão com funcionalidades específicas de expedientes
 */

'use client';

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Text, User, Pencil, Loader2 } from 'lucide-react';
import React, { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCalendar } from '@/components/calendar/calendar-context';
import { formatTime } from '@/components/calendar/helpers';
import type { IEvent } from '@/components/calendar/interfaces';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import type { TipoExpediente } from '@/features/tipos-expedientes';

interface ExpedienteEventDialogProps {
	event: IEvent;
	children: ReactNode;
	usuarios: Usuario[];
	tiposExpedientes: TipoExpediente[];
	onUpdate?: () => void;
}

export function ExpedienteEventDialog({
	event,
	children,
	usuarios,
	tiposExpedientes,
	onUpdate,
}: ExpedienteEventDialogProps) {
	const startDate = parseISO(event.startDate);
	const { use24HourFormat, updateEvent } = useCalendar();

	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	// Extrair tipo_expediente_id e responsavel_id da description (armazenados como metadados)
	const extractMetadata = (description: string) => {
		const tipoMatch = description.match(/__TIPO_ID__:(\d+)/);
		const responsavelMatch = description.match(/__RESPONSAVEL_ID__:(\d+)/);
		return {
			tipoId: tipoMatch ? parseInt(tipoMatch[1], 10) : null,
			responsavelId: responsavelMatch ? parseInt(responsavelMatch[1], 10) : null,
		};
	};

	const metadata = extractMetadata(event.description);
	const [tipoSelecionado, setTipoSelecionado] = useState<string>(
		metadata.tipoId ? metadata.tipoId.toString() : 'null'
	);
	const [responsavelSelecionado, setResponsavelSelecionado] = useState<string>(
		event.user.id === '0' ? 'null' : event.user.id
	);

	// Extrair tipo_expediente_id do evento (armazenado na description ou precisamos buscar)
	// Por enquanto, vamos buscar do backend quando necessário
	const handleSave = async () => {
		setIsSaving(true);
		try {
			// Atualizar tipo de expediente (só se mudou)
			const tipoIdAtual = metadata.tipoId;
			const tipoIdNovo = tipoSelecionado === 'null' ? null : parseInt(tipoSelecionado, 10);

			if (tipoIdAtual !== tipoIdNovo) {
				const responseTipo = await fetch(
					`/api/pendentes-manifestacao/${event.id}/tipo-descricao`,
					{
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							tipoExpedienteId: tipoIdNovo,
							descricaoArquivos: null, // Manter descrição existente
						}),
					}
				);

				if (!responseTipo.ok) {
					throw new Error('Erro ao atualizar tipo de expediente');
				}
			}

			// Atualizar responsável
			const responsavelId =
				responsavelSelecionado === 'null' || responsavelSelecionado === '0'
					? null
					: parseInt(responsavelSelecionado, 10);

			const responseResponsavel = await fetch(
				`/api/pendentes-manifestacao/${event.id}/responsavel`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ responsavelId }),
				}
			);

			if (!responseResponsavel.ok) {
				throw new Error('Erro ao atualizar responsável');
			}

			// Atualizar evento no contexto
			const responsavel = usuarios.find(
				(u) => u.id.toString() === responsavelSelecionado
			);
			const updatedEvent: IEvent = {
				...event,
				user: responsavel
					? {
						id: responsavel.id.toString(),
						name: responsavel.nomeExibicao,
						picturePath: null,
					}
					: {
						id: '0',
						name: 'Sem responsável',
						picturePath: null,
					},
			};

			updateEvent(updatedEvent);
			toast.success('Expediente atualizado com sucesso');
			setIsEditing(false);
			onUpdate?.();
		} catch (error) {
			console.error('Erro ao atualizar expediente:', error);
			toast.error('Erro ao atualizar expediente');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-lg font-semibold">
						{event.title}
					</DialogTitle>
					<DialogDescription>
						Detalhes do expediente pendente de manifestação
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="max-h-[70vh]">
					<div className="space-y-4 p-4">
						{/* Informações do Processo */}
						<div className="space-y-3">
							<h3 className="text-sm font-semibold">Informações do Processo</h3>
							<div className="grid grid-cols-2 gap-4">
								<div className="flex items-start gap-2">
									<Calendar className="mt-1 size-4 shrink-0 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">Data do Prazo</p>
										<p className="text-sm text-muted-foreground">
											{format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", {
												locale: ptBR,
											})}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-2">
									<Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">Horário</p>
										<p className="text-sm text-muted-foreground">
											{formatTime(parseISO(event.startDate), use24HourFormat)}
										</p>
									</div>
								</div>
							</div>
						</div>

						<Separator />

						{/* Responsável */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div className="flex items-start gap-2">
									<User className="mt-1 size-4 shrink-0 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">Responsável</p>
										{!isEditing ? (
											<p className="text-sm text-muted-foreground">
												{event.user.name}
											</p>
										) : (
											<Select
												value={responsavelSelecionado}
												onValueChange={setResponsavelSelecionado}
												disabled={isSaving}
											>
												<SelectTrigger className="w-[250px] mt-1">
													<SelectValue placeholder="Selecione o responsável" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="null">Sem responsável</SelectItem>
													{usuarios.map((usuario) => (
														<SelectItem
															key={usuario.id}
															value={usuario.id.toString()}
														>
															{usuario.nomeExibicao}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									</div>
								</div>
								{!isEditing && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsEditing(true)}
									>
										<Pencil className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>

						<Separator />

						{/* Tipo de Expediente */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium">Tipo de Expediente</p>
									{!isEditing ? (
										<p className="text-sm text-muted-foreground">
											{metadata.tipoId
												? tiposExpedientes.find(
													(t) => t.id === metadata.tipoId
												)?.tipoExpediente || 'Sem tipo'
												: 'Sem tipo'}
										</p>
									) : (
										<Select
											value={tipoSelecionado}
											onValueChange={setTipoSelecionado}
											disabled={isSaving}
										>
											<SelectTrigger className="w-[250px] mt-1">
												<SelectValue placeholder="Selecione o tipo" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="null">Sem tipo</SelectItem>
												{tiposExpedientes.map((tipo) => (
													<SelectItem
														key={tipo.id}
														value={tipo.id.toString()}
													>
														{tipo.tipoExpediente}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								</div>
							</div>
						</div>

						<Separator />

						{/* Descrição */}
						<div className="flex items-start gap-2">
							<Text className="mt-1 size-4 shrink-0 text-muted-foreground" />
							<div className="flex-1">
								<p className="text-sm font-medium">Descrição</p>
								<p className="text-sm text-muted-foreground whitespace-pre-wrap">
									{event.description || 'Sem descrição'}
								</p>
							</div>
						</div>
					</div>
				</ScrollArea>

				<DialogFooter>
					{isEditing ? (
						<>
							<Button
								variant="outline"
								onClick={() => setIsEditing(false)}
								disabled={isSaving}
							>
								Cancelar
							</Button>
							<Button onClick={handleSave} disabled={isSaving}>
								{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Salvar
							</Button>
						</>
					) : (
						<DialogClose asChild>
							<Button variant="outline">Fechar</Button>
						</DialogClose>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

