'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface BrandAutocompleteProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  required?: boolean
}

export function BrandAutocomplete({ value, onChange, placeholder, required }: BrandAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchBrands = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null)
        .ilike('brand', `%${q.trim()}%`)
        .limit(25)

      const unique = (data || []).reduce((acc, p) => {
        const brand = p.brand!.trim()
        if (brand) acc.set(brand.toLowerCase(), brand)
        return acc
      }, new Map<string, string>())
      setSuggestions(Array.from(unique.values()))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (val: string) => {
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchBrands(val)
      setShowDropdown(true)
    }, 200)
  }

  const handleFocus = () => {
    if (value.trim().length >= 1) {
      searchBrands(value)
      setShowDropdown(true)
    }
  }

  const handleSelect = (brand: string) => {
    onChange(brand)
    setShowDropdown(false)
    setSuggestions([])
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        required={required}
        value={value}
        onChange={e => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
      />
      {loading && (
        <span className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-muted border-t-primary" />
      )}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map(brand => (
            <button
              key={brand}
              type="button"
              onClick={() => handleSelect(brand)}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
            >
              {brand}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
