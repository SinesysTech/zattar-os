'use client';

/**
 * PericiasFilterBar — Barra de filtros Glass Briefing para perícias.
 * ============================================================================
 * Substitui PericiasListFilters (que dependia do FilterPopover dashed-border
 * importado cross-module de @/app/(authenticated)/partes).
 *
 * Segue o padrão de ContratosFilterBar: pills glass com FilterDropdownTrigger,
 * popovers `glass-dropdown` e clear inline via X. Mesma interface pública que
 * o componente legado — drop-in replacement nos 4 wrappers.
 * ============================================================================
 */

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import {
  CodigoTribunal,
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
  type UsuarioOption,
  type EspecialidadePericiaOption,
  type PeritoOption,
} from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '@/app/(authenticated)/expedientes';

// =============================================================================
// TIPOS (compatíveis com PericiasListFilters legado)
// =============================================================================

export type SituacaoFilterType = 'todos' | SituacaoPericiaCodigo;
export type ResponsavelFilterType = 'todos' | 'sem_responsavel' | number;
export type LaudoFilterType = 'todos' | 'sim' | 'nao';

export interface PericiasFilterBarProps {
  situacaoFilter: SituacaoFilterType;
  onSituacaoChange: (value: SituacaoFilterType) => void;
  responsavelFilter: ResponsavelFilterType;
  onResponsavelChange: (value: ResponsavelFilterType) => void;
  laudoFilter: LaudoFilterType;
  onLaudoChange: (value: LaudoFilterType) => void;
  tribunalFilter: string;
  onTribunalChange: (value: string) => void;
  grauFilter: string;
  onGrauChange: (value: string) => void;
  especialidadeFilter: string;
  onEspecialidadeChange: (value: string) => void;
  peritoFilter: string;
  onPeritoChange: (value: string) => void;
  usuarios: UsuarioOption[];
  especialidades: EspecialidadePericiaOption[];
  peritos: PeritoOption[];
  hideAdvancedFilters?: boolean;
}

// =============================================================================
// PRIMITIVA INTERNA: FilterDropdownTrigger
// =============================================================================

interface TriggerProps {
  label: string;
  active: boolean;
  open: boolean;
  onClear?: () => void;
}

function FilterDropdownTrigger({ label, active, open, onClear }: TriggerProps) {
  return (
    <div
      className={cn(
        /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; */ 'flex items-center inline-snug rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30',
        open && 'ring-1 ring-ring',
      )}
    >
      <span>{label}</span>
      {active && onClear ? (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className={cn(/* design-system-escape: p-0.5 → usar <Inset> */ "ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors")}
        >
          <X className="size-2.5" />
        </span>
      ) : (
        <ChevronDown
          className={cn('size-3 transition-transform', open && 'rotate-180')}
        />
      )}
    </div>
  );
}

// =============================================================================
// PRIMITIVA INTERNA: SimpleSelect (para enums)
// =============================================================================

const POPOVER_CLASSES = /* design-system-escape: p-0 → usar <Inset> */ 'rounded-2xl glass-dropdown overflow-hidden p-0';

interface SimpleSelectProps<TValue extends string> {
  label: string;
  options: readonly { value: TValue; label: string }[];
  selected: TValue | '';
  activeLabel?: string;
  onChange: (value: TValue | '') => void;
  width?: string;
}

