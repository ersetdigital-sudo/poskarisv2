import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  sub?: string
  icon: LucideIcon
  color?: 'primary' | 'emerald' | 'orange' | 'danger'
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
  const bgColors = {
    primary: 'bg-primary',
    emerald: 'bg-badge-success',
    orange: 'bg-badge-warning',
    danger: 'bg-danger'
  }

  return (
    <Card className="transition-shadow hover:shadow-card-hover">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Icon Box - Black rounded */}
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${bgColors[color]}`}>
            <Icon size={22} className="text-white" strokeWidth={2} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-ash uppercase tracking-wider mb-1.5">
              {title}
            </div>
            <div className={`text-xl sm:text-2xl font-bold leading-tight ${valueClass || 'text-ink'}`} style={{ fontWeight: 700 }}>
              {value}
            </div>
            {sub && (
              <div className="text-xs text-stone mt-1">
                {sub}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
