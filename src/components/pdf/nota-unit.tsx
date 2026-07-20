import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Product } from '@/lib/supabase'

const RED = '#E53935'

const styles = StyleSheet.create({
  page: {
    padding: 12,
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: '#000000',
    lineHeight: 1.2,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: RED,
  },
  headerLeft: { flex: 1 },
  notaTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: RED,
    marginBottom: 2,
  },
  storeName: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  storeTagline: { fontSize: 6, color: '#555', marginBottom: 1 },
  storePhone: { fontSize: 6, color: '#555' },
  headerRight: { width: 140, borderWidth: 1, borderColor: '#ccc', padding: 4 },
  headerRightRow: { flexDirection: 'row', marginBottom: 1 },
  headerRightLabel: { fontSize: 6, color: '#666', width: 45 },
  headerRightValue: { fontSize: 6, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', flex: 1 },
  // No Nota
  notaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  notaLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    width: 55,
  },
  notaValue: {
    fontSize: 7,
    fontFamily: 'Courier',
  },
  // Table
  table: {
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: RED,
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  tableHeaderText: {
    fontSize: 6,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    paddingHorizontal: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 12,
  },
  colNo: { width: 16, fontSize: 6, textAlign: 'center' },
  colName: { flex: 1, fontSize: 6 },
  colQty: { width: 24, fontSize: 6, textAlign: 'center' },
  colHarga: { width: 60, fontSize: 6, textAlign: 'right', fontFamily: 'Courier' },
  colJumlah: { width: 60, fontSize: 6, textAlign: 'right', fontFamily: 'Courier' },
  // Bottom section: Left (Bonus+Catatan) + Right (Summary)
  bottomSection: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 4,
  },
  leftSection: { flex: 1 },
  rightSection: { width: 140 },
  // Bonus
  bonusBox: {
    marginBottom: 3,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  bonusHeader: {
    backgroundColor: RED,
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  bonusHeaderText: {
    fontSize: 6,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  bonusBody: {
    padding: 3,
  },
  bonusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 3,
  },
  checkboxChecked: {
    backgroundColor: '#000',
  },
  bonusText: {
    fontSize: 5.5,
  },
  // Catatan
  catatanBox: {
    marginBottom: 3,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  catatanHeader: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  catatanHeaderText: {
    fontSize: 6,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#333',
  },
  catatanBody: {
    padding: 3,
  },
  catatanText: {
    fontSize: 5.5,
    color: '#444',
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  summaryLabel: {
    width: 55,
    fontSize: 6,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    backgroundColor: RED,
    color: '#fff',
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  summaryValue: {
    width: 85,
    fontSize: 6,
    textAlign: 'right',
    fontFamily: 'Courier',
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  // Perhatian
  perhatianBox: {
    marginBottom: 4,
    padding: 3,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff9c4',
  },
  perhatianText: {
    fontSize: 5.5,
    color: '#333',
    textAlign: 'center',
  },
  // Rekening
  rekeningBox: {
    marginBottom: 4,
    padding: 3,
  },
  rekeningText: {
    fontSize: 6,
    color: '#333',
    textAlign: 'center',
  },
  rekeningBold: {
    fontSize: 6,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  // TTD
  ttdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
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

// Checkbox component
function CheckBox({ checked }: { checked: boolean }) {
  return (
    <View style={checked ? [styles.checkbox, styles.checkboxChecked] : styles.checkbox} />
  )
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
    notes?: string | null
  }
  product: Product
  storeName?: string
  storeAddress?: string
  storePhone?: string
}

const bonusOptions = ['Mouse', 'Keyboard', 'Tas', 'Mousepad']

export function NotaUnitPDF({
  sale,
  product,
  storeName = 'CENTRAL LAPTOP COMPUTER',
  storeAddress = '',
  storePhone = '0812-3456-7890',
}: NotaUnitProps) {
  const selectedBonus = sale.bonus || []
  const hasBonus = selectedBonus.length > 0 || sale.bonus_lainnya
  const hasDP = (sale.dp_amount ?? 0) > 0
  const sisa = sale.sell_price - (sale.dp_amount ?? 0)

  return (
    <Document>
      <Page size="A5" style={styles.page} orientation="portrait">
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.notaTitle}>KWITANSI</Text>
            <Text style={styles.storeName}>{storeName}</Text>
            <Text style={styles.storeTagline}>Service Laptop, Komputer, Software, Upgrade</Text>
            <Text style={styles.storePhone}>WA: {storePhone}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerRightRow}>
              <Text style={styles.headerRightLabel}>Tanggal</Text>
              <Text style={styles.headerRightValue}>: {formatDate(sale.date)}</Text>
            </View>
            <View style={styles.headerRightRow}>
              <Text style={styles.headerRightLabel}>Yth</Text>
              <Text style={styles.headerRightValue}>: {sale.buyer_name}</Text>
            </View>
            <View style={styles.headerRightRow}>
              <Text style={styles.headerRightLabel}>No. Hp</Text>
              <Text style={styles.headerRightValue}>: {sale.buyer_phone || '-'}</Text>
            </View>
          </View>
        </View>

        {/* NO NOTA */}
        <View style={styles.notaRow}>
          <Text style={styles.notaLabel}>No. Nota :</Text>
          <Text style={styles.notaValue}>{sale.invoice_number}</Text>
        </View>

        {/* TABEL PRODUK */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderText, width: 16, textAlign: 'center' }}>NO</Text>
            <Text style={{ ...styles.tableHeaderText, flex: 1 }}>NAMA PRODUK / MERK DAN TYPE</Text>
            <Text style={{ ...styles.tableHeaderText, width: 24, textAlign: 'center' }}>QTY</Text>
            <Text style={{ ...styles.tableHeaderText, width: 60, textAlign: 'right' }}>HARGA SATUAN</Text>
            <Text style={{ ...styles.tableHeaderText, width: 60, textAlign: 'right' }}>JUMLAH</Text>
          </View>
          {/* Baris data */}
          <View style={styles.tableRow}>
            <Text style={styles.colNo}>1</Text>
            <Text style={styles.colName}>{product.brand} {product.model} - {product.specs}</Text>
            <Text style={styles.colQty}>1</Text>
            <Text style={styles.colHarga}>{formatRupiah(sale.sell_price)}</Text>
            <Text style={styles.colJumlah}>{formatRupiah(sale.sell_price)}</Text>
          </View>
          {/* Baris kosong */}
          {[2, 3, 4, 5].map(i => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colNo}>{i}</Text>
              <Text style={styles.colName}></Text>
              <Text style={styles.colQty}></Text>
              <Text style={styles.colHarga}></Text>
              <Text style={styles.colJumlah}></Text>
            </View>
          ))}
        </View>

        {/* BOTTOM: Bonus + Catatan (kiri) | Summary (kanan) */}
        <View style={styles.bottomSection}>
          {/* Left: Bonus + Catatan */}
          <View style={styles.leftSection}>
            {/* BONUS */}
            <View style={styles.bonusBox}>
              <View style={styles.bonusHeader}>
                <Text style={styles.bonusHeaderText}>BONUS</Text>
              </View>
              <View style={styles.bonusBody}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {bonusOptions.map(opt => (
                    <View key={opt} style={{ ...styles.bonusItem, width: '50%' }}>
                      <CheckBox checked={selectedBonus.includes(opt)} />
                      <Text style={styles.bonusText}>{opt}</Text>
                    </View>
                  ))}
                </View>
                {sale.bonus_lainnya && (
                  <View style={{ ...styles.bonusItem, marginTop: 1 }}>
                    <CheckBox checked={true} />
                    <Text style={styles.bonusText}>{sale.bonus_lainnya}</Text>
                  </View>
                )}
                {!hasBonus && (
                  <Text style={{ ...styles.bonusText, color: '#999' }}>-</Text>
                )}
              </View>
            </View>

            {/* CATATAN OS DAN APLIKASI */}
            <View style={styles.catatanBox}>
              <View style={styles.catatanHeader}>
                <Text style={styles.catatanHeaderText}>CATATAN OS DAN APLIKASI</Text>
              </View>
              <View style={styles.catatanBody}>
                <Text style={styles.catatanText}>{sale.notes || '-'}</Text>
              </View>
            </View>
          </View>

          {/* Right: Summary */}
          <View style={styles.rightSection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Rp</Text>
              <Text style={styles.summaryValue}>{formatRupiah(sale.sell_price)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Dp Rp</Text>
              <Text style={styles.summaryValue}>{formatRupiah(sale.dp_amount ?? 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sisa Rp</Text>
              <Text style={styles.summaryValue}>{formatRupiah(sisa)}</Text>
            </View>
          </View>
        </View>

        {/* PERHATIAN */}
        <View style={styles.perhatianBox}>
          <Text style={styles.perhatianText}>
            Perhatian: Barang yang sudah di beli tidak dapat di tukar atau di kembalikan
          </Text>
        </View>

        {/* INFO REKENING */}
        <View style={styles.rekeningBox}>
          <Text style={styles.rekeningText}>
            No Rek BCA A.n <Text style={styles.rekeningBold}>Prawira Lambang Budi Prasetyo</Text> <Text style={styles.rekeningBold}>0670493041</Text>
          </Text>
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
