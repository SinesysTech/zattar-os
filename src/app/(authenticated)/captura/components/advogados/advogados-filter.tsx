'use client';

import * as React from 'react';
import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AdvogadosFilterProps {
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  value: string;
  onValueChange: (value: string) => void;
}

export function AdvogadosFilter({
  title,
  options,
  value,
  onValueChange,
}: AdvogadosFilterProps) {
  const [open, setOpen] = useState(false);

  const isActive = value !== 'all' && !!value;
  const displayLabel = isActive
    ? options.find((o) => o.value === value)?.label ?? title
    : title;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
            isActive
              ? 'border-primary/20 bg-primary/5 text-primary'
              : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30'
          )}
        >
          <span>{displayLabel}</span>
          {isActive ? (
            <X
              className="size-2.5"
              onClick={(e) => {
                e.stopPropagation();
                onValueChange('all');
                setOpen(false);
              }}
            />
          ) : (
            <ChevronDown className="size-2.5 opacity-50" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="rounded-2xl glass-dropdown overflow-hidden p-0 w-48"
        align="start"
      >
        <div className="p-2 space-y-0.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onValueChange(opt.value === value ? 'all' : opt.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer',
                value === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
              )}
            >
              {opt.icon && <opt.icon className="size-3.5 opacity-70" />}
              <span>{opt.label}</span>
              {value === opt.value && <Check className="size-3 ml-auto" />}
            </button>
          ))}
          {isActive && (
            <>
              <div className="border-t border-border/10 my-1" />
              <button
                type="button"
                onClick={() => {
                  onValueChange('all');
                  setOpen(false);
                }}
                className="w-full text-center text-[10px] text-muted-foreground/50 hover:text-muted-foreground py-1.5 cursor-pointer"
              >
                Limpar filtros
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
