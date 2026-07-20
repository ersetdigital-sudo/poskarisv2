'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, Customer } from '@/lib/supabase'
import { Search, User, Phone, Loader2 } from 'lucide-react'

interface CustomerAutocompleteProps {
  nama: string
  noWa: string
  onNamaChange: (val: string) => void
  onNoWaChange: (val: string) => void
  onCustomerSelect: (customer: Customer) => void
}

export function CustomerAutocomplete({
  nama,
  noWa,
  onNamaChange,
  onNoWaChange,
  onCustomerSelect,
}: CustomerAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeField, setActiveField] = useState<'nama' | 'phone' | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchCustomers = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .or(`nama.ilike.%${q}%,no_wa.ilike.%${q}%`)
        .limit(10)

      setResults(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (value: string, field: 'nama' | 'phone') => {
    setActiveField(field)
    if (field === 'nama') {
      onNamaChange(value)
      setQuery(value)
    } else {
      onNoWaChange(value)
      setQuery(value)
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchCustomers(value)
      setShowDropdown(true)
    }, 300)
  }

  const handleSelect = (customer: Customer) => {
    onCustomerSelect(customer)
    setShowDropdown(false)
    setQuery('')
    setResults([])
  }

  const handleFocus = (field: 'nama' | 'phone') => {
    setActiveField(field)
    const val = field === 'nama' ? nama : noWa
    if (val.length >= 2) {
      setQuery(val)
      searchCustomers(val)
      setShowDropdown(true)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Nama Field */}
      <div className="relative" ref={activeField === 'nama' ? dropdownRef : undefined}>
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Nama Customer <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={activeField === 'nama' ? inputRef : undefined}
            type="text"
            required
            value={nama}
            onChange={e => handleInputChange(e.target.value, 'nama')}
            onFocus={() => handleFocus('nama')}
            placeholder="Masukkan nama customer"
            className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {loading && activeField === 'nama' && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {showDropdown && activeField === 'nama' && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
            {results.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
              >
                <p className="text-sm font-medium text-foreground">{c.nama}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Phone size={10} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-mono">{c.no_wa}</p>
                </div>
                {c.alamat && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.alamat}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* No. WA Field */}
      <div className="relative" ref={activeField === 'phone' ? dropdownRef : undefined}>
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          No. WhatsApp <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={activeField === 'phone' ? inputRef : undefined}
            type="text"
            required
            value={noWa}
            onChange={e => handleInputChange(e.target.value, 'phone')}
            onFocus={() => handleFocus('phone')}
            placeholder="08xxxxxxxxxx"
            className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {loading && activeField === 'phone' && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {showDropdown && activeField === 'phone' && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
            {results.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
              >
                <p className="text-sm font-medium text-foreground">{c.nama}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Phone size={10} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-mono">{c.no_wa}</p>
                </div>
                {c.alamat && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.alamat}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
