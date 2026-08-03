'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerDetailSheet } from '@/components/customers/customer-detail-sheet'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button onClick={() => router.push('/customers')} variant="secondary" className="h-9 w-9 shrink-0 p-0">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="font-serif text-lg font-bold tracking-tight text-foreground">Detail Customer</h1>
          <p className="text-xs text-muted-foreground">Informasi dan riwayat transaksi customer</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Memuat data customer...
      </div>

      {/* Detail Customer — sheet/drawer */}
      <CustomerDetailSheet
        key={customerId}
        open
        customerId={customerId}
        onClose={() => router.push('/customers')}
      />
    </div>
  )
}
