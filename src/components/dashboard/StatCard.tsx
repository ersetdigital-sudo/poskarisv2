import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  sub?: string
  icon: LucideIcon
  color?: 'primary' | 'emerald' | 'orange' | 'danger' | 'sky'
  valueClass?: string
  className?: string
}

// Sub-caption color based on status
const SUB_COLOR = {
  emerald: 'text-badge-success',
  primary: 'text-stone',
  orange: 'text-badge-warning',
  danger: 'text-danger',
  sky: 'text-badge-info',
}

export default function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color = 'primary',
  valueClass = '',
  className = ''
}: StatCardProps) {
  return (
    <Card className={cn('shadow-card hover:shadow-card-hover transition-shadow', className)}>
      <CardContent className="p-3.5 flex items-center gap-2.5">
        {/* Icon Box - ALWAYS BLACK with white icon */}
        <div className="h-9 w-9 rounded-sm bg-primary text-on-primary grid place-items-center shrink-0">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>

        {/* Content - Compact spacing */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium text-ash leading-none truncate uppercase tracking-wide">
            {title}
          </p>
          <p className={cn(
            'text-lg font-bold mt-0.5 leading-none break-words tabular-nums truncate',
            valueClass || 'text-ink'
          )} style={{ fontWeight: 700 }}>
            {value}
          </p>
          {sub && (
            <p className={cn(
              'text-[10px] font-medium mt-0.5 leading-none truncate',
              SUB_COLOR[color] || SUB_COLOR.primary
            )}>
              {sub}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
