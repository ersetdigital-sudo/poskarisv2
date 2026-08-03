'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AlertDialogProps {
  open: boolean
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'default'
  loading?: boolean
  confirmDisabled?: boolean
  icon?: React.ElementType
  onConfirm: () => void
  onCancel: () => void
}

// AlertDialog: konfirmasi berisiko tinggi (hapus data, aksi permanen).
// Perilaku ala HeroUI AlertDialog: blocking overlay, focus trap, ESC = batal,
// tapi styling konsisten dengan tema project (shadcn-style tokens).
export function AlertDialog({
  open,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'destructive',
  loading = false,
  confirmDisabled = false,
  icon: Icon = AlertTriangle,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const confirmRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!open) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (!loading) onCancel()
      }
    }

    function trapFocus(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusables = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLButtonElement[]
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('keydown', trapFocus)
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('keydown', trapFocus)
      document.body.style.overflow = ''
    }
  }, [open, loading, onCancel])

  if (!open) return null

  const isDestructive = variant === 'destructive'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => { if (!loading) onCancel() }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-desc"
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-card p-6 shadow-elevated"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
              isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            }`}
          >
            <Icon size={22} />
          </div>
          <h2 id="alert-dialog-title" className="text-base font-bold text-foreground">{title}</h2>
          {description && (
            <div id="alert-dialog-desc" className="mt-2 w-full text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button
            ref={cancelRef}
            variant="secondary"
            className="h-10"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={isDestructive ? 'destructive' : 'default'}
            className="h-10"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            ) : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
