'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { StatusAudiencia, GrauTribunal, GRAU_TRIBUNAL_LABELS } from '../domain';
import type { TipoAudiencia } from '../domain';

// ── Types ──────────────────────────────────────────────────────────────

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

export interface AudienciasFilters {
  status: StatusAudiencia | null;
  responsavel: 'meus' | 'sem_responsavel' | number | null;
  trt: string[];
  modalidade: 'virtual' | 'presencial' | 'hibrida' | null;
  grau: GrauTribunal[];
  tipoAudienciaId: number[];
}

interface AudienciasFilterBarProps {
  filters: AudienciasFilters;
  onChange: (filters: AudienciasFilters) => void;
  usuarios: Usuario[];
  tiposAudiencia: TipoAudiencia[];
  currentUserId: number;
  counts: {
    total: number;
    marcadas: number;
    finalizadas: number;
    canceladas: number;
    semResponsavel: number;
  };
}

// ── Shared ─────────────────────────────────────────────────────────────

const POPOVER_CLASSES = /* design-system-escape: p-0 → usar <Inset> */ 'rounded-2xl glass-dropdown overflow-hidden p-0';

function FilterDropdownTrigger({
  label,
  active,
  onClear,
  open,
  children,
}: {
  label: string;
  active: boolean;
  onClear?: () => void;
  open: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; */ 'flex items-center inline-snug rounded-lg border px-2.5 py-1.5 font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/40 text-muted-foreground/75 hover:bg-muted/30',
        open && 'ring-1 ring-ring'
      )}
    >
      {children}
      <span className="text-caption">{label}</span>
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
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
      )}
    </div>
  );
}

// ── Status Filter (Dropdown chip) ────────────────────────────────────

const STATUS_OPTIONS: { value: StatusAudiencia | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: StatusAudiencia.Marcada, label: 'Marcadas' },
  { value: StatusAudiencia.Finalizada, label: 'Finalizadas' },
  { value: StatusAudiencia.Cancelada, label: 'Canceladas' },
];

