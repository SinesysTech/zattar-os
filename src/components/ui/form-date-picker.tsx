'use client'

import * as React from 'react'
import { DatePicker } from '@/components/ui/date-picker'

interface FormDatePickerProps {
  id?: string
  value?: string
  onChange?: (value?: string) => void
  placeholder?: string
  className?: string
}

const parseLocalDate = (dateString: string): Date => {
  const [y, m, d] = dateString.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const formatYYYYMMDD = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- id reservado para uso em formulários
export function FormDatePicker({ id, value, onChange, placeholder, className }: FormDatePickerProps) {
  return (
    <div className={className}>
      <DatePicker
        value={value ? parseLocalDate(value) : null}
        onChange={(d) => onChange?.(d ? formatYYYYMMDD(d) : undefined)}
        placeholder={placeholder}
      />
    </div>
  )
}