function SimpleSelect<TValue extends string>({
  label,
  options,
  selected,
  activeLabel,
  onChange,
  width = 'w-52',
}: SimpleSelectProps<TValue>) {
  const [open, setOpen] = React.useState(false);
  const displayLabel = selected && activeLabel ? activeLabel : label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={displayLabel}
            active={!!selected}
            onClear={selected ? () => onChange('') : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(POPOVER_CLASSES, width)}
        align="start"
        side="bottom"
      >
        <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex flex-col p-2 stack-nano max-h-64 overflow-y-auto")}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(selected === opt.value ? '' : opt.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-caption transition-colors cursor-pointer text-left',
                selected === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70',
              )}
            >
              <span className="truncate">{opt.label}</span>
              {selected === opt.value && (
                <Check className="size-3 ml-auto shrink-0" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// PRIMITIVA INTERNA: SearchableSelect (com CommandInput para listas longas)
// =============================================================================

interface SearchableSelectProps {
  label: string;
  options: readonly { value: string; label: string }[];
  selected: string;
  placeholder?: string;
  onChange: (value: string) => void;
  width?: string;
}

function SearchableSelect({
  label,
  options,
  selected,
  placeholder = 'Buscar...',
  onChange,
  width = 'w-60',
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const activeLabel = React.useMemo(
    () => options.find((o) => o.value === selected)?.label ?? label,
    [options, selected, label],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={activeLabel}
            active={!!selected}
            onClear={selected ? () => onChange('') : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(POPOVER_CLASSES, width)}
        align="start"
        side="bottom"
      >
        <Command className="bg-transparent">
          <div className={cn("px-3 pt-3 pb-1.5")}>
            <CommandInput
              placeholder={placeholder}
              className={cn("h-8 text-caption rounded-lg")}
            />
          </div>
          <CommandList className={cn("max-h-56 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <span className="text-[11px] text-muted-foreground/40">
                Nenhum resultado
              </span>
            </CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selected === opt.value;
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      onChange(isSelected ? '' : opt.value);
                      setOpen(false);
                    }}
                    className={cn("flex inline-tight rounded-lg text-caption px-2 py-1.5")}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="size-3 ml-auto text-primary shrink-0" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// OPÇÕES ESTÁTICAS
// =============================================================================

const SITUACAO_OPTIONS = Object.values(SituacaoPericiaCodigo).map((codigo) => ({
  value: codigo,
  label: SITUACAO_PERICIA_LABELS[codigo],
}));

const LAUDO_OPTIONS = [
  { value: 'sim' as const, label: 'Juntado' },
  { value: 'nao' as const, label: 'Não juntado' },
];

const TRIBUNAL_OPTIONS = CodigoTribunal.map((trt) => ({
  value: trt,
  label: trt,
}));

const GRAU_OPTIONS = Object.entries(GRAU_TRIBUNAL_LABELS).map(
  ([value, label]) => ({ value, label }),
);

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PericiasFilterBar({
  situacaoFilter,
  onSituacaoChange,
  responsavelFilter,
  onResponsavelChange,
  laudoFilter,
  onLaudoChange,
  tribunalFilter,
  onTribunalChange,
  grauFilter,
  onGrauChange,
  especialidadeFilter,
  onEspecialidadeChange,
  peritoFilter,
  onPeritoChange,
  usuarios,
  especialidades,
  peritos,
  hideAdvancedFilters,
}: PericiasFilterBarProps) {
  // ── Opções dinâmicas ──────────────────────────────────────────────────
  const responsavelOptions = React.useMemo(
    () => [
      { value: 'sem_responsavel', label: 'Sem Responsável' },
      ...usuarios.map((u) => ({
        value: String(u.id),
        label:
          u.nomeExibicao ||
          u.nome_exibicao ||
          u.nomeCompleto ||
          u.nome ||
          `Usuário ${u.id}`,
      })),
    ],
    [usuarios],
  );

  const especialidadeOptions = React.useMemo(
    () =>
      especialidades.map((e) => ({
        value: String(e.id),
        label: e.descricao,
      })),
    [especialidades],
  );

  const peritoOptions = React.useMemo(
    () =>
      peritos.map((p) => ({
        value: String(p.id),
        label: p.nome,
      })),
    [peritos],
  );

  // ── Handlers para preservar a tipagem ResponsavelFilterType ───────────
  const responsavelSelected =
    typeof responsavelFilter === 'number'
      ? String(responsavelFilter)
      : responsavelFilter === 'todos'
        ? ''
        : responsavelFilter;

  const handleResponsavelChange = (value: string) => {
    if (!value || value === 'todos') {
      onResponsavelChange('todos');
      return;
    }
    if (value === 'sem_responsavel') {
      onResponsavelChange('sem_responsavel');
      return;
    }
    const n = parseInt(value, 10);
    onResponsavelChange(Number.isNaN(n) ? 'todos' : n);
  };

  return (
    <div className={cn("flex items-center inline-tight flex-wrap")}>
      <SimpleSelect
        label="Situação"
        options={SITUACAO_OPTIONS}
        selected={situacaoFilter === 'todos' ? '' : situacaoFilter}
        activeLabel={
          situacaoFilter !== 'todos'
            ? SITUACAO_PERICIA_LABELS[situacaoFilter]
            : undefined
        }
        onChange={(v) => onSituacaoChange((v || 'todos') as SituacaoFilterType)}
        width="w-56"
      />

      <SearchableSelect
        label="Responsável"
        options={responsavelOptions}
        selected={responsavelSelected}
        placeholder="Buscar responsável..."
        onChange={handleResponsavelChange}
      />

      <SimpleSelect
        label="Laudo"
        options={LAUDO_OPTIONS}
        selected={laudoFilter === 'todos' ? '' : laudoFilter}
        activeLabel={
          laudoFilter === 'sim'
            ? 'Laudo Juntado'
            : laudoFilter === 'nao'
              ? 'Sem Laudo'
              : undefined
        }
        onChange={(v) => onLaudoChange((v || 'todos') as LaudoFilterType)}
        width="w-44"
      />

      {!hideAdvancedFilters && (
        <>
          <SimpleSelect
            label="Tribunal"
            options={TRIBUNAL_OPTIONS}
            selected={tribunalFilter}
            onChange={onTribunalChange}
            width="w-40"
          />

          <SimpleSelect
            label="Grau"
            options={GRAU_OPTIONS}
            selected={grauFilter}
            activeLabel={
              grauFilter
                ? GRAU_TRIBUNAL_LABELS[
                    grauFilter as keyof typeof GRAU_TRIBUNAL_LABELS
                  ]
                : undefined
            }
            onChange={onGrauChange}
            width="w-44"
          />
        </>
      )}

      <SearchableSelect
        label="Especialidade"
        options={especialidadeOptions}
        selected={especialidadeFilter}
        placeholder="Buscar especialidade..."
        onChange={onEspecialidadeChange}
      />

      <SearchableSelect
        label="Perito"
        options={peritoOptions}
        selected={peritoFilter}
        placeholder="Buscar perito..."
        onChange={onPeritoChange}
      />
    </div>
  );
}

// =============================================================================
// DATE RANGE PILL (prazo entrega) — glass pill alinhado aos outros filtros
// =============================================================================

export interface DateRangePillProps {
  value: { from?: Date; to?: Date } | undefined;
  onChange: (range: { from?: Date; to?: Date } | undefined) => void;
  placeholder?: string;
}

export function DateRangePill({
  value,
  onChange,
  placeholder = 'Prazo entrega',
}: DateRangePillProps) {
  const [open, setOpen] = React.useState(false);
  const active = !!value?.from;

  const label = active
    ? value.to && value.from && value.from.getTime() !== value.to.getTime()
      ? `${format(value.from, 'dd/MM', { locale: ptBR })} – ${format(value.to, 'dd/MM', { locale: ptBR })}`
      : format(value.from!, 'dd/MM/yy', { locale: ptBR })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <div
            className={cn(
              /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; */ 'flex items-center inline-snug rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
              active
                ? 'border-primary/20 bg-primary/5 text-primary'
                : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30',
              open && 'ring-1 ring-ring',
            )}
          >
            <span>{label}</span>
            {active ? (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                }}
                className={cn(/* design-system-escape: p-0.5 → usar <Inset> */ "ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors")}
              >
                <X className="size-2.5" />
              </span>
            ) : (
              <ChevronDown
                className={cn('size-3 transition-transform', open && 'rotate-180')}
              />
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-auto p-0 rounded-2xl glass-dropdown border-border/40")}
        align="start"
        side="bottom"
      >
        <Calendar
          selected={
            value?.from
              ? { from: value.from, to: value.to }
              : undefined
          }
          onSelect={(range) => {
            if (!range?.from) {
              onChange(undefined);
              return;
            }
            onChange({
              from: range.from,
              to: range.to ?? range.from,
            });
          }}
          mode="range"
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
