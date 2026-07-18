'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ServisStatusCardProps {
  pending: number
  proses: number
  selesai: number
  loading: boolean
}

export function ServisStatusCard({ pending, proses, selesai, loading }: ServisStatusCardProps) {
  const total = pending + proses + selesai || 1

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Servis Hari Ini</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        ) : (
          <div className="mb-3 font-serif text-3xl font-bold tracking-tight text-foreground">
            {pending + proses + selesai}
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-3 flex h-1.5 overflow-hidden rounded-full bg-muted">
          {selesai > 0 && <div style={{ width: `${(selesai / total) * 100}%` }} className="bg-emerald-500" />}
          {proses > 0 && <div style={{ width: `${(proses / total) * 100}%` }} className="bg-amber-500" />}
          {pending > 0 && <div style={{ width: `${(pending / total) * 100}%` }} className="bg-muted-foreground/30" />}
        </div>

        {/* Legend */}
        <div className="space-y-1.5">
          <StatusRow label="Selesai" value={selesai} color="bg-emerald-500" loading={loading} />
          <StatusRow label="Proses" value={proses} color="bg-amber-500" loading={loading} />
          <StatusRow label="Pending" value={pending} color="bg-muted-foreground/30" loading={loading} />
        </div>
      </CardContent>
    </Card>
  )
}

function StatusRow({ label, value, color, loading }: { label: string; value: number; color: string; loading: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="font-mono text-xs font-semibold text-foreground">
        {loading ? '—' : value}
      </span>
    </div>
  )
}