function StatusFilter({
  selected,
  onChange,
  counts,
}: {
  selected: StatusAudiencia | null;
  onChange: (v: StatusAudiencia | null) => void;
  counts: { total: number; marcadas: number; finalizadas: number; canceladas: number };
}) {
  const [open, setOpen] = React.useState(false);

  const countMap: Record<string, number> = {
    todas: counts.total,
    [StatusAudiencia.Marcada]: counts.marcadas,
    [StatusAudiencia.Finalizada]: counts.finalizadas,
    [StatusAudiencia.Cancelada]: counts.canceladas,
  };

  const label = selected
    ? STATUS_OPTIONS.find((o) => o.value === selected)?.label ?? 'Status'
    : 'Status';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange(null) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-44')} align="start" side="bottom">
        <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex flex-col p-2 stack-nano")}>
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = (selected ?? 'todas') === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value === 'todas' ? null : (opt.value as StatusAudiencia));
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-micro-caption transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-primary/8 text-primary'
                    : 'hover:bg-muted/30 text-muted-foreground/70',
                )}
              >
                <span className="flex-1 text-left">{opt.label}</span>
                <span className="tabular-nums text-[9px] opacity-50">{countMap[opt.value]}</span>
                {isSelected && <Check className="size-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Responsável Filter ─────────────────────────────────────────────────

function ResponsavelFilter({
  selected,
  onChange,
  usuarios,
  currentUserId: _currentUserId,
  semResponsavelCount,
}: {
  selected: 'meus' | 'sem_responsavel' | number | null;
  onChange: (v: 'meus' | 'sem_responsavel' | number | null) => void;
  usuarios: Usuario[];
  currentUserId: number;
  semResponsavelCount: number;
}) {
  const [open, setOpen] = React.useState(false);

  let label = 'Responsável';
  if (selected === 'meus') label = 'Minhas audiências';
  else if (selected === 'sem_responsavel') label = 'Sem responsável';
  else if (typeof selected === 'number') {
    const u = usuarios.find((u) => u.id === selected);
    if (u) label = u.nomeExibicao;
  }

  const selectedUser = typeof selected === 'number'
    ? usuarios.find((u) => u.id === selected)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange(null) : undefined}
            open={open}
          >
            {selectedUser && (
              <Avatar size="xs" className="border size-4">
                <AvatarImage src={selectedUser.avatarUrl || undefined} />
                <AvatarFallback className="text-micro-badge">
                  {selectedUser.nomeExibicao.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </FilterDropdownTrigger>
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-56')} align="start" side="bottom">
        <Command className="bg-transparent">
          <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex flex-col p-2 stack-nano border-b border-border/10")}>
            <button
              type="button"
              onClick={() => {
                onChange(selected === 'meus' ? null : 'meus');
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-micro-caption transition-colors cursor-pointer',
                selected === 'meus'
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
              )}
            >
              <span>Minhas audiências</span>
              {selected === 'meus' && <Check className="size-3 ml-auto" />}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(selected === 'sem_responsavel' ? null : 'sem_responsavel');
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-micro-caption transition-colors cursor-pointer',
                selected === 'sem_responsavel'
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
              )}
            >
              <span>Sem responsável</span>
              <span className="text-micro-caption ml-auto tabular-nums opacity-50">{semResponsavelCount}</span>
              {selected === 'sem_responsavel' && <Check className="size-3" />}
            </button>
          </div>
          <div className={cn("px-3 pt-2 pb-1.5")}>
            <CommandInput placeholder="Buscar usuário..." className="h-8 text-micro-caption rounded-lg" />
          </div>
          <CommandList className={cn("max-h-44 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <Text variant="caption" as="span" className="text-muted-foreground/65">Não encontrado</Text>
            </CommandEmpty>
            <CommandGroup>
              {usuarios.map((usuario) => (
                <CommandItem
                  key={usuario.id}
                  value={usuario.nomeExibicao}
                  onSelect={() => {
                    onChange(selected === usuario.id ? null : usuario.id);
                    setOpen(false);
                  }}
                  className={cn("flex inline-tight rounded-lg text-micro-caption px-2 py-1.5")}
                >
                  <Avatar size="xs" className="border size-4">
                    <AvatarImage src={usuario.avatarUrl || undefined} />
                    <AvatarFallback className="text-micro-badge">
                      {usuario.nomeExibicao.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{usuario.nomeExibicao}</span>
                  {selected === usuario.id && (
                    <Check className="size-3 ml-auto text-primary shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── TRT Filter ─────────────────────────────────────────────────────────

const TRIBUNAIS = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8',
  'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16',
  'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24',
  'TST',
] as const;

function TRTFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (trts: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const label = selected.length === 0
    ? 'Tribunal'
    : selected.length === 1
      ? selected[0]
      : `${selected.length} tribunais`;

  const handleToggle = (trt: string) => {
    const next = selected.includes(trt)
      ? selected.filter((t) => t !== trt)
      : [...selected, trt];
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={selected.length > 0}
            onClear={selected.length > 0 ? () => onChange([]) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <Command className="bg-transparent">
          <div className={cn("px-3 pt-3 pb-1.5")}>
            <CommandInput placeholder="Buscar TRT..." className="h-8 text-micro-caption rounded-lg" />
          </div>
          <CommandList className={cn("max-h-52 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <Text variant="caption" as="span" className="text-muted-foreground/65">Não encontrado</Text>
            </CommandEmpty>
            <CommandGroup>
              {TRIBUNAIS.map((trt) => (
                <CommandItem
                  key={trt}
                  value={trt}
                  onSelect={() => handleToggle(trt)}
                  className={cn("flex inline-tight rounded-lg text-micro-caption px-2 py-1.5")}
                >
                  <div className={cn(
                    'size-3.5 rounded border flex items-center justify-center',
                    selected.includes(trt)
                      ? 'bg-primary border-primary'
                      : 'border-border/50'
                  )}>
                    {selected.includes(trt) && <Check className="size-2.5 text-primary-foreground" />}
                  </div>
                  <span>{trt}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Modalidade Filter ─────────────────────────────────────────────────

const MODALIDADE_OPTIONS = [
  { value: 'virtual' as const, label: 'Virtual' },
  { value: 'presencial' as const, label: 'Presencial' },
  { value: 'hibrida' as const, label: 'Híbrida' },
];

function ModalidadeFilter({
  selected,
  onChange,
}: {
  selected: 'virtual' | 'presencial' | 'hibrida' | null;
  onChange: (v: 'virtual' | 'presencial' | 'hibrida' | null) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const label = selected
    ? MODALIDADE_OPTIONS.find((o) => o.value === selected)?.label ?? 'Modalidade'
    : 'Modalidade';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange(null) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-44')} align="start" side="bottom">
        <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex flex-col p-2 stack-nano")}>
          {MODALIDADE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(selected === opt.value ? null : opt.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-micro-caption transition-colors cursor-pointer',
                selected === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
              )}
            >
              <span>{opt.label}</span>
              {selected === opt.value && <Check className="size-3 ml-auto" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────

// ── Grau Filter ────────────────────────────────────────────────────────

const GRAU_OPTIONS: readonly { value: GrauTribunal; label: string }[] = [
  { value: GrauTribunal.PrimeiroGrau, label: GRAU_TRIBUNAL_LABELS[GrauTribunal.PrimeiroGrau] },
  { value: GrauTribunal.SegundoGrau, label: GRAU_TRIBUNAL_LABELS[GrauTribunal.SegundoGrau] },
  { value: GrauTribunal.TribunalSuperior, label: GRAU_TRIBUNAL_LABELS[GrauTribunal.TribunalSuperior] },
];

function GrauFilter({
  selected,
  onChange,
}: {
  selected: GrauTribunal[];
  onChange: (graus: GrauTribunal[]) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const label = selected.length === 0
    ? 'Grau'
    : selected.length === 1
      ? GRAU_OPTIONS.find((g) => g.value === selected[0])?.label ?? 'Grau'
      : `${selected.length} graus`;

  const handleToggle = (grau: GrauTribunal) => {
    const next = selected.includes(grau)
      ? selected.filter((g) => g !== grau)
      : [...selected, grau];
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={selected.length > 0}
            onClear={selected.length > 0 ? () => onChange([]) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-52')} align="start" side="bottom">
        <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex flex-col p-2 stack-nano")}>
          {GRAU_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleToggle(opt.value)}
              className={cn(
                'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-micro-caption transition-colors cursor-pointer',
                selected.includes(opt.value)
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
              )}
            >
              <div className={cn(
                'size-3.5 rounded border flex items-center justify-center',
                selected.includes(opt.value)
                  ? 'bg-primary border-primary'
                  : 'border-border/50'
              )}>
                {selected.includes(opt.value) && <Check className="size-2.5 text-primary-foreground" />}
              </div>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Tipo de Audiência Filter ──────────────────────────────────────────

function TipoAudienciaFilter({
  selected,
  onChange,
  tiposAudiencia,
}: {
  selected: number[];
  onChange: (ids: number[]) => void;
  tiposAudiencia: TipoAudiencia[];
}) {
  const [open, setOpen] = React.useState(false);

  const label = selected.length === 0
    ? 'Tipo'
    : selected.length === 1
      ? tiposAudiencia.find((t) => t.id === selected[0])?.descricao ?? 'Tipo'
      : `${selected.length} tipos`;

  const handleToggle = (id: number) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={selected.length > 0}
            onClear={selected.length > 0 ? () => onChange([]) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-64')} align="start" side="bottom">
        <Command className="bg-transparent">
          <div className={cn("px-3 pt-3 pb-1.5")}>
            <CommandInput placeholder="Buscar tipo..." className="h-8 text-micro-caption rounded-lg" />
          </div>
          <CommandList className={cn("max-h-52 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <Text variant="caption" as="span" className="text-muted-foreground/65">Não encontrado</Text>
            </CommandEmpty>
            <CommandGroup>
              {tiposAudiencia.map((tipo) => (
                <CommandItem
                  key={tipo.id}
                  value={tipo.descricao}
                  onSelect={() => handleToggle(tipo.id)}
                  className={cn("flex inline-tight rounded-lg text-micro-caption px-2 py-1.5")}
                >
                  <div className={cn(
                    'size-3.5 rounded border flex items-center justify-center',
                    selected.includes(tipo.id)
                      ? 'bg-primary border-primary'
                      : 'border-border/50'
                  )}>
                    {selected.includes(tipo.id) && <Check className="size-2.5 text-primary-foreground" />}
                  </div>
                  <span className="truncate">{tipo.descricao}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function AudienciasFilterBar({
  filters,
  onChange,
  usuarios,
  tiposAudiencia,
  currentUserId,
  counts,
}: AudienciasFilterBarProps) {
  return (
    <div className={cn("flex items-center inline-tight flex-wrap")}>
      <StatusFilter
        selected={filters.status}
        onChange={(status) => onChange({ ...filters, status })}
        counts={counts}
      />
      <ResponsavelFilter
        selected={filters.responsavel}
        onChange={(responsavel) => onChange({ ...filters, responsavel })}
        usuarios={usuarios}
        currentUserId={currentUserId}
        semResponsavelCount={counts.semResponsavel}
      />
      <TRTFilter
        selected={filters.trt}
        onChange={(trt) => onChange({ ...filters, trt })}
      />
      <ModalidadeFilter
        selected={filters.modalidade}
        onChange={(modalidade) => onChange({ ...filters, modalidade })}
      />
      <GrauFilter
        selected={filters.grau}
        onChange={(grau) => onChange({ ...filters, grau })}
      />
      <TipoAudienciaFilter
        selected={filters.tipoAudienciaId}
        onChange={(tipoAudienciaId) => onChange({ ...filters, tipoAudienciaId })}
        tiposAudiencia={tiposAudiencia}
      />
    </div>
  );
}
