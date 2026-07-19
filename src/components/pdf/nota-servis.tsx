import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Service } from '@/lib/supabase'

const RED = '#E53935'

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#000000',
    lineHeight: 1.3,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: RED,
  },
  headerLeft: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  storeTagline: {
    fontSize: 7,
    color: '#555',
    marginBottom: 1,
  },
  storePhone: {
    fontSize: 7,
    color: '#555',
  },
  notaTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: RED,
    marginBottom: 4,
  },
  headerRight: {
    width: 180,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 6,
  },
  headerRightRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  headerRightLabel: {
    fontSize: 7,
    color: '#666',
    width: 55,
  },
  headerRightValue: {
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  // Tipe Laptop row
  tipeRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tipeLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    width: 70,
  },
  tipeValue: {
    fontSize: 8,
    flex: 1,
  },
  // Table
  table: {
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: RED,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 14,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  colNo: {
    width: 20,
    fontSize: 7,
    textAlign: 'center',
  },
  colService: {
    flex: 1,
    fontSize: 7,
  },
  colHarga: {
    width: 70,
    fontSize: 7,
    textAlign: 'right',
    fontFamily: 'Courier',
  },
  colKeterangan: {
    width: 80,
    fontSize: 6,
    color: '#555',
    paddingLeft: 4,
  },
  // Summary (kanan bawah)
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  summaryBox: {
    width: 180,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    backgroundColor: RED,
    color: '#fff',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  summaryValue: {
    width: 90,
    fontSize: 7,
    textAlign: 'right',
    fontFamily: 'Courier',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  // Info rows (Kelengkapan, Garansi)
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoLabel: {
    width: 120,
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    backgroundColor: RED,
    color: '#fff',
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  infoValue: {
    flex: 1,
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  // Syarat
  syaratContainer: {
    marginTop: 6,
    marginBottom: 8,
    padding: 4,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
  },
  syaratTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  syaratText: {
    fontSize: 6,
    color: '#444',
    lineHeight: 1.3,
  },
  // Tanda tangan
  ttdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  ttdBox: {
    width: 120,
    alignItems: 'center',
  },
  ttdLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    height: 30,
    marginBottom: 4,
  },
  ttdLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
})

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(d: string | null): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface NotaServisProps {
  service: Service
  parts?: { name: string; quantity: number; price: number }[]
  storeName?: string
  storeAddress?: string
  storePhone?: string
}

export function NotaServisPDF({
  service,
  parts = [],
  storeName = 'CENTRAL LAPTOP COMPUTER',
  storeAddress = '',
  storePhone = '0812-3456-7890',
}: NotaServisProps) {
  // Build table rows
  const tableRows: { no: number; service: string; harga: number; keterangan: string }[] = []

  // Sparepart rows
  parts.forEach((part) => {
    tableRows.push({
      no: tableRows.length + 1,
      service: `${part.name} (Qty: ${part.quantity})`,
      harga: part.price * part.quantity,
      keterangan: '',
    })
  })

  // Jasa Servis row
  if (service.service_fee > 0) {
    tableRows.push({
      no: tableRows.length + 1,
      service: 'Jasa Servis',
      harga: service.service_fee,
      keterangan: '',
    })
  }

  // Fill keterangan di baris pertama saja
  if (tableRows.length > 0 && service.notes) {
    tableRows[0].keterangan = service.notes
  }

  // Pad to minimum 5 rows
  while (tableRows.length < 5) {
    tableRows.push({
      no: tableRows.length + 1,
      service: '',
      harga: 0,
      keterangan: '',
    })
  }

  // Device type string
  const tipePerangkat = [service.device_type, service.device_brand, service.device_model]
    .filter(Boolean)
    .join(' - ')

  // Garansi info
  const garansiText = service.garansi && service.garansi.toLowerCase() !== 'tanpa garansi'
    ? service.garansi
    : ''
  const garansiEndDate = service.warranty_end_date ? formatDate(service.warranty_end_date) : ''

  return (
    <Document>
      <Page size={[297, 210]} style={styles.page} orientation="landscape">
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.notaTitle}>NOTA SERVICE</Text>
            <Text style={styles.storeName}>{storeName}</Text>
            <Text style={styles.storeTagline}>Service Laptop, Komputer, Software, Upgrade</Text>
            <Text style={styles.storePhone}>WA: {storePhone}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerRightRow}>
              <Text style={styles.headerRightLabel}>Tanggal Masuk</Text>
              <Text style={styles.headerRightValue}>: {formatDate(service.date_in)}</Text>
            </View>
            <View style={styles.headerRightRow}>
              <Text style={styles.headerRightLabel}>Nama</Text>
              <Text style={styles.headerRightValue}>: {service.customer_name}</Text>
            </View>
            <View style={styles.headerRightRow}>
              <Text style={styles.headerRightLabel}>Nomor WA</Text>
              <Text style={styles.headerRightValue}>: {service.customer_phone}</Text>
            </View>
          </View>
        </View>

        {/* TIPE LAPTOP */}
        <View style={styles.tipeRow}>
          <Text style={styles.tipeLabel}>Tipe Laptop :</Text>
          <Text style={styles.tipeValue}>{tipePerangkat || '-'}</Text>
        </View>

        {/* TABEL UTAMA */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderText, width: 20, textAlign: 'center' }}>No.</Text>
            <Text style={{ ...styles.tableHeaderText, flex: 1 }}>Service / Kerusakan / Upgrade</Text>
            <Text style={{ ...styles.tableHeaderText, width: 70, textAlign: 'right' }}>Harga</Text>
            <Text style={{ ...styles.tableHeaderText, width: 80, paddingLeft: 4 }}>Keterangan</Text>
          </View>

          {/* Table Rows */}
          {tableRows.map((row, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.colNo}>{row.no}</Text>
              <Text style={styles.colService}>{row.service}</Text>
              <Text style={styles.colHarga}>{row.harga > 0 ? formatRupiah(row.harga) : ''}</Text>
              <Text style={styles.colKeterangan}>{row.keterangan}</Text>
            </View>
          ))}
        </View>

        {/* RINGKASAN BIAYA */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{formatRupiah(service.total_fee)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>DP</Text>
              <Text style={styles.summaryValue}>{formatRupiah(service.dp_amount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sisa</Text>
              <Text style={styles.summaryValue}>{formatRupiah(service.total_fee - service.dp_amount)}</Text>
            </View>
          </View>
        </View>

        {/* KELENGKAPAN */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kelengkapan :</Text>
          <Text style={styles.infoValue}>{service.kelengkapan || '-'}</Text>
        </View>

        {/* GARANSI */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Garansi Service / Upgrade :</Text>
          <Text style={styles.infoValue}>
            {garansiText ? `${garansiText}${garansiEndDate ? ` (berlaku s/d ${garansiEndDate})` : ''}` : 'Tanpa Garansi'}
          </Text>
        </View>

        {/* SYARAT & KETENTUAN */}
        <View style={styles.syaratContainer}>
          <Text style={styles.syaratTitle}>Syarat & Ketentuan :</Text>
          <Text style={styles.syaratText}>
            1. Jika barang service tidak diambil dalam kurun waktu 1 bulan, kehilangan atau kerusakan kembali bukan tanggung jawab kami.
          </Text>
          <Text style={styles.syaratText}>
            2. Garansi tidak berlaku jika segel rusak, Human Error, Barang tertukar.
          </Text>
        </View>

        {/* TANDA TANGAN */}
        <View style={styles.ttdContainer}>
          <View style={styles.ttdBox}>
            <Text style={styles.ttdLabel}>Customer</Text>
            <View style={styles.ttdLine} />
          </View>
          <View style={styles.ttdBox}>
            <Text style={styles.ttdLabel}>Hormat Kami</Text>
            <View style={styles.ttdLine} />
          </View>
        </View>
      </Page>
    </Document>
  )
}
