import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Product } from '@/lib/supabase'

const GREEN = '#2E7D32'

const styles = StyleSheet.create({
  page: { padding: 12, fontFamily: 'Helvetica', fontSize: 7, color: '#000000', lineHeight: 1.2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: GREEN },
  headerLeft: { flex: 1 },
  notaTitle: { fontSize: 11, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 2 },
  storeName: { fontSize: 10, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  storeInfo: { fontSize: 6, color: '#555', marginBottom: 1 },
  headerRight: { width: 140, borderWidth: 1, borderColor: '#ccc', padding: 4 },
  headerRightRow: { flexDirection: 'row', marginBottom: 1 },
  headerRightLabel: { fontSize: 6, color: '#666', width: 50 },
  headerRightValue: { fontSize: 6, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', flex: 1 },
  infoBox: { marginBottom: 4, borderWidth: 1, borderColor: '#ddd' },
  infoHeader: { backgroundColor: GREEN, paddingVertical: 3, paddingHorizontal: 4 },
  infoHeaderText: { fontSize: 7, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  infoBody: { padding: 4 },
  infoRow: { flexDirection: 'row', marginBottom: 2 },
  infoLabel: { width: 80, fontSize: 6, color: '#666' },
  infoValue: { flex: 1, fontSize: 6, fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  summaryBox: { width: 160 },
  summaryRow: { flexDirection: 'row', marginBottom: 0 },
  summaryLabel: { width: 70, fontSize: 6, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', backgroundColor: GREEN, color: '#fff', paddingHorizontal: 3, paddingVertical: 2 },
  summaryValue: { width: 90, fontSize: 6, textAlign: 'right', fontFamily: 'Courier', paddingHorizontal: 3, paddingVertical: 2, borderWidth: 1, borderColor: '#ddd' },
  footer: { marginTop: 8, padding: 3, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee' },
  footerText: { fontSize: 5.5, color: '#444', textAlign: 'center' },
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

interface NotaSparepartProps {
  sale: {
    id: string
    invoice_number: string
    buyer_name: string
    buyer_phone: string | null
    sell_price: number
    quantity: number
    payment_method: string
    date: string
  }
  product: Product
  storeName?: string
  storeAddress?: string
  storePhone?: string
}

export function NotaSparepartPDF({
  sale,
  product,
  storeName = 'Kasir POS',
  storeAddress = '',
  storePhone = '0812-3456-7890',
}: NotaSparepartProps) {
  return (
    <Document>
      <Page size="A5" style={styles.page} orientation="portrait">
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

        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoHeaderText}>Detail Barang</Text>
          </View>
          <View style={styles.infoBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Barang</Text>
              <Text style={styles.infoValue}>: {product.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Qty</Text>
              <Text style={styles.infoValue}>: {sale.quantity}</Text>
            </View>
            {product.brand && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Merk</Text>
                <Text style={styles.infoValue}>: {product.brand}</Text>
              </View>
            )}
          </View>
        </View>

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

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Harga Jual</Text>
              <Text style={styles.summaryValue}>{formatRupiah(sale.sell_price)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Metode Bayar</Text>
              <Text style={styles.summaryValue}>{sale.payment_method}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Terima kasih atas pembelian Anda</Text>
          <Text style={styles.footerText}>Barang yang sudah dibeli tidak dapat dikembalikan</Text>
        </View>

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
