'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'

// Format angka dengan pemisah ribuan titik (gaya Indonesia): 150000 -> "150.000"
export function formatThousand(value: number | string): string {
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('id-ID')
}

// Parse kembali ke number murni: "150.000" -> 150000
export function parseThousand(value: string): number {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

interface RupiahInputProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  value: number
  onChange: (value: number) => void
}

export function RupiahInput({ value, onChange, placeholder = '0', ...props }: RupiahInputProps) {
  const display = value === 0 ? '' : formatThousand(value)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (raw === '') {
      onChange(0)
      return
    }
    onChange(parseThousand(raw))
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
    />
  )
}
