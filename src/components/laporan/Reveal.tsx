'use client'

import { cn } from '@/lib/utils'

interface RevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

// Pembungkus animasi fade-in-up bertahap (staggered) untuk section
export default function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <div className={cn('animate-reveal', className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
