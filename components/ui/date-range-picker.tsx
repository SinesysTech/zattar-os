'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

type Range = { from?: Date; to?: Date } | undefined

interface DateRangePickerProps {
  value?: Range
  onChange?: (range: Range) => void
  placeholder?: string
  allowSingle?: boolean
  className?: string
}

interface DateRange {
  from: Date
  to?: Date
}

export function DateRangePicker({ value, onChange, placeholder, allowSingle = true, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Range>(value)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [popoverWidth, setPopoverWidth] = React.useState<number>(0)

  React.useEffect(() => {
    setSelected(value)
  }, [value])

  React.useEffect(() => {
    if (triggerRef.current) {
      setPopoverWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  const handleSelect = (range: Range) => {
    let next = range
    if (allowSingle && next && next.from && !next.to) {
      next = { from: next.from, to: next.from }
    }
    setSelected(next)
    onChange?.(next)
  }

  const label = selected?.from
    ? selected.to
      ? `${selected.from.toLocaleDateString('pt-BR')} - ${selected.to.toLocaleDateString('pt-BR')}`
      : selected.from.toLocaleDateString('pt-BR')
    : placeholder || 'Selecionar período'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          className={cn(
            "justify-start w-full h-9 text-sm font-normal",
            !selected?.from && "text-muted-foreground",
            className
          )}
          onClick={() => setOpen(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0"
        style={{ minWidth: popoverWidth > 0 ? popoverWidth : 'auto' }}
      >
        <Calendar
          selected={selected as DateRange}
          onSelect={handleSelect}
          mode="range"
          initialFocus
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}
