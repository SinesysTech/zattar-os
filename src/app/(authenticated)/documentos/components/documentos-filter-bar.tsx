'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/typography';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────

export type DocumentosTipoFiltro =
  | 'pasta'
  | 'documento'
  | 'imagem'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'outro';

export type DocumentosPeriodoFiltro = 'hoje' | '7d' | '30d' | null;

export interface DocumentosFilters {
  tipo: DocumentosTipoFiltro | null;
  criadorId: number | null;
  periodo: DocumentosPeriodoFiltro;
}

export interface DocumentosCriadorOption {
  id: number;
  nome: string;
  avatarUrl?: string | null;
}

interface DocumentosFilterBarProps {
  filters: DocumentosFilters;
  onChange: (filters: DocumentosFilters) => void;
  criadores: DocumentosCriadorOption[];
  counts: {
    total: number;
    pastas: number;
    documentos: number;
    imagens: number;
    videos: number;
    audios: number;
    pdfs: number;
    outros: number;
  };
}

// ── Shared ───────────────────────────────────────────────────────────

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
        /* design-system-escape: gap-1.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30',
        open && 'ring-1 ring-ring',
      )}
    >
      {children}
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
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
      )}
    </div>
  );
}

// ── Tipo Filter ──────────────────────────────────────────────────────

const TIPO_OPTIONS: Array<{ value: DocumentosTipoFiltro; label: string; countKey: keyof DocumentosFilterBarProps['counts'] }> = [
  { value: 'pasta', label: 'Pastas', countKey: 'pastas' },
  { value: 'documento', label: 'Documentos', countKey: 'documentos' },
  { value: 'imagem', label: 'Imagens', countKey: 'imagens' },
  { value: 'video', label: 'Vídeos', countKey: 'videos' },
  { value: 'audio', label: 'Áudios', countKey: 'audios' },
  { value: 'pdf', label: 'PDFs', countKey: 'pdfs' },
  { value: 'outro', label: 'Outros', countKey: 'outros' },
];

function TipoFilter({
  selected,
  onChange,
  counts,
}: {
  selected: DocumentosTipoFiltro | null;
  onChange: (v: DocumentosTipoFiltro | null) => void;
  counts: DocumentosFilterBarProps['counts'];
}) {
  const [open, setOpen] = React.useState(false);

  const label = selected
    ? TIPO_OPTIONS.find((o) => o.value === selected)?.label ?? 'Tipo'
    : 'Tipo';

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
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-52')} align="start" side="bottom">
        <div className={cn(/* design-system-escape: p-2 → usar <Inset>; space-y-0.5 sem token DS */ "p-2 space-y-0.5")}>
          {TIPO_OPTIONS.map((opt) => {
            const count = counts[opt.countKey];
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(selected === opt.value ? null : opt.value);
                  setOpen(false);
                }}
                className={cn(
                  /* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-caption transition-colors cursor-pointer',
                  selected === opt.value
                    ? 'bg-primary/8 text-primary'
                    : 'hover:bg-muted/30 text-muted-foreground/70',
                )}
              >
                <span>{opt.label}</span>
                <span className="text-[9px] ml-auto tabular-nums opacity-50">{count}</span>
                {selected === opt.value && <Check className="size-3" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Criador Filter ──────────────────────────────────────────────────

function CriadorFilter({
  selected,
  onChange,
  criadores,
}: {
  selected: number | null;
  onChange: (v: number | null) => void;
  criadores: DocumentosCriadorOption[];
}) {
  const [open, setOpen] = React.useState(false);

  const selectedUser = typeof selected === 'number'
    ? criadores.find((u) => u.id === selected)
    : null;

  const label = selectedUser ? selectedUser.nome : 'Criador';

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
                <AvatarFallback className="text-[6px]">
                  {selectedUser.nome.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </FilterDropdownTrigger>
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-56')} align="start" side="bottom">
        <Command className="bg-transparent">
          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; pt-3 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "px-3 pt-3 pb-1.5")}>
            <CommandInput placeholder="Buscar criador..." className={cn("h-8 text-caption rounded-lg")} />
          </div>
          <CommandList className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "max-h-52 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <Text variant="caption" as="span" className="text-muted-foreground/40">Não encontrado</Text>
            </CommandEmpty>
            <CommandGroup>
              {criadores.map((criador) => (
                <CommandItem
                  key={criador.id}
                  value={criador.nome}
                  onSelect={() => {
                    onChange(selected === criador.id ? null : criador.id);
                    setOpen(false);
                  }}
                  className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "gap-2 rounded-lg text-caption px-2 py-1.5")}
                >
                  <Avatar size="xs" className="border size-5">
                    <AvatarImage src={criador.avatarUrl || undefined} />
                    <AvatarFallback className="text-[7px]">
                      {criador.nome.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{criador.nome}</span>
                  {selected === criador.id && (
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

// ── Período Filter ──────────────────────────────────────────────────

const PERIODO_OPTIONS: Array<{ value: Exclude<DocumentosPeriodoFiltro, null>; label: string }> = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
];

function PeriodoFilter({
  selected,
  onChange,
}: {
  selected: DocumentosPeriodoFiltro;
  onChange: (v: DocumentosPeriodoFiltro) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const label = selected
    ? PERIODO_OPTIONS.find((o) => o.value === selected)?.label ?? 'Período'
    : 'Período';

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
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <div className={cn(/* design-system-escape: p-2 → usar <Inset>; space-y-0.5 sem token DS */ "p-2 space-y-0.5")}>
          {PERIODO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(selected === opt.value ? null : opt.value);
                setOpen(false);
              }}
              className={cn(
                /* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-caption transition-colors cursor-pointer',
                selected === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70',
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

// ── Main Export ──────────────────────────────────────────────────────

export function DocumentosFilterBar({
  filters,
  onChange,
  criadores,
  counts,
}: DocumentosFilterBarProps) {
  return (
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-wrap")}>
      <TipoFilter
        selected={filters.tipo}
        onChange={(tipo) => onChange({ ...filters, tipo })}
        counts={counts}
      />
      <CriadorFilter
        selected={filters.criadorId}
        onChange={(criadorId) => onChange({ ...filters, criadorId })}
        criadores={criadores}
      />
      <PeriodoFilter
        selected={filters.periodo}
        onChange={(periodo) => onChange({ ...filters, periodo })}
      />
    </div>
  );
}
