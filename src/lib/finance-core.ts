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
  pembelianSparepart: number
  laba: number
}

export interface FinanceSummary {
  omzetServis: number
  omzetPenjualan: number
  marginUnit: number
  biayaOperasional: number
  modalSparepart: number
  pembelianSparepart: number
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
}

export interface FinanceSale {
  id: string
  invoice_number: string
  buyer_name: string
  product_id: string | null
  product_name: string
  item_type: string
  quantity: number
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

export interface FinancePurchase {
  product_id: string | null
  quantity: number
  buy_price: number
  purchase_date: string
}

export interface FinancePeriodData {
  summary: FinanceSummary
  services: FinanceService[]
  sales: FinanceSale[]
  costs: FinanceCost[]
  parts: FinanceServicePart[]
  purchases: FinancePurchase[]
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
  purchases: FinancePurchase[] = [],
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
  // Pembelian sparepart = pengeluaran toko saat beli (cash-basis).
  // modalSparepart (konsumsi di servis) TIDAK dikurangkan lagi => anti double-count.
  const pembelianSparepart = purchases.reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.buy_price || 0),
    0,
  )
  const labaBersih = omzetServis + marginUnit - biayaOperasional - pembelianSparepart

  const monthly: FinanceMonthly[] = Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1
    const monthServices = doneServices.filter((s) => new Date(s.date_in).getMonth() === idx)
    const monthSales = doneSales.filter((s) => new Date(s.date).getMonth() === idx)
    const monthParts = parts.filter((p) => new Date(p.date_in).getMonth() === idx)
    const monthPurchases = purchases.filter((p) => new Date(p.purchase_date).getMonth() === idx)
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
    const pembelianSparepart = monthPurchases.reduce(
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
      pembelianSparepart,
      laba: monthOmzetServis + monthMarginUnit - biaya - pembelianSparepart,
    }
  })

  return {
    omzetServis,
    omzetPenjualan,
    marginUnit,
    biayaOperasional,
    modalSparepart,
    pembelianSparepart,
    labaBersih,
    totalTransaksiServis: doneServices.length,
    totalTransaksiUnit: doneSales.length,
    monthly,
  }
}
