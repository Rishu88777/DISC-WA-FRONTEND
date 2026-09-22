import { useEffect, useState } from 'react'
import PdfCanvasViewer from './PdfCanvasViewer'
import { triggerFileDownload } from '../lib/download'

const DownloadIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
)

const CloseIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export default function PdfModal({ open, onClose, pdfUrl, fileName, documentTitle, onDownload, downloaded }) {
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const handleDownload = () => {
    // Fire tracking first (sendBeacon survives the navigation below, even in a
    // WhatsApp in-app WebView that hands the actual file save off to the system
    // browser) — then trigger the actual save.
    onDownload?.()
    setDownloading(true)
    triggerFileDownload(pdfUrl, fileName)
    setTimeout(() => setDownloading(false), 900)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-6">
      <div className="animate-fade-in flex h-[92vh] sm:h-[85vh] w-full sm:max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{documentTitle}</p>
              <p className="truncate text-xs text-slate-500">{fileName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* PDF preview */}
        <div className="pdf-scroll relative flex-1 overflow-hidden bg-slate-100">
          <PdfCanvasViewer url={pdfUrl} />
        </div>

        {/* Footer / Download bar */}
        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {downloading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Opening download…
              </>
            ) : downloaded ? (
              <>
                <CheckIcon className="h-4 w-4" />
                Downloaded — Tap to save again
              </>
            ) : (
              <>
                <DownloadIcon className="h-4 w-4" />
                Download PDF
              </>
            )}
          </button>
          <p className="mt-2.5 text-center text-xs text-slate-400">
            If you're inside WhatsApp, this may briefly open your regular browser to save the file.
          </p>
        </div>
      </div>
    </div>
  )
}
