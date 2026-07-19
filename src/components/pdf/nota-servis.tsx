import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Service } from '@/lib/supabase'

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
  notaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  notaNumber: {
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#666666',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 10,
    flex: 1,
  },
  tableCellRight: {
    fontSize: 10,
    textAlign: 'right',
    fontFamily: 'Courier',
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
  statusBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    overflow: 'hidden',
    alignSelf: 'flex-start',
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

function formatDate(d: string | null): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
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
  storeName = 'Kasir POS',
  storeAddress = 'Jl. Contoh No. 123, Kota',
  storePhone = '0812-3456-7890',
}: NotaServisProps) {
  const statusColor: Record<string, string> = {
    proses: '#f59e0b',
    selesai: '#10b981',
    dibatalkan: '#ef4444',
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
            <Text style={styles.notaTitle}>NOTA SERVIS</Text>
            <Text style={styles.notaNumber}>{service.nota_number}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Text style={{
            ...styles.statusBadge,
            backgroundColor: statusColor[service.status] + '20',
            color: statusColor[service.status],
          }}>
            {service.status.toUpperCase()}
          </Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Customer</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nama</Text>
            <Text style={styles.value}>: {service.customer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>No. WhatsApp</Text>
            <Text style={styles.value}>: {service.customer_phone}</Text>
          </View>
        </View>

        {/* Device Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Perangkat</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Jenis</Text>
            <Text style={styles.value}>: {service.device_type}</Text>
          </View>
          {service.device_brand && (
            <View style={styles.row}>
              <Text style={styles.label}>Merk / Model</Text>
              <Text style={styles.value}>: {service.device_brand} {service.device_model}</Text>
            </View>
          )}
          {service.kelengkapan && (
            <View style={styles.row}>
              <Text style={styles.label}>Kelengkapan</Text>
              <Text style={styles.value}>: {service.kelengkapan}</Text>
            </View>
          )}
          {service.complaint && (
            <View style={styles.row}>
              <Text style={styles.label}>Keluhan</Text>
              <Text style={styles.value}>: {service.complaint}</Text>
            </View>
          )}
        </View>

        {/* Sparepart Table */}
        {parts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sparepart yang Dipakai</Text>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableHeaderText, flex: 2 }}>Barang</Text>
              <Text style={{ ...styles.tableHeaderText, flex: 1, textAlign: 'center' }}>Qty</Text>
              <Text style={{ ...styles.tableHeaderText, flex: 1, textAlign: 'right' }}>Harga</Text>
            </View>
            {parts.map((part, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={{ ...styles.tableCell, flex: 2 }}>{part.name}</Text>
                <Text style={{ ...styles.tableCell, flex: 1, textAlign: 'center' }}>{part.quantity}x</Text>
                <Text style={{ ...styles.tableCellRight, flex: 1 }}>{formatRupiah(part.price)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Biaya Jasa</Text>
            <Text style={styles.summaryValue}>{formatRupiah(service.service_fee)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Biaya Sparepart</Text>
            <Text style={styles.summaryValue}>{formatRupiah(service.parts_fee)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>{formatRupiah(service.total_fee)}</Text>
          </View>
          {service.dp_amount > 0 && (
            <>
              <View style={{ ...styles.summaryRow, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e0e0e0' }}>
                <Text style={{ ...styles.summaryLabel, color: '#10b981' }}>DP / Uang Muka</Text>
                <Text style={{ ...styles.summaryValue, color: '#10b981' }}>- {formatRupiah(service.dp_amount)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>SISA PEMBAYARAN</Text>
                <Text style={styles.totalValue}>{formatRupiah(service.total_fee - service.dp_amount)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Dates */}
        <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 8, color: '#999' }}>Tanggal Masuk</Text>
            <Text style={{ fontSize: 9 }}>{formatDateTime(service.date_in)}</Text>
          </View>
          {service.date_out && (
            <View>
              <Text style={{ fontSize: 8, color: '#999', textAlign: 'right' }}>Tanggal Selesai</Text>
              <Text style={{ fontSize: 9, textAlign: 'right' }}>{formatDate(service.date_out)}</Text>
            </View>
          )}
        </View>

        {/* Garansi */}
        {service.garansi && service.garansi.toLowerCase() !== 'tanpa garansi' && (
          <View style={{ marginTop: 12, padding: 8, backgroundColor: '#f0fdf4', borderRadius: 3, borderWidth: 1, borderColor: '#bbf7d0' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', color: '#15803d' }}>
              Garansi: {service.garansi}
            </Text>
            {service.warranty_end_date && (
              <Text style={{ fontSize: 8, color: '#166534', marginTop: 2 }}>
                Berlaku hingga: {formatDate(service.warranty_end_date)}
              </Text>
            )}
          </View>
        )}

        {/* Notes */}
        {service.notes && (
          <View style={{ marginTop: 12, padding: 8, backgroundColor: '#f8f8f8', borderRadius: 3 }}>
            <Text style={{ fontSize: 8, color: '#999', marginBottom: 2 }}>Catatan:</Text>
            <Text style={{ fontSize: 9 }}>{service.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Terima kasih atas kepercayaan Anda</Text>
          <Text style={styles.footerText}>Dokumen ini dicetak secara otomatis oleh sistem</Text>
        </View>
      </Page>
    </Document>
  )
}
