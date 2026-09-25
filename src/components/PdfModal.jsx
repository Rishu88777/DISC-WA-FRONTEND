import { useEffect, useState } from 'react'
import PdfCanvasViewer from './PdfCanvasViewer'
import { triggerFileDownload } from '../lib/download'
import { CheckIcon, CloseIcon, DocumentIcon, DownloadIcon } from './Icons'

export default function PdfModal({ open, onClose, pdfUrl, fileName, documentTitle, onDownload, downloaded }) {
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

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

  const downloadLabel = downloading ? (
    <>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      Preparing…
    </>
  ) : downloaded ? (
    <>
      <CheckIcon className="h-4 w-4" />
      Downloaded — save again
    </>
  ) : (
    <>
      <DownloadIcon className="h-4 w-4" />
      Download PDF
    </>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${documentTitle} preview`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in flex h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:h-[90vh] sm:max-w-4xl sm:rounded-3xl"
      >
        {/* Grab handle for the mobile sheet */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <DocumentIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-brand-950 sm:text-base">{documentTitle}</p>
              <p className="truncate text-xs text-slate-500">{fileName}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="hidden items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-70 sm:flex"
            >
              {downloadLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF preview */}
        <div className="relative flex-1 overflow-hidden border-t border-slate-200">
          <PdfCanvasViewer url={pdfUrl} />
        </div>

        {/* Footer / Download bar (mobile) */}
        <div className="border-t border-slate-200 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition active:scale-[0.99] disabled:opacity-70"
          >
            {downloadLabel}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Inside WhatsApp, this may briefly open your browser to save the file.
          </p>
        </div>
      </div>
    </div>
  )
}
