'use client'

interface ServisStatusCardProps {
  pending: number
  proses: number
  selesai: number
  loading: boolean
}

export function ServisStatusCard({ pending, proses, selesai, loading }: ServisStatusCardProps) {
  const total = pending + proses + selesai || 1

  return (
    <div className="card card-hover" style={{ padding: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
        <span className="text-caption">Servis Hari Ini</span>
      </div>

      {loading ? (
        <div className="skeleton" style={{ width: 80, height: 26, marginBottom: 'var(--space-xs)' }} />
      ) : (
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600,
          color: 'var(--color-ink)', letterSpacing: 'var(--tracking-display)', lineHeight: 1,
          marginBottom: 'var(--space-xs)',
        }}>
          {pending + proses + selesai}
        </div>
      )}

      {/* Breakdown bar */}
      <div style={{
        display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden',
        background: 'var(--color-paper-3)', marginBottom: 'var(--space-xs)',
      }}>
        {selesai > 0 && <div style={{ width: `${(selesai / total) * 100}%`, background: 'var(--color-success)' }} />}
        {proses > 0 && <div style={{ width: `${(proses / total) * 100}%`, background: 'var(--color-warning)' }} />}
        {pending > 0 && <div style={{ width: `${(pending / total) * 100}%`, background: 'var(--color-rule-strong)' }} />}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <StatusRow label="Selesai" value={selesai} color="var(--color-success)" loading={loading} />
        <StatusRow label="Proses" value={proses} color="var(--color-warning)" loading={loading} />
        <StatusRow label="Pending" value={pending} color="var(--color-rule-strong)" loading={loading} />
      </div>
    </div>
  )
}

function StatusRow({ label, value, color, loading }: { label: string; value: number; color: string; loading: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-ink)' }}>
        {loading ? '—' : value}
      </span>
    </div>
  )
}
