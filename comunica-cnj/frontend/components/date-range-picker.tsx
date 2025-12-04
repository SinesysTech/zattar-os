'use client';
import { useEffect, useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { type DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
export function parseLocalDate(dateString: string): Date { const [year, month, day] = dateString.split('-').map(Number); return new Date(year, month - 1, day); }
interface DateRangePickerProps { label?: string; value?: { from?: Date; to?: Date }; onChange?: (range: DateRange | undefined) => void; onFromChange?: (date: string | undefined) => void; onToChange?: (date: string | undefined) => void; id?: string; className?: string; icon?: React.ReactNode; }
export function DateRangePicker({ label, value, onChange, onFromChange, onToChange, id, className, icon }: DateRangePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>(value?.from || value?.to ? { from: value.from, to: value.to } : undefined);
  useEffect(() => { if (value?.from || value?.to) { setRange({ from: value.from, to: value.to }); } else if (!value?.from && !value?.to) { setRange(undefined); } }, [value]);
  const handleSelect = (selectedRange: DateRange | undefined) => { setRange(selectedRange); onChange?.(selectedRange); if (selectedRange?.from) { const d = selectedRange.from; const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); const fromDate = `${year}-${month}-${day}`; onFromChange?.(fromDate); } else { onFromChange?.(undefined); } if (selectedRange?.to) { const d = selectedRange.to; const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); const toDate = `${year}-${month}-${day}`; onToChange?.(toDate); } else { onToChange?.(undefined); } };
  return (<div className={className}>{label && (<Label htmlFor={id} className="px-1">{label}</Label>)}<Popover><PopoverTrigger asChild><Button variant="outline" id={id} className="w-full h-10 justify-between font-normal"><span className="flex items-center gap-2">{icon || null}<span>{range?.from && range?.to ? `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(range.to, 'dd/MM/yyyy', { locale: ptBR })}` : range?.from ? `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} - ...` : 'Selecione um período'}</span></span><ChevronDownIcon className="h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-auto overflow-hidden p-0" align="start"><Calendar mode="range" selected={range} onSelect={handleSelect} locale={ptBR} /></PopoverContent></Popover></div>);
}

