/**
 * Componente de filtros específicos para expedientes
 * Estrutura hierárquica com duas colunas: categorias à esquerda, filtros à direita
 */

'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, Filter, RefreshCcw, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useCalendar } from '@/components/calendar/calendar-context';
import type { TipoExpediente } from '@/features/tipos-expedientes';

interface ExpedientesFiltersProps {
	tiposExpedientes: TipoExpediente[];
	selectedFilters: {
		trt?: string;
		grau?: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';
		tipoExpedienteId?: number | null;
		status?: 'pendente' | 'vencido' | 'sem_data' | 'baixados';
	};
	onFilterChange: (filters: ExpedientesFiltersProps['selectedFilters']) => void;
	onClearFilters: () => void;
}

const TRIBUNAIS = [
	'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
	'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
	'TRT21', 'TRT22', 'TRT23', 'TRT24', 'TST',
] as const;

const GRAUS = [
	{ value: 'primeiro_grau', label: '1º Grau' },
	{ value: 'segundo_grau', label: '2º Grau' },
	{ value: 'tribunal_superior', label: 'Tribunal Superior' },
] as const;

const STATUS_OPTIONS = [
	{ value: 'pendente', label: 'Pendente' },
	{ value: 'vencido', label: 'Vencido' },
	{ value: 'sem_data', label: 'Sem Data' },
	{ value: 'baixados', label: 'Baixados' },
] as const;

type FilterCategory = 'status' | 'trt' | 'grau' | 'tipo' | null;

