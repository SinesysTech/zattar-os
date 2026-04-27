'use client';

import { useState } from 'react';
import {
  Building2,
  CalendarRange,
  ChevronDown,
  FileText,
  UserRound,
  X,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { usePesquisaStore } from '../hooks/use-pesquisa-store';
import type { MeioComunicacao } from '@/app/(authenticated)/comunica-cnj/domain';

const POPOVER_CLASSES = /* design-system-escape: p-0 → usar <Inset> */ 'rounded-2xl glass-dropdown overflow-hidden p-0';

// TRTs principais + tribunais superiores (lista estática para evitar round-trip)
const TRIBUNAIS = [
  { sigla: 'TST', nome: 'Tribunal Superior do Trabalho' },
  { sigla: 'TRT1', nome: 'TRT 1ª Região (RJ)' },
  { sigla: 'TRT2', nome: 'TRT 2ª Região (SP Capital)' },
  { sigla: 'TRT3', nome: 'TRT 3ª Região (MG)' },
  { sigla: 'TRT4', nome: 'TRT 4ª Região (RS)' },
  { sigla: 'TRT5', nome: 'TRT 5ª Região (BA)' },
  { sigla: 'TRT6', nome: 'TRT 6ª Região (PE)' },
  { sigla: 'TRT7', nome: 'TRT 7ª Região (CE)' },
  { sigla: 'TRT8', nome: 'TRT 8ª Região (PA/AP)' },
  { sigla: 'TRT9', nome: 'TRT 9ª Região (PR)' },
  { sigla: 'TRT10', nome: 'TRT 10ª Região (DF/TO)' },
  { sigla: 'TRT11', nome: 'TRT 11ª Região (AM/RR)' },
  { sigla: 'TRT12', nome: 'TRT 12ª Região (SC)' },
  { sigla: 'TRT13', nome: 'TRT 13ª Região (PB)' },
  { sigla: 'TRT14', nome: 'TRT 14ª Região (RO/AC)' },
  { sigla: 'TRT15', nome: 'TRT 15ª Região (Campinas)' },
  { sigla: 'TRT16', nome: 'TRT 16ª Região (MA)' },
  { sigla: 'TRT17', nome: 'TRT 17ª Região (ES)' },
  { sigla: 'TRT18', nome: 'TRT 18ª Região (GO)' },
  { sigla: 'TRT19', nome: 'TRT 19ª Região (AL)' },
  { sigla: 'TRT20', nome: 'TRT 20ª Região (SE)' },
  { sigla: 'TRT21', nome: 'TRT 21ª Região (RN)' },
  { sigla: 'TRT22', nome: 'TRT 22ª Região (PI)' },
  { sigla: 'TRT23', nome: 'TRT 23ª Região (MT)' },
  { sigla: 'TRT24', nome: 'TRT 24ª Região (MS)' },
];

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const MEIO_OPTIONS: { value: MeioComunicacao; label: string }[] = [
  { value: 'D', label: 'Diário Eletrônico' },
  { value: 'E', label: 'Edital' },
];

function FilterChip({
  label,
  icon: Icon,
  value,
  onClear,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value?: string;
  onClear?: () => void;
}) {
  const hasValue = Boolean(value);
  return (
    <div
      className={cn(
        /* design-system-escape: gap-1.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'group flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        hasValue
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30',
      )}
    >
      <Icon className="size-3" aria-hidden />
      <span>{label}</span>
      {hasValue ? (
        <>
          <span className="text-primary/60">·</span>
          <span className="max-w-32 truncate text-primary">{value}</span>
          {onClear && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onClear();
                }
              }}
              className={cn(/* design-system-escape: p-0.5 → usar <Inset> */ "ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors")}
              aria-label={`Limpar ${label}`}
            >
              <X className="size-2.5" aria-hidden />
            </span>
          )}
        </>
      ) : (
        <ChevronDown className="size-3 opacity-50" aria-hidden />
      )}
    </div>
  );
}

/**
 * Quick filters da página de busca — Tribunal, OAB, Meio, Período.
 * Popovers gerenciados independentemente, escrevem direto no store.
 */
