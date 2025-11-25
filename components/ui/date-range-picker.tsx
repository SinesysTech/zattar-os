'use client'

import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'

type Range = { from?: Date; to?: Date } | undefined

interface DateRangePickerProps {
  value?: Range
  onChange?: (range: Range) => void
  placeholder?: string
  allowSingle?: boolean
}

interface DateRange {
  from: Date
  to?: Date
}

export function DateRangePicker({ value, onChange, placeholder, allowSingle = true }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Range>(value)

  React.useEffect(() => {
    setSelected(value)
  }, [value])

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
        <Button variant="outline" className="justify-start w-[220px]" onClick={() => setOpen(true)}>
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar selected={selected as DateRange} onSelect={handleSelect} mode="range" initialFocus />
      </PopoverContent>
    </Popover>
  )
}

