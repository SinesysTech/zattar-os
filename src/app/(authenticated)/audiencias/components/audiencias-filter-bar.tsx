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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { StatusAudiencia } from '../domain';

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
}

interface AudienciasFilterBarProps {
  filters: AudienciasFilters;
  onChange: (filters: AudienciasFilters) => void;
  usuarios: Usuario[];
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
        /* design-system-escape: gap-1.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30',
        open && 'ring-1 ring-ring'
      )}
    >
      {children}
      <span className="text-micro-caption">{label}</span>
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

// ── Status Filter (Tabs inline) ───────────────────────────────────────

function StatusTabsFilter({
  selected,
  onChange,
  counts,
}: {
  selected: StatusAudiencia | null;
  onChange: (v: StatusAudiencia | null) => void;
  counts: { total: number; marcadas: number; finalizadas: number; canceladas: number };
}) {
  return (
    <Tabs
      value={selected ?? 'todas'}
      onValueChange={(v) => onChange(v === 'todas' ? null : (v as StatusAudiencia))}
    >
      <TabsList className="h-8">
        <TabsTrigger value="todas" className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv. */ "text-micro-caption gap-1.5 h-7 px-2.5")}>
          Todas <span className="tabular-nums text-muted-foreground/60">{counts.total}</span>
        </TabsTrigger>
        <TabsTrigger value={StatusAudiencia.Marcada} className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv. */ "text-micro-caption gap-1.5 h-7 px-2.5")}>
          Marcadas <span className="tabular-nums text-muted-foreground/60">{counts.marcadas}</span>
        </TabsTrigger>
        <TabsTrigger value={StatusAudiencia.Finalizada} className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv. */ "text-micro-caption gap-1.5 h-7 px-2.5")}>
          Finalizadas <span className="tabular-nums text-muted-foreground/60">{counts.finalizadas}</span>
        </TabsTrigger>
        <TabsTrigger value={StatusAudiencia.Cancelada} className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv. */ "text-micro-caption gap-1.5 h-7 px-2.5")}>
          Canceladas <span className="tabular-nums text-muted-foreground/60">{counts.canceladas}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
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
          <div className={cn(/* design-system-escape: p-2 → usar <Inset>; space-y-0.5 sem token DS */ "p-2 space-y-0.5 border-b border-border/10")}>
            <button
              type="button"
              onClick={() => {
                onChange(selected === 'meus' ? null : 'meus');
                setOpen(false);
              }}
              className={cn(
                /* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-micro-caption transition-colors cursor-pointer',
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
                /* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-micro-caption transition-colors cursor-pointer',
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
          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; pt-2 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "px-3 pt-2 pb-1.5")}>
            <CommandInput placeholder="Buscar usuário..." className="h-8 text-micro-caption rounded-lg" />
          </div>
          <CommandList className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "max-h-44 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <Text variant="caption" as="span" className="text-muted-foreground/40">Não encontrado</Text>
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
                  className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "gap-2 rounded-lg text-micro-caption px-2 py-1.5")}
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
          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; pt-3 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "px-3 pt-3 pb-1.5")}>
            <CommandInput placeholder="Buscar TRT..." className="h-8 text-micro-caption rounded-lg" />
          </div>
          <CommandList className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "max-h-52 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <Text variant="caption" as="span" className="text-muted-foreground/40">Não encontrado</Text>
            </CommandEmpty>
            <CommandGroup>
              {TRIBUNAIS.map((trt) => (
                <CommandItem
                  key={trt}
                  value={trt}
                  onSelect={() => handleToggle(trt)}
                  className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "gap-2 rounded-lg text-micro-caption px-2 py-1.5")}
                >
                  <div className={cn(
                    'size-3.5 rounded border flex items-center justify-center',
                    selected.includes(trt)
                      ? 'bg-primary border-primary'
                      : 'border-border/30'
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
        <div className={cn(/* design-system-escape: p-2 → usar <Inset>; space-y-0.5 sem token DS */ "p-2 space-y-0.5")}>
          {MODALIDADE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(selected === opt.value ? null : opt.value);
                setOpen(false);
              }}
              className={cn(
                /* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-micro-caption transition-colors cursor-pointer',
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

export function AudienciasFilterBar({
  filters,
  onChange,
  usuarios,
  currentUserId,
  counts,
}: AudienciasFilterBarProps) {
  return (
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-wrap")}>
      <StatusTabsFilter
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
    </div>
  );
}
