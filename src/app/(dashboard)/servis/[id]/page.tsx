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
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()

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
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Data servis tidak ditemukan</p>
        <Link href="/servis" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Kembali ke daftar servis
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detail Servis {service.nota_number}</h1>
          <p className="text-sm text-gray-500">Detail transaksi servis pelanggan</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Utama */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Informasi Customer</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nama</p>
                <p className="font-medium text-gray-900">{service.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-500">No. WhatsApp</p>
                <p className="font-medium text-gray-900">{service.customer_phone}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Informasi Perangkat</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Jenis</p>
                <p className="font-medium text-gray-900">{service.device_type}</p>
              </div>
              <div>
                <p className="text-gray-500">Merk</p>
                <p className="font-medium text-gray-900">{service.device_brand || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Model</p>
                <p className="font-medium text-gray-900">{service.device_model || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Keluhan</p>
                <p className="font-medium text-gray-900">{service.complaint || '-'}</p>
              </div>
            </div>
          </div>

          {service.notes && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-2 font-semibold text-gray-900">Catatan</h2>
              <p className="text-sm text-gray-700">{service.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Status & Biaya</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  service.status === 'selesai' ? 'bg-green-100 text-green-700' :
                  service.status === 'proses' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {service.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Biaya Jasa</span>
                <span className="font-medium">{formatRupiah(service.service_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Biaya Sparepart</span>
                <span className="font-medium">{formatRupiah(service.parts_fee)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium text-gray-900">Total</span>
                <span className="text-lg font-bold text-blue-600">{formatRupiah(service.total_fee)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Tanggal</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Masuk</span>
                <span className="font-medium">{new Date(service.date_in).toLocaleString('id-ID')}</span>
              </div>
              {service.date_out && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Keluar</span>
                  <span className="font-medium">{new Date(service.date_out).toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {service.status === 'proses' && (
              <button
                onClick={markSelesai}
                disabled={updating}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {updating ? 'Memperbarui...' : 'Tandai Selesai'}
              </button>
            )}
            {service.status === 'selesai' && (
              <>
                <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                  <FileText className="h-4 w-4" />
                  Cetak Nota PDF
                </button>
                <a
                  href={`https://wa.me/${service.customer_phone.replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(service.customer_name)}%2C%20servis%20${service.nota_number}%20sudah%20selesai.%20Total%20biaya%3A%20${encodeURIComponent(formatRupiah(service.total_fee))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  <Send className="h-4 w-4" />
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
