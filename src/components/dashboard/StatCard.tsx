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
    <Card className="transition-all hover:shadow-card-hover border border-hairline">
      <CardContent className="p-2.5 sm:p-3">
        <div className="flex items-center gap-2">
          {/* Icon Box - Compact */}
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${bgColors[color]}`}>
            <Icon size={16} className="text-white" strokeWidth={2.5} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-medium text-ash uppercase tracking-wider leading-tight">
              {title}
            </div>
            <div className={`text-base sm:text-lg font-bold leading-tight mt-0.5 ${valueClass || 'text-ink'}`} style={{ fontWeight: 700 }}>
              {value}
            </div>
            {sub && (
              <div className="text-[9px] text-stone leading-tight mt-0.5">
                {sub}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
