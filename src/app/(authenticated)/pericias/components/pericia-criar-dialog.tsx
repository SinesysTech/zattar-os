'use client';

/**
 * PericiaCriarDialog — Dialog para criação manual de perícias (Glass Briefing).
 * ============================================================================
 * Usa DialogFormShell + Combobox searchable para especialidade/perito (listas
 * longas). Segue tipografia semântica do DS.
 * ============================================================================
 */

import * as React from 'react';
import {
  Check,
  ChevronsUpDown,
  AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

import { toDateString } from '@/lib/date-utils';
import {
  CodigoTribunal,
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
  type UsuarioOption,
  type EspecialidadePericiaOption,
  type PeritoOption,
} from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '@/app/(authenticated)/expedientes';
import { actionCriarPericia } from '../actions/pericias-actions';
import { Text } from '@/components/ui/typography';

// =============================================================================
// PRIMITIVA: SearchableCombobox
// =============================================================================

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

function SearchableCombobox({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  options,
  disabled,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between bg-card font-normal h-9',
            !value && 'text-muted-foreground/60',
          )}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-[--radix-popover-trigger-width] p-0 rounded-2xl glass-dropdown overflow-hidden")}
        align="start"
      >
        <Command className="bg-transparent">
          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; pt-3 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "px-3 pt-3 pb-1.5")}>
            <CommandInput
              placeholder={searchPlaceholder}
              className={cn("h-8 text-caption rounded-lg")}
            />
          </div>
          <CommandList className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "max-h-60 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <span className="text-[11px] text-muted-foreground/40">
                {emptyMessage}
              </span>
            </CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      onChange(isSelected ? '' : opt.value);
                      setOpen(false);
                    }}
                    className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "inline-tight rounded-lg text-caption px-2 py-1.5")}
                  >
                    <span className="truncate flex-1">{opt.label}</span>
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
// PRIMITIVA: FieldLabel
// =============================================================================

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70")}>
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface PericiaCriarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarios: UsuarioOption[];
  especialidades: EspecialidadePericiaOption[];
  peritos: PeritoOption[];
  onSuccess?: () => void;
}

