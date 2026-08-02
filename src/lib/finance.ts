import { supabase } from '@/lib/supabase'

export interface FinancePeriod {
  year: number
  month: number | null
}

export interface FinanceMonthly {
  month: number
  omzetServis: number
  omzetPenjualan: number
  marginUnit: number
  biaya: number
  modalSparepart: number
  laba: number
}

export interface FinanceSummary {
  omzetServis: number
  omzetPenjualan: number
  marginUnit: number
  biayaOperasional: number
  modalSparepart: number
  labaBersih: number
  totalTransaksiServis: number
  totalTransaksiUnit: number
  monthly: FinanceMonthly[]
}

export interface FinanceService {
  id: string
  nota_number: string
  customer_name: string
  device_type: string
  device_brand: string | null
  service_fee: number
  parts_fee: number
  total_fee: number
  status: string
  date_in: string
  created_at: string
  // Belum ada di DB (out of scope): sparepart_cost?: number; sparepart_used?: unknown[]
}

export interface FinanceSale {
  id: string
  invoice_number: string
  buyer_name: string
  product_id: string | null
  sell_price: number
  buy_price: number
  margin: number
  status: string
  date: string
  created_at: string
}

export interface FinanceServicePart {
  service_id: string
  quantity: number
  buy_price: number
  date_in: string
}

export interface FinanceCost {
  amount: number
  period_month: number
  period_year: number
}

export interface FinancePeriodData {
  summary: FinanceSummary
  services: FinanceService[]
  sales: FinanceSale[]
  costs: FinanceCost[]
  parts: FinanceServicePart[]
}

const SERVICE_DONE = 'selesai'
const SALE_DONE = 'completed'

export function buildPeriodRange(period: FinancePeriod): { start: string; end: string } {
  const start = new Date(period.year, (period.month ?? 1) - 1, 1)
  const end = period.month != null
    ? new Date(period.year, period.month, 1)
    : new Date(period.year + 1, 0, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function computeFinanceSummary(
  services: FinanceService[],
  sales: FinanceSale[],
  costs: FinanceCost[],
  parts: FinanceServicePart[] = [],
): FinanceSummary {
  const doneServices = services.filter((s) => s.status === SERVICE_DONE)
  const doneSales = sales.filter((s) => s.status === SALE_DONE)

  const omzetServis = doneServices.reduce((sum, s) => sum + (s.total_fee || 0), 0)
  const omzetPenjualan = doneSales.reduce((sum, s) => sum + (s.sell_price || 0), 0)
  const marginUnit = doneSales.reduce(
    (sum, s) => sum + (s.margin ?? (s.sell_price || 0) - (s.buy_price || 0)),
    0,
  )
  const biayaOperasional = costs.reduce((sum, c) => sum + (c.amount || 0), 0)
  const modalSparepart = parts.reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.buy_price || 0),
    0,
  )
  const labaBersih = omzetServis + marginUnit - biayaOperasional - modalSparepart

  const monthly: FinanceMonthly[] = Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1
    const monthServices = doneServices.filter((s) => new Date(s.date_in).getMonth() === idx)
    const monthSales = doneSales.filter((s) => new Date(s.date).getMonth() === idx)
    const monthParts = parts.filter((p) => new Date(p.date_in).getMonth() === idx)
    const monthOmzetServis = monthServices.reduce((sum, s) => sum + (s.total_fee || 0), 0)
    const monthOmzetPenjualan = monthSales.reduce((sum, s) => sum + (s.sell_price || 0), 0)
    const monthMarginUnit = monthSales.reduce(
      (sum, s) => sum + (s.margin ?? (s.sell_price || 0) - (s.buy_price || 0)),
      0,
    )
    const biaya = costs
      .filter((c) => c.period_month === month)
      .reduce((sum, c) => sum + (c.amount || 0), 0)
    const modalSparepart = monthParts.reduce(
      (sum, p) => sum + (p.quantity || 0) * (p.buy_price || 0),
      0,
    )
    return {
      month,
      omzetServis: monthOmzetServis,
      omzetPenjualan: monthOmzetPenjualan,
      marginUnit: monthMarginUnit,
      biaya,
      modalSparepart,
      laba: monthOmzetServis + monthMarginUnit - biaya - modalSparepart,
    }
  })

  return {
    omzetServis,
    omzetPenjualan,
    marginUnit,
    biayaOperasional,
    modalSparepart,
    labaBersih,
    totalTransaksiServis: doneServices.length,
    totalTransaksiUnit: doneSales.length,
    monthly,
  }
}

export async function fetchFinanceData(period: FinancePeriod): Promise<FinancePeriodData> {
  const { start, end } = buildPeriodRange(period)

  const servicesQuery = supabase
    .from('services')
    .select(
      'id, nota_number, customer_name, device_type, device_brand, service_fee, parts_fee, total_fee, status, date_in, created_at',
    )
    .gte('date_in', start)
    .lt('date_in', end)

  const salesQuery = supabase
    .from('sales')
    .select(
      'id, invoice_number, buyer_name, product_id, sell_price, buy_price, margin, status, date, created_at',
    )
    .gte('date', start)
    .lt('date', end)

  let costsQuery = supabase
    .from('operational_costs')
    .select('amount, period_month, period_year')
    .eq('period_year', period.year)
  if (period.month != null) {
    costsQuery = costsQuery.eq('period_month', period.month)
  }

  const partsQuery = supabase
    .from('service_parts')
    .select('service_id, quantity, buy_price, services!inner(status, date_in)')
    .eq('services.status', SERVICE_DONE)
    .gte('services.date_in', start)
    .lt('services.date_in', end)

  const [servicesRes, salesRes, costsRes, partsRes] = await Promise.all([
    servicesQuery,
    salesQuery,
    costsQuery,
    partsQuery,
  ])

  const services = servicesRes.data || []
  const sales = salesRes.data || []
  const costs = costsRes.data || []
  const parts: FinanceServicePart[] = (partsRes.data || []).map((p) => ({
    service_id: p.service_id,
    quantity: p.quantity,
    buy_price: p.buy_price,
    date_in: p.services?.[0]?.date_in || '',
  }))

  return {
    services,
    sales,
    costs,
    parts,
    summary: computeFinanceSummary(services, sales, costs, parts),
  }
}
