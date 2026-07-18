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
      <CardContent className="p-2 sm:p-2.5">
        <div className="flex items-center gap-1.5">
          {/* Icon Box - Mini */}
          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded ${bgColors[color]}`}>
            <Icon size={14} className="text-white" strokeWidth={2.5} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-[8px] font-medium text-ash uppercase tracking-wide leading-none">
              {title}
            </div>
            <div className={`text-sm sm:text-base font-bold leading-none mt-1 ${valueClass || 'text-ink'}`} style={{ fontWeight: 700 }}>
              {value}
            </div>
            {sub && (
              <div className="text-[8px] text-stone leading-none mt-0.5">
                {sub}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
