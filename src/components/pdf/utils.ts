import { pdf } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

type PDFDocument = ReactElement<DocumentProps>

// Render PDF document dan trigger download di browser
// Compatible dengan mobile browser (Chrome, Safari, Samsung Internet)
export async function downloadPDF(document: PDFDocument, filename: string) {
  const blob = await pdf(document).toBlob()
  const url = URL.createObjectURL(blob)

  // Detect mobile browser
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  if (isMobile) {
    // Mobile: buka di tab baru, user bisa manual save dari sana
    // Beberapa mobile browser memblok programmatic download
    const newWindow = window.open(url, '_blank')
    if (!newWindow) {
      // Fallback kalau popup diblok: pakai anchor click
      const link = window.document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      window.document.body.appendChild(link)

      // Paksa trigger click dengan dispatch event
      const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      })
      link.dispatchEvent(event)

      setTimeout(() => {
        window.document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)
    } else {
      // Cleanup setelah delay
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    }
  } else {
    // Desktop: anchor click biasa
    const link = window.document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    window.document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      window.document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
  }
}

// Render PDF dan buka di tab baru (untuk preview / print)
export async function openPDF(document: PDFDocument) {
  const blob = await pdf(document).toBlob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

// Convert PDF document ke base64 (tanpa prefix data:...)
async function documentToBase64(document: PDFDocument): Promise<string> {
  const blob = await pdf(document).toBlob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      // Hapus prefix "data:application/pdf;base64,"
      const base64 = dataUrl.split(',')[1]
      if (!base64) reject(new Error('Gagal convert PDF ke base64'))
      else resolve(base64)
    }
    reader.onerror = () => reject(new Error('FileReader error'))
    reader.readAsDataURL(blob)
  })
}

// Kirim PDF + pesan via WhatsApp (Fonnte API)
export async function sendWhatsAppPDF({
  document,
  filename,
  phone,
  message,
}: {
  document: PDFDocument
  filename: string
  phone: string
  message: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const fileBase64 = await documentToBase64(document)

    const res = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message, filename, fileBase64 }),
    })

    const result = await res.json()

    if (!res.ok) {
      return { success: false, error: result.error || 'Gagal mengirim pesan' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
