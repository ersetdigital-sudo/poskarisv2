import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Product, Sale } from '@/lib/supabase'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  storeInfo: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 10,
    fontFamily: 'Courier',
    textAlign: 'right',
    color: '#444444',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 120,
    fontSize: 10,
    color: '#666666',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  unitBox: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    marginBottom: 16,
  },
  unitName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  unitDetail: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  unitLabel: {
    width: 100,
    fontSize: 9,
    color: '#888888',
  },
  unitValue: {
    fontSize: 10,
    flex: 1,
  },
  summaryBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 10,
    fontFamily: 'Courier',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
  },
})

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface NotaUnitProps {
  sale: Sale
  product: Product
  storeName?: string
  storeAddress?: string
  storePhone?: string
}

export function NotaUnitPDF({
  sale,
  product,
  storeName = 'Kasir POS',
  storeAddress = 'Jl. Contoh No. 123, Kota',
  storePhone = '0812-3456-7890',
}: NotaUnitProps) {
  const paymentMethodLabel: Record<string, string> = {
    tunai: 'Tunai',
    transfer: 'Transfer',
    tempo: 'Tempo',
  }

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.storeName}>{storeName}</Text>
            <Text style={styles.storeInfo}>{storeAddress}</Text>
            <Text style={styles.storeInfo}>Telp: {storePhone}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{sale.invoice_number}</Text>
          </View>
        </View>

        {/* Date + Payment */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 8, color: '#999' }}>Tanggal</Text>
            <Text style={{ fontSize: 10 }}>{formatDate(sale.date)}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: '#999', textAlign: 'right' }}>Metode Bayar</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>
              {paymentMethodLabel[sale.payment_method] || sale.payment_method}
            </Text>
          </View>
        </View>

        {/* Buyer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Pembeli</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nama</Text>
            <Text style={styles.value}>: {sale.buyer_name}</Text>
          </View>
          {sale.buyer_phone && (
            <View style={styles.row}>
              <Text style={styles.label}>No. HP</Text>
              <Text style={styles.value}>: {sale.buyer_phone}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.unitBox}>
          <Text style={styles.unitName}>{product.brand} {product.model}</Text>
          <View style={styles.unitDetail}>
            <Text style={styles.unitLabel}>Spesifikasi</Text>
            <Text style={styles.unitValue}>: {product.specs || '-'}</Text>
          </View>
          <View style={styles.unitDetail}>
            <Text style={styles.unitLabel}>Kondisi</Text>
            <Text style={styles.unitValue}>: {product.condition || '-'}</Text>
          </View>
          {product.imei_serial && (
            <View style={styles.unitDetail}>
              <Text style={styles.unitLabel}>IMEI/SN</Text>
              <Text style={{ ...styles.unitValue, fontFamily: 'Courier' }}>: {product.imei_serial}</Text>
            </View>
          )}
        </View>

        {/* Price Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Harga Beli</Text>
            <Text style={styles.summaryValue}>{formatRupiah(sale.buy_price)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>HARGA JUAL</Text>
            <Text style={styles.totalValue}>{formatRupiah(sale.sell_price)}</Text>
          </View>
        </View>

        {/* Notes */}
        {sale.notes && (
          <View style={{ marginTop: 12, padding: 8, backgroundColor: '#f8f8f8', borderRadius: 3 }}>
            <Text style={{ fontSize: 8, color: '#999', marginBottom: 2 }}>Catatan:</Text>
            <Text style={{ fontSize: 9 }}>{sale.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Terima kasih atas pembelian Anda</Text>
          <Text style={styles.footerText}>Dokumen ini dicetak secara otomatis oleh sistem</Text>
        </View>
      </Page>
    </Document>
  )
}
