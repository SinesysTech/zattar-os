'use client'

import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
}

function formatDateBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function parseDateBR(value: string): Date | null {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length !== 8) return null

  const day = parseInt(cleaned.substring(0, 2), 10)
  const month = parseInt(cleaned.substring(2, 4), 10)
  const year = parseInt(cleaned.substring(4, 8), 10)

  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
    return null
  }

  const date = new Date(year, month - 1, day)
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null
  }

  return date
}

function applyDateMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Date | undefined>(value ?? undefined)
  const [inputValue, setInputValue] = React.useState<string>(
    value ? formatDateBR(value) : ''
  )

  React.useEffect(() => {
    setSelected(value ?? undefined)
    setInputValue(value ? formatDateBR(value) : '')
  }, [value])

  const handleSelect = (date?: Date) => {
    setSelected(date)
    setInputValue(date ? formatDateBR(date) : '')
    onChange?.(date ?? null)
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyDateMask(e.target.value)
    setInputValue(masked)

    if (masked.length === 10) {
      const parsed = parseDateBR(masked)
      if (parsed) {
        setSelected(parsed)
        onChange?.(parsed)
      }
    } else if (masked.length === 0) {
      setSelected(undefined)
      onChange?.(null)
    }
  }

  const handleInputBlur = () => {
    if (inputValue.length > 0 && inputValue.length < 10) {
      setInputValue(selected ? formatDateBR(selected) : '')
    }
  }

  return (
    <div className="relative flex items-center">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder || 'DD/MM/AAAA'}
        className={cn('pr-10 h-9')}
        maxLength={10}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 h-9 w-9 hover:bg-transparent"
            onClick={() => setOpen(true)}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="p-0 w-auto">
          <Calendar selected={selected} onSelect={handleSelect} mode="single" initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  )
}

