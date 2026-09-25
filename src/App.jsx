import { useCallback, useEffect, useRef, useState } from 'react'
import PdfModal from './components/PdfModal'
import { loadPdfjs } from './lib/pdf'
import ErrorDialog from './components/ErrorDialog'
import DocumentCard from './components/DocumentCard'
import Stepper from './components/Stepper'
import Toast from './components/Toast'
import VerifyCard from './components/VerifyCard'
import { Shell } from './components/Layout'
import { DocumentIcon, DownloadIcon, ShieldIcon, WhatsAppIcon } from './components/Icons'
import { triggerFileDownload } from './lib/download'
import { config } from './config'
import { phonesMatch } from './lib/phone'
import { getPhoneFromUrl, trackDownloaded, trackOpened } from './lib/tracking'

const FEATURES = [
  { icon: ShieldIcon, title: 'Private & verified', text: 'Only the intended recipient can open this document.' },
  { icon: DocumentIcon, title: 'Official copy', text: 'The original PDF, issued directly by the institute.' },
  { icon: DownloadIcon, title: 'Keep it forever', text: 'Save it to your phone to share or print any time.' },
]

function Hero({ fromWhatsApp }) {
  return (
    <div className="animate-fade-up lg:pt-6">
      {fromWhatsApp && (
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-600/15">
          <WhatsAppIcon className="h-4 w-4 text-emerald-500" />
          Delivered via WhatsApp
        </div>
      )}
      <h1 className="text-3xl leading-[1.1] font-extrabold tracking-tight text-brand-950 sm:text-4xl lg:text-5xl">
        Your{' '}
        <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
          {config.documentTitle}
        </span>{' '}
        is ready
      </h1>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
        {config.documentSubtitle}, issued by {config.companyName}. View it securely below or save a copy to your
        device.
      </p>

      <ul className="mt-8 hidden gap-4 sm:grid">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-slate-200">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-brand-950">{title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function App() {
  const [urlPhone] = useState(() => getPhoneFromUrl())
  // No phone to verify against — there's nothing to gate, so start unlocked.
  const [verified, setVerified] = useState(() => urlPhone === null)
  const [enteredPhone, setEnteredPhone] = useState('')
  const [verifyError, setVerifyError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [toast, setToast] = useState('')
  const hasLoggedOpen = useRef(false)

  useEffect(() => {
    document.title = `${config.documentTitle} — ${config.companyName}`
  }, [])

  useEffect(() => {
    if (urlPhone && !hasLoggedOpen.current) {
      hasLoggedOpen.current = true
      trackOpened(urlPhone)
    }
  }, [urlPhone])

  useEffect(() => {
    if (!verified) return
    // Warm up the pdf.js chunk as soon as we're unlocked so the auto-opened
    // modal below doesn't sit on a blank loading state.
    loadPdfjs()
    const timer = setTimeout(() => setModalOpen(true), 600)
    return () => clearTimeout(timer)
  }, [verified])

  const handleVerify = (e) => {
    e.preventDefault()
    if (phonesMatch(enteredPhone, urlPhone)) {
      setVerifyError(false)
      setVerified(true)
    } else {
      setVerifyError(true)
    }
  }

  const handleDownload = () => {
    trackDownloaded(urlPhone)
    setDownloaded(true)
    setToast('Download started — check your Downloads folder')
  }

  const triggerDownload = () => {
    handleDownload()
    triggerFileDownload(config.pdfUrl, config.pdfFileName)
  }

  const closeModal = useCallback(() => setModalOpen(false), [])
  const closeError = useCallback(() => setVerifyError(false), [])
  const clearToast = useCallback(() => setToast(''), [])

  const step = !verified ? 0 : downloaded ? 3 : 1

  return (
    <Shell>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:gap-16">
        <Hero fromWhatsApp={urlPhone !== null} />

        <section className="animate-fade-up rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-2xl shadow-brand-900/10 backdrop-blur sm:p-8 [animation-delay:80ms]">
          <div className="mb-7 border-b border-slate-100 pb-6">
            <Stepper current={step} />
          </div>

          {verified ? (
            <DocumentCard
              pdfUrl={config.pdfUrl}
              fileName={config.pdfFileName}
              title={config.documentTitle}
              subtitle={config.companyName}
              phone={urlPhone}
              downloaded={downloaded}
              onView={() => setModalOpen(true)}
              onDownload={triggerDownload}
            />
          ) : (
            <VerifyCard
              value={enteredPhone}
              onChange={(v) => {
                setEnteredPhone(v)
                if (verifyError) setVerifyError(false)
              }}
              onSubmit={handleVerify}
              error={verifyError}
              hintPhone={urlPhone}
            />
          )}

          <p className="mt-7 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">
            Having trouble? Reply to the WhatsApp message and we'll help you out.
          </p>
        </section>
      </div>

      <ErrorDialog
        open={verifyError}
        title="That number doesn't match"
        message="The mobile number you entered doesn't match the recipient of this link. Please double-check and try again."
        onClose={closeError}
      />

      <PdfModal
        open={modalOpen}
        onClose={closeModal}
        pdfUrl={config.pdfUrl}
        fileName={config.pdfFileName}
        documentTitle={config.documentTitle}
        onDownload={handleDownload}
        downloaded={downloaded}
      />

      <Toast message={toast} onDone={clearToast} />
    </Shell>
  )
}

export default App
