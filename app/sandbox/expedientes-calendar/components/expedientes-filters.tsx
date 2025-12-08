/**
 * Componente de filtros específicos para expedientes
 * Substitui o filtro de cores por filtros de expedientes
 */

'use client';

import { CheckIcon, Filter, RefreshCcw } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { useCalendar } from '@/components/calendar-context';
import type { TEventColor } from '@/components/types';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import type { TipoExpediente } from '@/backend/types/tipos-expedientes/types';

interface ExpedientesFiltersProps {
	usuarios: Usuario[];
	tiposExpedientes: TipoExpediente[];
	selectedFilters: {
		trt?: string;
		grau?: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';
		responsavelId?: number | null;
		tipoExpedienteId?: number | null;
		baixado?: boolean;
		prazoVencido?: boolean;
	};
	onFilterChange: (filters: ExpedientesFiltersProps['selectedFilters']) => void;
	onClearFilters: () => void;
}

const TRIBUNAIS = [
	'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
	'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
	'TRT21', 'TRT22', 'TRT23', 'TRT24', 'TST',
] as const;

export function ExpedientesFilters({
	usuarios,
	tiposExpedientes,
	selectedFilters,
	onFilterChange,
	onClearFilters,
}: ExpedientesFiltersProps) {
	const { selectedColors, filterEventsBySelectedColors } = useCalendar();

	const hasActiveFilters = 
		selectedFilters.trt ||
		selectedFilters.grau ||
		selectedFilters.responsavelId !== undefined ||
		selectedFilters.tipoExpedienteId !== undefined ||
		selectedFilters.baixado !== undefined ||
		selectedFilters.prazoVencido !== undefined ||
		selectedColors.length > 0;

	const handleTipoExpedienteToggle = (tipoId: number | null) => {
		onFilterChange({
			...selectedFilters,
			tipoExpedienteId: selectedFilters.tipoExpedienteId === tipoId ? undefined : tipoId,
		});
	};

	const handleTRTToggle = (trt: string) => {
		onFilterChange({
			...selectedFilters,
			trt: selectedFilters.trt === trt ? undefined : trt,
		});
	};

	const handleGrauToggle = (grau: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior') => {
		onFilterChange({
			...selectedFilters,
			grau: selectedFilters.grau === grau ? undefined : grau,
		});
	};

	const handleResponsavelToggle = (responsavelId: number | null) => {
		onFilterChange({
			...selectedFilters,
			responsavelId: selectedFilters.responsavelId === responsavelId ? undefined : responsavelId,
		});
	};

	const handleBaixadoToggle = () => {
		onFilterChange({
			...selectedFilters,
			baixado: selectedFilters.baixado === false ? undefined : false,
		});
	};

	const handlePrazoVencidoToggle = () => {
		onFilterChange({
			...selectedFilters,
			prazoVencido: selectedFilters.prazoVencido === true ? undefined : true,
		});
	};

	const handleClearAll = () => {
		onClearFilters();
		filterEventsBySelectedColors('blue'); // Limpar filtro de cores também
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Toggle variant="outline" className="cursor-pointer w-fit">
					<Filter className="h-4 w-4" />
				</Toggle>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[250px] max-h-[80vh] overflow-y-auto">
				<DropdownMenuLabel>Filtros de Expedientes</DropdownMenuLabel>
				<DropdownMenuSeparator />

				{/* Filtro por Tipo de Expediente */}
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					Tipo de Expediente
				</DropdownMenuLabel>
				<DropdownMenuItem
					className="flex items-center gap-2 cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						handleTipoExpedienteToggle(null);
					}}
				>
					<span>Sem tipo</span>
					{selectedFilters.tipoExpedienteId === null && (
						<CheckIcon className="size-4 text-primary" />
					)}
				</DropdownMenuItem>
				{tiposExpedientes.map((tipo) => (
					<DropdownMenuItem
						key={tipo.id}
						className="flex items-center gap-2 cursor-pointer"
						onClick={(e) => {
							e.preventDefault();
							handleTipoExpedienteToggle(tipo.id);
						}}
					>
						<span>{tipo.tipo_expediente}</span>
						{selectedFilters.tipoExpedienteId === tipo.id && (
							<CheckIcon className="size-4 text-primary" />
						)}
					</DropdownMenuItem>
				))}

				<DropdownMenuSeparator />

				{/* Filtro por TRT */}
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					Tribunal (TRT)
				</DropdownMenuLabel>
				{TRIBUNAIS.slice(0, 12).map((trt) => (
					<DropdownMenuItem
						key={trt}
						className="flex items-center gap-2 cursor-pointer"
						onClick={(e) => {
							e.preventDefault();
							handleTRTToggle(trt);
						}}
					>
						<span>{trt}</span>
						{selectedFilters.trt === trt && (
							<CheckIcon className="size-4 text-primary" />
						)}
					</DropdownMenuItem>
				))}

				<DropdownMenuSeparator />

				{/* Filtro por Grau */}
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					Grau
				</DropdownMenuLabel>
				<DropdownMenuItem
					className="flex items-center gap-2 cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						handleGrauToggle('primeiro_grau');
					}}
				>
					<span>1º Grau</span>
					{selectedFilters.grau === 'primeiro_grau' && (
						<CheckIcon className="size-4 text-primary" />
					)}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex items-center gap-2 cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						handleGrauToggle('segundo_grau');
					}}
				>
					<span>2º Grau</span>
					{selectedFilters.grau === 'segundo_grau' && (
						<CheckIcon className="size-4 text-primary" />
					)}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex items-center gap-2 cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						handleGrauToggle('tribunal_superior');
					}}
				>
					<span>Tribunal Superior</span>
					{selectedFilters.grau === 'tribunal_superior' && (
						<CheckIcon className="size-4 text-primary" />
					)}
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				{/* Filtro por Responsável */}
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					Responsável
				</DropdownMenuLabel>
				<DropdownMenuItem
					className="flex items-center gap-2 cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						handleResponsavelToggle(null);
					}}
				>
					<span>Sem responsável</span>
					{selectedFilters.responsavelId === null && (
						<CheckIcon className="size-4 text-primary" />
					)}
				</DropdownMenuItem>
				{usuarios.slice(0, 10).map((usuario) => (
					<DropdownMenuItem
						key={usuario.id}
						className="flex items-center gap-2 cursor-pointer"
						onClick={(e) => {
							e.preventDefault();
							handleResponsavelToggle(usuario.id);
						}}
					>
						<span>{usuario.nomeExibicao}</span>
						{selectedFilters.responsavelId === usuario.id && (
							<CheckIcon className="size-4 text-primary" />
						)}
					</DropdownMenuItem>
				))}

				<DropdownMenuSeparator />

				{/* Filtro por Status */}
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					Status
				</DropdownMenuLabel>
				<DropdownMenuItem
					className="flex items-center gap-2 cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						handleBaixadoToggle();
					}}
				>
					<span>Apenas Pendentes</span>
					{selectedFilters.baixado === false && (
						<CheckIcon className="size-4 text-primary" />
					)}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex items-center gap-2 cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						handlePrazoVencidoToggle();
					}}
				>
					<span>Prazo Vencido</span>
					{selectedFilters.prazoVencido === true && (
						<CheckIcon className="size-4 text-primary" />
					)}
				</DropdownMenuItem>

				<Separator className="my-2" />
				<DropdownMenuItem
					disabled={!hasActiveFilters}
					className="flex gap-2 cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						handleClearAll();
					}}
				>
					<RefreshCcw className="size-3.5" />
					Limpar Filtros
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