export function SearchQuickFilters() {
  const filtros = usePesquisaStore((s) => s.filtros);
  const setFiltros = usePesquisaStore((s) => s.setFiltros);

  const [oabInput, setOabInput] = useState(filtros.numeroOab ?? '');
  const [oabUf, setOabUf] = useState(filtros.ufOab ?? '');

  const tribunalLabel = TRIBUNAIS.find((t) => t.sigla === filtros.siglaTribunal)?.sigla;
  const oabLabel = filtros.numeroOab
    ? `${filtros.numeroOab}${filtros.ufOab ? `/${filtros.ufOab}` : ''}`
    : undefined;
  const meioLabel = MEIO_OPTIONS.find((m) => m.value === filtros.meio)?.label;
  const periodoLabel =
    filtros.dataInicio || filtros.dataFim
      ? `${filtros.dataInicio ?? '...'} → ${filtros.dataFim ?? '...'}`
      : undefined;

  return (
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-wrap items-center justify-center gap-2")}>
      {/* Tribunal */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label="Filtrar por tribunal">
            <FilterChip label="Tribunal" icon={Building2} value={tribunalLabel} />
          </button>
        </PopoverTrigger>
        <PopoverContent className={cn(POPOVER_CLASSES, 'w-72')} align="start">
          <Command>
            <CommandInput placeholder="Buscar tribunal..." />
            <CommandList>
              <CommandEmpty>Nenhum tribunal encontrado.</CommandEmpty>
              <CommandGroup>
                {TRIBUNAIS.map((t) => (
                  <CommandItem
                    key={t.sigla}
                    value={`${t.sigla} ${t.nome}`}
                    onSelect={() =>
                      setFiltros({
                        siglaTribunal:
                          filtros.siglaTribunal === t.sigla ? undefined : t.sigla,
                      })
                    }
                  >
                    <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium tabular-nums")}>{t.sigla}</span>
                    <span className="ml-2 text-muted-foreground">{t.nome}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* OAB */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label="Filtrar por OAB">
            <FilterChip
              label="OAB"
              icon={UserRound}
              value={oabLabel}
              onClear={
                oabLabel
                  ? () => {
                      setOabInput('');
                      setOabUf('');
                      setFiltros({ numeroOab: undefined, ufOab: undefined });
                    }
                  : undefined
              }
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className={cn(POPOVER_CLASSES, /* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ 'w-64 p-4')} align="start">
          <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
            <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
              <Label htmlFor="pesquisa-oab-num">
                <Text variant="meta-label">Número</Text>
              </Label>
              <Input
                id="pesquisa-oab-num"
                type="text"
                value={oabInput}
                onChange={(e) => setOabInput(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="tabular-nums"
              />
            </div>
            <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
              <Label htmlFor="pesquisa-oab-uf">
                <Text variant="meta-label">UF</Text>
              </Label>
              <select
                id="pesquisa-oab-uf"
                value={oabUf}
                onChange={(e) => setOabUf(e.target.value)}
                className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; text-sm → migrar para <Text variant="body-sm"> */ "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm")}
              >
                <option value="">—</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={() =>
                setFiltros({
                  numeroOab: oabInput || undefined,
                  ufOab: oabUf || undefined,
                })
              }
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Meio */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label="Filtrar por meio de comunicação">
            <FilterChip
              label="Meio"
              icon={FileText}
              value={meioLabel}
              onClear={
                meioLabel ? () => setFiltros({ meio: undefined }) : undefined
              }
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className={cn(POPOVER_CLASSES, /* design-system-escape: p-2 → usar <Inset> */ 'w-56 p-2')} align="start">
          <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col gap-1")}>
            {MEIO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setFiltros({
                    meio: filtros.meio === opt.value ? undefined : opt.value,
                  })
                }
                className={cn(
                  /* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; text-sm → migrar para <Text variant="body-sm"> */ 'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                  filtros.meio === opt.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted/40',
                )}
              >
                {opt.label}
                {filtros.meio === opt.value && (
                  <span className="size-2 rounded-full bg-primary" aria-hidden />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Período */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label="Filtrar por período">
            <FilterChip
              label="Período"
              icon={CalendarRange}
              value={periodoLabel}
              onClear={
                periodoLabel
                  ? () =>
                      setFiltros({ dataInicio: undefined, dataFim: undefined })
                  : undefined
              }
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className={cn(POPOVER_CLASSES, /* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ 'w-72 p-4')} align="start">
          <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
            <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
              <Label htmlFor="pesquisa-data-inicio">
                <Text variant="meta-label">Data início</Text>
              </Label>
              <Input
                id="pesquisa-data-inicio"
                type="date"
                value={filtros.dataInicio ?? ''}
                onChange={(e) =>
                  setFiltros({ dataInicio: e.target.value || undefined })
                }
              />
            </div>
            <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
              <Label htmlFor="pesquisa-data-fim">
                <Text variant="meta-label">Data fim</Text>
              </Label>
              <Input
                id="pesquisa-data-fim"
                type="date"
                value={filtros.dataFim ?? ''}
                onChange={(e) =>
                  setFiltros({ dataFim: e.target.value || undefined })
                }
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
