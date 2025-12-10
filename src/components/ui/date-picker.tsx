'use client'

import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'

interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
}

export function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Date | undefined>(value ?? undefined)

  React.useEffect(() => {
    setSelected(value ?? undefined)
  }, [value])

  const handleSelect = (date?: Date) => {
    setSelected(date)
    onChange?.(date ?? null)
    setOpen(false)
  }

  const label = selected
    ? selected.toLocaleDateString('pt-BR')
    : placeholder || 'Selecionar data'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start w-[180px] min-h-[44px] touch-manipulation"
          onClick={() => setOpen(true)}
        >
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-auto">
        <Calendar selected={selected} onSelect={handleSelect} mode="single" initialFocus />
      </PopoverContent>
    </Popover>
  )
}

