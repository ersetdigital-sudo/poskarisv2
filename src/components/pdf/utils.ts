import { pdf } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

type PDFDocument = ReactElement<DocumentProps>

// Render PDF document dan trigger download di browser
export async function downloadPDF(document: PDFDocument, filename: string) {
  const blob = await pdf(document).toBlob()
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = filename
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Render PDF dan buka di tab baru (untuk preview / print)
export async function openPDF(document: PDFDocument) {
  const blob = await pdf(document).toBlob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
