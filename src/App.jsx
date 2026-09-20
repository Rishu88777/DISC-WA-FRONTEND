import { useEffect, useRef, useState } from 'react'
import PdfModal from './components/PdfModal'
import { config } from './config'
import { getPhoneFromUrl, trackDownloaded, trackOpened } from './lib/tracking'

const DocumentIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6" />
    <path d="M9 17h6" />
    <path d="M9 9h1" />
  </svg>
)

const DownloadIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
)

const AlertIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
)

function App() {
  const [phone, setPhone] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const hasLoggedOpen = useRef(false)

  useEffect(() => {
    document.title = `${config.documentTitle} — ${config.companyName}`
  }, [])

  useEffect(() => {
    const detectedPhone = getPhoneFromUrl()
    setPhone(detectedPhone)

    if (detectedPhone && !hasLoggedOpen.current) {
      hasLoggedOpen.current = true
      trackOpened(detectedPhone)
    }

    // Auto-open the PDF preview shortly after load, like a WhatsApp CTA "reveal".
    const timer = setTimeout(() => setModalOpen(true), 450)
    return () => clearTimeout(timer)
  }, [])

  const handleDownload = async () => {
    await trackDownloaded(phone)
    setDownloaded(true)
  }

  const missingPhone = phone === null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-16">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <span className="text-sm font-bold">
              {config.companyName
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)}
            </span>
          </div>
          <span className="text-sm font-semibold tracking-wide text-slate-700">{config.companyName}</span>
        </div>

        {!missingPhone && (
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Delivered via WhatsApp
          </div>
        )}

        {/* Card */}
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
            <DocumentIcon className="h-8 w-8" />
          </div>

          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{config.documentTitle} is ready</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Your document has been prepared and is ready to view. It will open automatically — you can also
            download it any time using the button below.
          </p>

          {missingPhone && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3.5 text-left text-xs text-amber-800 ring-1 ring-amber-600/15">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This link is missing a recipient reference, so this open won't be recorded in the tracking
                sheet. The document will still work normally.
              </span>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
            >
              <DocumentIcon className="h-4 w-4" />
              View Document
            </button>
            <button
              type="button"
              onClick={async () => {
                await handleDownload()
                const link = document.createElement('a')
                link.href = config.pdfUrl
                link.download = config.pdfFileName
                document.body.appendChild(link)
                link.click()
                link.remove()
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
            >
              <DownloadIcon className="h-4 w-4" />
              Download PDF
            </button>
          </div>

          {downloaded && (
            <p className="mt-4 text-xs font-medium text-emerald-600">Saved to your device ✓</p>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Having trouble viewing the document? Reply to the WhatsApp message and we'll resend it.
        </p>
      </div>

      <PdfModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pdfUrl={config.pdfUrl}
        fileName={config.pdfFileName}
        documentTitle={config.documentTitle}
        onDownload={handleDownload}
        downloaded={downloaded}
      />
    </div>
  )
}

export default App
