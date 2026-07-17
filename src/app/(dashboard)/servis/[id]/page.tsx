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

  useEffect(() => {
    if (params.id) fetchService(params.id as string)
  }, [params.id])

  async function fetchService(id: string) {
    try {
      const { data, error } = await supabase.from('services').select('*').eq('id', id).single()
      if (error) throw error
      setService(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markSelesai() {
    if (!service) return
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: 'selesai', date_out: new Date().toISOString() })
        .eq('id', service.id)
      if (error) throw error
      fetchService(service.id)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setUpdating(false)
    }
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!service) {
    return (
      <div style={{ padding:48, textAlign:'center' }}>
        <p style={{ color:'var(--mute)' }}>Data servis tidak ditemukan</p>
        <Link href="/servis" style={{ marginTop:16, display:'inline-block', fontSize:14, color:'var(--primary)', textDecoration:'none' }}>
          Kembali ke daftar servis
        </Link>
      </div>
    )
  }

  const statusClass = service.status === 'selesai' ? 'badge-success' : service.status === 'proses' ? 'badge-warning' : 'badge-danger'

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:24, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => router.back()} style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          width:36, height:36, borderRadius:4, background:'transparent',
          border:'1px solid var(--hairline)', cursor:'pointer', color:'var(--mute)',
        }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize:24, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.48px', marginBottom:2 }}>
            Detail Servis {service.nota_number}
          </h1>
          <p style={{ fontSize:13, fontWeight:300, color:'var(--mute)' }}>Detail transaksi servis pelanggan</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:24 }}>
        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Customer Info */}
          <div className="card" style={{ padding:24 }}>
            <h2 style={{ fontSize:14, fontWeight:500, color:'var(--ink)', marginBottom:16 }}>Informasi Customer</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <p style={{ fontSize:12, fontWeight:300, color:'var(--mute)', marginBottom:2 }}>Nama</p>
                <p style={{ fontSize:14, fontWeight:400, color:'var(--ink)' }}>{service.customer_name}</p>
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:300, color:'var(--mute)', marginBottom:2 }}>No. WhatsApp</p>
                <p style={{ fontSize:14, fontWeight:400, color:'var(--ink)' }}>{service.customer_phone}</p>
              </div>
            </div>
          </div>

          {/* Device Info */}
          <div className="card" style={{ padding:24 }}>
            <h2 style={{ fontSize:14, fontWeight:500, color:'var(--ink)', marginBottom:16 }}>Informasi Perangkat</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <p style={{ fontSize:12, fontWeight:300, color:'var(--mute)', marginBottom:2 }}>Jenis</p>
                <p style={{ fontSize:14, fontWeight:400, color:'var(--ink)' }}>{service.device_type}</p>
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:300, color:'var(--mute)', marginBottom:2 }}>Merk</p>
                <p style={{ fontSize:14, fontWeight:400, color:'var(--ink)' }}>{service.device_brand || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:300, color:'var(--mute)', marginBottom:2 }}>Model</p>
                <p style={{ fontSize:14, fontWeight:400, color:'var(--ink)' }}>{service.device_model || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:300, color:'var(--mute)', marginBottom:2 }}>Keluhan</p>
                <p style={{ fontSize:14, fontWeight:400, color:'var(--ink)' }}>{service.complaint || '-'}</p>
              </div>
            </div>
          </div>

          {service.notes && (
            <div className="card" style={{ padding:24 }}>
              <h2 style={{ fontSize:14, fontWeight:500, color:'var(--ink)', marginBottom:8 }}>Catatan</h2>
              <p style={{ fontSize:14, fontWeight:300, color:'var(--charcoal)' }}>{service.notes}</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Status & Cost */}
          <div className="card" style={{ padding:24 }}>
            <h2 style={{ fontSize:14, fontWeight:500, color:'var(--ink)', marginBottom:16 }}>Status & Biaya</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:300, color:'var(--mute)' }}>Status</span>
                <span className={`badge ${statusClass}`}>{service.status}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, fontWeight:300, color:'var(--mute)' }}>Biaya Jasa</span>
                <span style={{ fontSize:13, fontWeight:400, color:'var(--ink)' }}>{formatRupiah(service.service_fee)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, fontWeight:300, color:'var(--mute)' }}>Biaya Sparepart</span>
                <span style={{ fontSize:13, fontWeight:400, color:'var(--ink)' }}>{formatRupiah(service.parts_fee)}</span>
              </div>
              <div style={{ borderTop:'1px solid var(--hairline)', paddingTop:12, display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>Total</span>
                <span style={{ fontSize:16, fontWeight:600, color:'var(--primary)' }}>{formatRupiah(service.total_fee)}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="card" style={{ padding:24 }}>
            <h2 style={{ fontSize:14, fontWeight:500, color:'var(--ink)', marginBottom:16 }}>Tanggal</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, fontWeight:300, color:'var(--mute)' }}>Masuk</span>
                <span style={{ fontSize:13, fontWeight:400, color:'var(--ink)' }}>{new Date(service.date_in).toLocaleString('id-ID')}</span>
              </div>
              {service.date_out && (
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, fontWeight:300, color:'var(--mute)' }}>Keluar</span>
                  <span style={{ fontSize:13, fontWeight:400, color:'var(--ink)' }}>{new Date(service.date_out).toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {service.status === 'proses' && (
              <button onClick={markSelesai} disabled={updating} className="btn-primary" style={{ width:'100%', background:'#15be53' }}>
                <CheckCircle size={16} />
                {updating ? 'Memperbarui...' : 'Tandai Selesai'}
              </button>
            )}
            {service.status === 'selesai' && (
              <>
                <button className="btn-primary" style={{ width:'100%' }}>
                  <FileText size={16} />
                  Cetak Nota PDF
                </button>
                <a
                  href={`https://wa.me/${service.customer_phone.replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(service.customer_name)}%2C%20servis%20${service.nota_number}%20sudah%20selesai.%20Total%20biaya%3A%20${encodeURIComponent(formatRupiah(service.total_fee))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ width:'100%', background:'#15be53', textDecoration:'none' }}
                >
                  <Send size={16} />
                  Kirim ke WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
