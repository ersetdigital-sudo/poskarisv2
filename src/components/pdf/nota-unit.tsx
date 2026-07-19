import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Product } from '@/lib/supabase'

const BLUE = '#1976D2'

const styles = StyleSheet.create({
  page: {
    padding: 12,
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: '#000000',
    lineHeight: 1.2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: BLUE,
  },
  headerLeft: { flex: 1 },
  notaTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    marginBottom: 2,
  },
  storeName: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  storeInfo: { fontSize: 6, color: '#555', marginBottom: 1 },
  headerRight: { width: 140, borderWidth: 1, borderColor: '#ccc', padding: 4 },
  headerRightRow: { flexDirection: 'row', marginBottom: 1 },
  headerRightLabel: { fontSize: 6, color: '#666', width: 50 },
  headerRightValue: { fontSize: 6, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', flex: 1 },
  // Info box
  infoBox: {
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoHeader: {
    backgroundColor: BLUE,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  infoHeaderText: {
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  infoBody: { padding: 4 },
  infoRow: { flexDirection: 'row', marginBottom: 2 },
  infoLabel: { width: 80, fontSize: 6, color: '#666' },
  infoValue: { flex: 1, fontSize: 6, fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
  // Summary
  summaryContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  summaryBox: { width: 160 },
  summaryRow: { flexDirection: 'row', marginBottom: 0 },
  summaryLabel: {
    width: 70, fontSize: 6, fontWeight: 'bold', fontFamily: 'Helvetica-Bold',
    backgroundColor: BLUE, color: '#fff', paddingHorizontal: 3, paddingVertical: 2,
  },
  summaryValue: {
    width: 90, fontSize: 6, textAlign: 'right', fontFamily: 'Courier',
    paddingHorizontal: 3, paddingVertical: 2, borderWidth: 1, borderColor: '#ddd',
  },
  // Garansi
  garansiBox: {
    marginBottom: 4,
    padding: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  garansiText: { fontSize: 6, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', color: '#15803d' },
  garansiDate: { fontSize: 5.5, color: '#166534', marginTop: 1 },
  // Footer
  footer: { marginTop: 8, padding: 3, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee' },
  footerText: { fontSize: 5.5, color: '#444', textAlign: 'center' },
  // TTD
  ttdContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  ttdBox: { width: 100, alignItems: 'center' },
  ttdLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#000', height: 24, marginBottom: 2 },
  ttdLabel: { fontSize: 6, fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
})

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(d: string | null): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface NotaUnitProps {
  sale: {
    id: string
    invoice_number: string
    buyer_name: string
    buyer_phone: string | null
    sell_price: number
    buy_price: number
    dp_amount?: number
    bonus?: string[] | null
    bonus_lainnya?: string | null
    payment_method: string
    garansi: string
    warranty_end_date: string | null
    date: string
  }
  product: Product
  storeName?: string
  storeAddress?: string
  storePhone?: string
}

export function NotaUnitPDF({
  sale,
  product,
  storeName = 'Kasir POS',
  storeAddress = '',
  storePhone = '0812-3456-7890',
}: NotaUnitProps) {
  return (
    <Document>
      <Page size="A5" style={styles.page} orientation="portrait">
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.notaTitle}>INVOICE PENJUALAN</Text>
            <Text style={styles.storeName}>{storeName}</Text>
            <Text style={styles.storeInfo}>{storeAddress}</Text>
            <Text style={styles.storeInfo}>WA: {storePhone}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerRightRow}>
              <Text style={styles.headerRightLabel}>No. Invoice</Text>
              <Text style={styles.headerRightValue}>: {sale.invoice_number}</Text>
            </View>
            <View style={styles.headerRightRow}>
              <Text style={styles.headerRightLabel}>Tanggal</Text>
              <Text style={styles.headerRightValue}>: {formatDate(sale.date)}</Text>
            </View>
          </View>
        </View>

        {/* INFO UNIT */}
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoHeaderText}>Detail Unit</Text>
          </View>
          <View style={styles.infoBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Unit</Text>
              <Text style={styles.infoValue}>: {product.brand} {product.model}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Spesifikasi</Text>
              <Text style={styles.infoValue}>: {product.specs || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kondisi</Text>
              <Text style={styles.infoValue}>: {product.condition || '-'}</Text>
            </View>
            {product.imei_serial && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>S/N</Text>
                <Text style={styles.infoValue}>: {product.imei_serial}</Text>
              </View>
            )}
          </View>
        </View>

        {/* INFO PEMBELI */}
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoHeaderText}>Data Pembeli</Text>
          </View>
          <View style={styles.infoBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={styles.infoValue}>: {sale.buyer_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>No. HP</Text>
              <Text style={styles.infoValue}>: {sale.buyer_phone || '-'}</Text>
            </View>
          </View>
        </View>

        {/* RINGKASAN */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Harga Jual</Text>
              <Text style={styles.summaryValue}>{formatRupiah(sale.sell_price)}</Text>
            </View>
            {(sale.dp_amount ?? 0) > 0 && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>DP</Text>
                  <Text style={styles.summaryValue}>{formatRupiah(sale.dp_amount ?? 0)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Sisa</Text>
                  <Text style={styles.summaryValue}>{formatRupiah(sale.sell_price - (sale.dp_amount ?? 0))}</Text>
                </View>
              </>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Metode Bayar</Text>
              <Text style={styles.summaryValue}>{sale.payment_method}</Text>
            </View>
          </View>
        </View>

        {/* BONUS */}
        {(sale.bonus && sale.bonus.length > 0) || sale.bonus_lainnya ? (
          <View style={styles.garansiBox}>
            <Text style={styles.garansiText}>Bonus:</Text>
            {sale.bonus && sale.bonus.length > 0 && (
              <Text style={styles.garansiDate}>{sale.bonus.join(', ')}</Text>
            )}
            {sale.bonus_lainnya && (
              <Text style={styles.garansiDate}>{sale.bonus_lainnya}</Text>
            )}
          </View>
        ) : null}

        {/* GARANSI */}
        {sale.garansi && sale.garansi.toLowerCase() !== 'tanpa garansi' && (
          <View style={styles.garansiBox}>
            <Text style={styles.garansiText}>Garansi: {sale.garansi}</Text>
            {sale.warranty_end_date && (
              <Text style={styles.garansiDate}>Berlaku s/d: {formatDate(sale.warranty_end_date)}</Text>
            )}
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Terima kasih atas pembelian Anda</Text>
          <Text style={styles.footerText}>Barang yang sudah dibeli tidak dapat dikembalikan</Text>
        </View>

        {/* TANDA TANGAN */}
        <View style={styles.ttdContainer}>
          <View style={styles.ttdBox}>
            <Text style={styles.ttdLabel}>Pembeli</Text>
            <View style={styles.ttdLine} />
          </View>
          <View style={styles.ttdBox}>
            <Text style={styles.ttdLabel}>Penjual</Text>
            <View style={styles.ttdLine} />
          </View>
        </View>
      </Page>
    </Document>
  )
}
