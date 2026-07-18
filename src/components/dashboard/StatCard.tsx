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
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2.5">
          {/* Icon Box - Compact */}
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${bgColors[color]}`}>
            <Icon size={18} className="text-white" strokeWidth={2.5} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-ash uppercase tracking-wider mb-0.5">
              {title}
            </div>
            <div className={`text-lg sm:text-xl font-bold leading-tight ${valueClass || 'text-ink'}`} style={{ fontWeight: 700 }}>
              {value}
            </div>
            {sub && (
              <div className="text-[10px] text-stone mt-0.5">
                {sub}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