export function ExpedientesFilters({
	tiposExpedientes,
	selectedFilters,
	onFilterChange,
	onClearFilters,
}: ExpedientesFiltersProps) {
	const { clearFilter: clearCalendarColorFilter } = useCalendar();
	const [hoveredCategory, setHoveredCategory] = useState<FilterCategory>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [closeTimeout, setCloseTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

	const hasActiveFilters =
		selectedFilters.trt ||
		selectedFilters.grau ||
		selectedFilters.tipoExpedienteId !== undefined ||
		selectedFilters.status !== undefined;

	const handleStatusSelect = (status: typeof STATUS_OPTIONS[number]['value']) => {
		onFilterChange({
			...selectedFilters,
			status: selectedFilters.status === status ? undefined : status,
		});
	};

	const handleTRTSelect = (trt: string) => {
		onFilterChange({
			...selectedFilters,
			trt: selectedFilters.trt === trt ? undefined : trt,
		});
	};

	const handleGrauSelect = (grau: typeof GRAUS[number]['value']) => {
		onFilterChange({
			...selectedFilters,
			grau: selectedFilters.grau === grau ? undefined : grau,
		});
	};

	const handleTipoSelect = (tipoId: number | null) => {
		onFilterChange({
			...selectedFilters,
			tipoExpedienteId: selectedFilters.tipoExpedienteId === tipoId ? undefined : tipoId,
		});
	};

	const handleClearAll = () => {
		onClearFilters();
		clearCalendarColorFilter();
	};

	// Limpar timeout quando o componente desmontar ou o popover fechar
	useEffect(() => {
		return () => {
			if (closeTimeout) {
				clearTimeout(closeTimeout);
			}
		};
	}, [closeTimeout]);

	// Limpar hoveredCategory quando o popover fechar
	useEffect(() => {
		if (!isOpen) {
			// Usar requestAnimationFrame para evitar setState síncrono no effect
			requestAnimationFrame(() => {
				setHoveredCategory(null);
			});
			if (closeTimeout) {
				clearTimeout(closeTimeout);
				requestAnimationFrame(() => {
					setCloseTimeout(null);
				});
			}
		}
	}, [isOpen, closeTimeout]);

	const handleCategoryEnter = (category: FilterCategory) => {
		// Limpar timeout anterior se existir
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			setCloseTimeout(null);
		}
		setHoveredCategory(category);
	};

	const handleCategoryLeave = () => {
		// Adicionar delay antes de fechar para permitir movimento do mouse
		const timeout = setTimeout(() => {
			setHoveredCategory(null);
		}, 150);
		setCloseTimeout(timeout);
	};

	const handleSubmenuEnter = () => {
		// Limpar timeout quando mouse entra no submenu
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			setCloseTimeout(null);
		}
	};

	const handleSubmenuLeave = () => {
		// Fechar submenu quando mouse sai
		setHoveredCategory(null);
	};

	const renderSubmenu = () => {
		if (!hoveredCategory) return null;

		switch (hoveredCategory) {
			case 'status':
				return (
					<div
						className="w-48 border-l pl-4"
						onMouseEnter={handleSubmenuEnter}
						onMouseLeave={handleSubmenuLeave}
					>
						<div className="text-xs font-semibold text-muted-foreground mb-2">
							Status do Expediente
						</div>
						{STATUS_OPTIONS.map((status) => (
							<button
								key={status.value}
								onClick={() => handleStatusSelect(status.value)}
								className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
							>
								<span>{status.label}</span>
								{selectedFilters.status === status.value && (
									<CheckIcon className="size-4 text-primary" />
								)}
							</button>
						))}
					</div>
				);

			case 'trt':
				return (
					<div
						className="w-48 border-l pl-4 max-h-[400px] overflow-y-auto"
						onMouseEnter={handleSubmenuEnter}
						onMouseLeave={handleSubmenuLeave}
					>
						<div className="text-xs font-semibold text-muted-foreground mb-2">
							Tribunal (TRT)
						</div>
						{TRIBUNAIS.map((trt) => (
							<button
								key={trt}
								onClick={() => handleTRTSelect(trt)}
								className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
							>
								<span>{trt}</span>
								{selectedFilters.trt === trt && (
									<CheckIcon className="size-4 text-primary" />
								)}
							</button>
						))}
					</div>
				);

			case 'grau':
				return (
					<div
						className="w-48 border-l pl-4"
						onMouseEnter={handleSubmenuEnter}
						onMouseLeave={handleSubmenuLeave}
					>
						<div className="text-xs font-semibold text-muted-foreground mb-2">
							Grau
						</div>
						{GRAUS.map((grau) => (
							<button
								key={grau.value}
								onClick={() => handleGrauSelect(grau.value)}
								className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
							>
								<span>{grau.label}</span>
								{selectedFilters.grau === grau.value && (
									<CheckIcon className="size-4 text-primary" />
								)}
							</button>
						))}
					</div>
				);

			case 'tipo':
				return (
					<div
						className="w-48 border-l pl-4 max-h-[400px] overflow-y-auto"
						onMouseEnter={handleSubmenuEnter}
						onMouseLeave={handleSubmenuLeave}
					>
						<div className="text-xs font-semibold text-muted-foreground mb-2">
							Tipo de Expediente
						</div>
						<button
							onClick={() => handleTipoSelect(null)}
							className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
						>
							<span>Sem tipo</span>
							{selectedFilters.tipoExpedienteId === null && (
								<CheckIcon className="size-4 text-primary" />
							)}
						</button>
						{tiposExpedientes.map((tipo) => (
							<button
								key={tipo.id}
								onClick={() => handleTipoSelect(tipo.id)}
								className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
							>
								<span className="truncate">{tipo.tipoExpediente}</span>
								{selectedFilters.tipoExpedienteId === tipo.id && (
									<CheckIcon className="size-4 text-primary shrink-0" />
								)}
							</button>
						))}
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Toggle
					variant="outline"
					className="cursor-pointer w-fit"
					pressed={hasActiveFilters}
				>
					<Filter className="h-4 w-4" />
				</Toggle>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-auto p-0"
				onOpenAutoFocus={(e) => e.preventDefault()}
				onInteractOutside={(e) => {
					// Não fechar quando clicar dentro do popover
					const target = e.target as HTMLElement;
					if (target.closest('[data-radix-popover-content]')) {
						e.preventDefault();
					}
				}}
			>
				<div className="flex">
					{/* Coluna esquerda: Categorias */}
					<div className="w-48 border-r">
						<div className="p-2 text-sm font-semibold border-b">
							Filtros de Expedientes
						</div>
						<div className="py-1">
							<button
								onMouseEnter={() => handleCategoryEnter('status')}
								onMouseLeave={handleCategoryLeave}
								className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${hoveredCategory === 'status'
										? 'bg-accent'
										: 'hover:bg-accent/50'
									} ${selectedFilters.status ? 'font-medium' : ''}`}
							>
								<span>Status</span>
								{selectedFilters.status && (
									<CheckIcon className="size-4 text-primary" />
								)}
								<ChevronRight className="size-4 text-muted-foreground" />
							</button>

							<button
								onMouseEnter={() => handleCategoryEnter('trt')}
								onMouseLeave={handleCategoryLeave}
								className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${hoveredCategory === 'trt'
										? 'bg-accent'
										: 'hover:bg-accent/50'
									} ${selectedFilters.trt ? 'font-medium' : ''}`}
							>
								<span>Tribunal (TRT)</span>
								{selectedFilters.trt && (
									<CheckIcon className="size-4 text-primary" />
								)}
								<ChevronRight className="size-4 text-muted-foreground" />
							</button>

							<button
								onMouseEnter={() => handleCategoryEnter('grau')}
								onMouseLeave={handleCategoryLeave}
								className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${hoveredCategory === 'grau'
										? 'bg-accent'
										: 'hover:bg-accent/50'
									} ${selectedFilters.grau ? 'font-medium' : ''}`}
							>
								<span>Grau</span>
								{selectedFilters.grau && (
									<CheckIcon className="size-4 text-primary" />
								)}
								<ChevronRight className="size-4 text-muted-foreground" />
							</button>

							<button
								onMouseEnter={() => handleCategoryEnter('tipo')}
								onMouseLeave={handleCategoryLeave}
								className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${hoveredCategory === 'tipo'
										? 'bg-accent'
										: 'hover:bg-accent/50'
									} ${selectedFilters.tipoExpedienteId !== undefined ? 'font-medium' : ''}`}
							>
								<span>Tipo de Expediente</span>
								{selectedFilters.tipoExpedienteId !== undefined && (
									<CheckIcon className="size-4 text-primary" />
								)}
								<ChevronRight className="size-4 text-muted-foreground" />
							</button>
						</div>

						<Separator className="my-2" />

						<button
							disabled={!hasActiveFilters}
							onClick={handleClearAll}
							className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<RefreshCcw className="size-3.5" />
							Limpar Filtros
						</button>
					</div>

					{/* Coluna direita: Submenu */}
					{renderSubmenu()}
				</div>
			</PopoverContent>
		</Popover>
	);
}
