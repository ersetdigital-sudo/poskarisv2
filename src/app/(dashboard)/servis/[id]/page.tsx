'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Service } from '@/lib/supabase'
import { ArrowLeft, FileText, Send, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ServisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => { if (params.id) fetchService(params.id as string) }, [params.id])

  async function fetchService(id: string) {
    try {
      const { data, error } = await supabase.from('services').select('*').eq('id', id).single()
      if (error) throw error
      setService(data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function markSelesai() {
    if (!service) return
    setUpdating(true)
    try {
      const { error } = await supabase.from('services').update({ status: 'selesai', date_out: new Date().toISOString() }).eq('id', service.id)
      if (error) throw error
      fetchService(service.id)
    } catch (e) { console.error(e) } finally { setUpdating(false) }
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3xl)' }}><div className="spinner" /></div>

  if (!service) {
    return (
      <div style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-ink-3)' }}>Data servis tidak ditemukan</p>
        <Link href="/servis" style={{ marginTop: 'var(--space-xs)', display: 'inline-block', fontSize: 'var(--text-body)', color: 'var(--color-accent)' }}>Kembali ke daftar servis</Link>
      </div>
    )
  }

  const statusClass = service.status === 'selesai' ? 'badge-success' : service.status === 'proses' ? 'badge-warning' : 'badge-danger'

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
        <button onClick={() => router.back()} className="btn btn-secondary btn-sm" style={{ width: 36, height: 36, padding: 0 }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-h1" style={{ fontSize: 'var(--text-h2)', marginBottom: 2 }}>Detail Servis {service.nota_number}</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>Detail transaksi servis pelanggan</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h3 className="text-h3" style={{ marginBottom: 'var(--space-sm)' }}>Informasi Customer</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginBottom: 2 }}>Nama</p>
                <p style={{ fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--color-ink)' }}>{service.customer_name}</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginBottom: 2 }}>No. WhatsApp</p>
                <p style={{ fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--color-ink)' }}>{service.customer_phone}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h3 className="text-h3" style={{ marginBottom: 'var(--space-sm)' }}>Informasi Perangkat</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginBottom: 2 }}>Jenis</p>
                <p style={{ fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--color-ink)' }}>{service.device_type}</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginBottom: 2 }}>Merk</p>
                <p style={{ fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--color-ink)' }}>{service.device_brand || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginBottom: 2 }}>Model</p>
                <p style={{ fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--color-ink)' }}>{service.device_model || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginBottom: 2 }}>Keluhan</p>
                <p style={{ fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--color-ink)' }}>{service.complaint || '-'}</p>
              </div>
            </div>
          </div>

          {service.notes && (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 className="text-h3" style={{ marginBottom: 'var(--space-2xs)' }}>Catatan</h3>
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-ink-2)' }}>{service.notes}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h3 className="text-h3" style={{ marginBottom: 'var(--space-sm)' }}>Status & Biaya</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>Status</span>
                <span className={`badge ${statusClass}`}>{service.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>Biaya Jasa</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{formatRupiah(service.service_fee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>Biaya Sparepart</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{formatRupiah(service.parts_fee)}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--space-xs)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--color-ink)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-accent)' }}>{formatRupiah(service.total_fee)}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h3 className="text-h3" style={{ marginBottom: 'var(--space-sm)' }}>Tanggal</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>Masuk</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)' }}>{new Date(service.date_in).toLocaleString('id-ID')}</span>
              </div>
              {service.date_out && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>Keluar</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)' }}>{new Date(service.date_out).toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xs)' }}>
            {service.status === 'proses' && (
              <button onClick={markSelesai} disabled={updating} className="btn btn-success" style={{ width: '100%' }}>
                <CheckCircle size={16} />
                {updating ? 'Memperbarui...' : 'Tandai Selesai'}
              </button>
            )}
            {service.status === 'selesai' && (
              <>
                <button className="btn btn-primary" style={{ width: '100%' }}><FileText size={16} /> Cetak Nota PDF</button>
                <a
                  href={`https://wa.me/${service.customer_phone.replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(service.customer_name)}%2C%20servis%20${service.nota_number}%20sudah%20selesai.%20Total%20biaya%3A%20${encodeURIComponent(formatRupiah(service.total_fee))}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-success" style={{ width: '100%', textDecoration: 'none' }}
                ><Send size={16} /> Kirim WhatsApp</a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