export function PericiaCriarDialog({
  open,
  onOpenChange,
  especialidades,
  peritos,
  onSuccess,
}: PericiaCriarDialogProps) {
  const [numeroProcesso, setNumeroProcesso] = React.useState('');
  const [trt, setTrt] = React.useState('');
  const [grau, setGrau] = React.useState('');
  const [prazoEntrega, setPrazoEntrega] = React.useState<Date | null>(null);
  const [situacaoCodigo, setSituacaoCodigo] = React.useState<string>(
    SituacaoPericiaCodigo.AGUARDANDO_LAUDO,
  );
  const [especialidadeId, setEspecialidadeId] = React.useState('');
  const [peritoId, setPeritoId] = React.useState('');
  const [observacoes, setObservacoes] = React.useState('');

  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setNumeroProcesso('');
    setTrt('');
    setGrau('');
    setPrazoEntrega(null);
    setSituacaoCodigo(SituacaoPericiaCodigo.AGUARDANDO_LAUDO);
    setEspecialidadeId('');
    setPeritoId('');
    setObservacoes('');
    setError(null);
  }, []);

  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

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

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('numeroProcesso', numeroProcesso);
      fd.append('trt', trt);
      fd.append('grau', grau);
      if (prazoEntrega) {
        fd.append('prazoEntrega', toDateString(prazoEntrega));
      }
      fd.append('situacaoCodigo', situacaoCodigo);
      if (especialidadeId) {
        fd.append('especialidadeId', especialidadeId);
      }
      if (peritoId) {
        fd.append('peritoId', peritoId);
      }
      if (observacoes) {
        fd.append('observacoes', observacoes);
      }

      const result = await actionCriarPericia(fd);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao criar perícia.');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = numeroProcesso.length >= 20 && trt && grau;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Nova Perícia</DialogTitle>
          <DialogDescription>Cadastre uma perícia manual — complemente os campos obrigatórios para registrar.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
      <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
        {/* Número do Processo (col span 2) */}
        <div className={cn("md:col-span-2 grid inline-snug")}>
          <FieldLabel required>Número do Processo</FieldLabel>
          <Input
            value={numeroProcesso}
            onChange={(e) => setNumeroProcesso(e.target.value)}
            placeholder="0000000-00.0000.0.00.0000"
            className="bg-card tabular-nums"
            disabled={isSaving}
          />
          {numeroProcesso && numeroProcesso.length < 20 && (
            <span className="text-[11px] text-muted-foreground/60 tabular-nums">
              Mínimo 20 caracteres ({numeroProcesso.length}/20)
            </span>
          )}
        </div>

        {/* TRT */}
        <div className={cn("grid inline-snug")}>
          <FieldLabel required>Tribunal</FieldLabel>
          <Select
            value={trt || '_none'}
            onValueChange={(v) => setTrt(v === '_none' ? '' : v)}
          >
            <SelectTrigger className="bg-card h-9">
              <SelectValue placeholder="Selecione o TRT" />
            </SelectTrigger>
            <SelectContent className="rounded-xl glass-dropdown max-h-60">
              <SelectItem value="_none">Selecione...</SelectItem>
              {CodigoTribunal.map((codigo) => (
                <SelectItem key={codigo} value={codigo}>
                  {codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grau */}
        <div className={cn("grid inline-snug")}>
          <FieldLabel required>Grau</FieldLabel>
          <Select
            value={grau || '_none'}
            onValueChange={(v) => setGrau(v === '_none' ? '' : v)}
          >
            <SelectTrigger className="bg-card h-9">
              <SelectValue placeholder="Selecione o grau" />
            </SelectTrigger>
            <SelectContent className="rounded-xl glass-dropdown">
              <SelectItem value="_none">Selecione...</SelectItem>
              {Object.entries(GRAU_TRIBUNAL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Prazo de Entrega */}
        <div className={cn("grid inline-snug")}>
          <FieldLabel>Prazo de Entrega</FieldLabel>
          <DatePicker
            value={prazoEntrega}
            onChange={setPrazoEntrega}
            placeholder="Selecionar data"
          />
        </div>

        {/* Situação */}
        <div className={cn("grid inline-snug")}>
          <FieldLabel>Situação inicial</FieldLabel>
          <Select value={situacaoCodigo} onValueChange={setSituacaoCodigo}>
            <SelectTrigger className="bg-card h-9">
              <SelectValue placeholder="Selecione a situação" />
            </SelectTrigger>
            <SelectContent className="rounded-xl glass-dropdown">
              {Object.values(SituacaoPericiaCodigo).map((codigo) => (
                <SelectItem key={codigo} value={codigo}>
                  {SITUACAO_PERICIA_LABELS[codigo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Especialidade (Combobox com busca) */}
        <div className={cn("grid inline-snug")}>
          <FieldLabel>Especialidade</FieldLabel>
          <SearchableCombobox
            value={especialidadeId}
            onChange={setEspecialidadeId}
            placeholder="Selecione a especialidade"
            searchPlaceholder="Buscar especialidade..."
            emptyMessage="Nenhuma especialidade encontrada"
            options={especialidadeOptions}
            disabled={isSaving}
          />
        </div>

        {/* Perito (Combobox com busca) */}
        <div className={cn("grid inline-snug")}>
          <FieldLabel>Perito</FieldLabel>
          <SearchableCombobox
            value={peritoId}
            onChange={setPeritoId}
            placeholder="Selecione o perito"
            searchPlaceholder="Buscar perito..."
            emptyMessage="Nenhum perito encontrado"
            options={peritoOptions}
            disabled={isSaving}
          />
        </div>

        {/* Observações */}
        <div className={cn("md:col-span-2 grid inline-snug")}>
          <FieldLabel>Observações</FieldLabel>
          <Textarea
            value={observacoes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setObservacoes(e.target.value)
            }
            placeholder="Adicione observações sobre a perícia (opcional)..."
            className="min-h-20 resize-none bg-card"
            disabled={isSaving}
          />
        </div>

        {/* Error banner */}
        {error && (
          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "md:col-span-2 flex items-start inline-tight px-3 py-2 rounded-lg bg-destructive/8 border border-destructive/20 text-destructive")}>
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <Text variant="caption">{error}</Text>
          </div>
        )}
      </div>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving || !isFormValid}>
              {isSaving ? 'Criando...' : 'Criar perícia'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
