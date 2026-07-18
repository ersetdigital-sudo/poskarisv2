import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  sub?: string
  icon: LucideIcon
  color?: 'primary' | 'emerald' | 'danger' | 'secondary'
  valueClass?: string
}

export default function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color = 'primary',
  valueClass = ''
}: StatCardProps) {
  const iconColors = {
    primary: 'text-ink',
    emerald: 'text-badge-success',
    danger: 'text-danger',
    secondary: 'text-ash'
  }

  const bgColors = {
    primary: 'bg-primary/10',
    emerald: 'bg-badge-success/10',
    danger: 'bg-danger/10',
    secondary: 'bg-secondary'
  }

  return (
    <Card className="transition-shadow hover:shadow-card-hover">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-ash">
            {title}
          </span>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${bgColors[color]}`}>
            <Icon size={16} className={iconColors[color]} />
          </div>
        </div>
        <div className={`text-2xl font-bold leading-none ${valueClass || 'text-ink'}`} style={{ fontWeight: 700 }}>
          {value}
        </div>
        {sub && (
          <p className="mt-2 text-xs text-stone leading-tight">
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
