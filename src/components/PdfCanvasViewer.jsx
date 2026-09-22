import { useEffect, useRef, useState } from 'react'

// Loaded lazily (not at module scope) so the ~650KB pdf.js bundle is only
// fetched once a PDF actually needs to be shown, keeping first paint of the
// phone-verification screen fast.
let pdfjsLibPromise
export function loadPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjsLib, workerModule]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default
      return pdfjsLib
    })
  }
  return pdfjsLibPromise
}

const ChevronLeft = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)
const ChevronRight = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)

/**
 * Renders a PDF to <canvas> using pdf.js instead of relying on the browser's
 * native PDF plugin. WhatsApp's in-app WebView (and many mobile in-app browsers)
 * either can't render <iframe src="*.pdf"> at all or do so unreliably/slowly —
 * canvas rendering works the same everywhere since it's just JS + Canvas2D.
 */
export default function PdfCanvasViewer({ url, className = '' }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const pdfRef = useRef(null)
  const renderTaskRef = useRef(null)

  const [status, setStatus] = useState('loading') // loading | ready | error
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    loadPdfjs()
      .then((pdfjsLib) => pdfjsLib.getDocument({ url }).promise)
      .then((pdf) => {
        if (cancelled) {
          pdf.destroy()
          return
        }
        pdfRef.current = pdf
        setNumPages(pdf.numPages)
        setPageNum(1)
        setStatus('ready')
      })
      .catch((error) => {
        console.error('[pdf] Failed to load document:', error)
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      pdfRef.current?.destroy()
    }
  }, [url])

  useEffect(() => {
    if (status !== 'ready' || !pdfRef.current) return
    let cancelled = false

    const render = async () => {
      const page = await pdfRef.current.getPage(pageNum)
      if (cancelled) return

      const container = containerRef.current
      const canvas = canvasRef.current
      if (!container || !canvas) return

      const unscaledWidth = page.getViewport({ scale: 1 }).width
      const scale = Math.max((container.clientWidth || 320) / unscaledWidth, 0.1)
      const viewport = page.getViewport({ scale })
      const outputScale = window.devicePixelRatio || 1

      canvas.width = Math.floor(viewport.width * outputScale)
      canvas.height = Math.floor(viewport.height * outputScale)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`

      const ctx = canvas.getContext('2d')
      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined

      renderTaskRef.current?.cancel()
      const task = page.render({ canvasContext: ctx, viewport, transform })
      renderTaskRef.current = task
      try {
        await task.promise
      } catch (error) {
        if (error?.name !== 'RenderingCancelledException') {
          console.error('[pdf] Failed to render page:', error)
        }
      }
    }

    render()
    return () => {
      cancelled = true
      renderTaskRef.current?.cancel()
    }
  }, [status, pageNum])

  if (status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
        <p className="text-sm font-medium">Couldn't preview the document here.</p>
        <p className="text-xs text-slate-400">Use the Download button below to save and view it instead.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={containerRef} className="relative flex-1 overflow-auto bg-slate-100">
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
            <p className="text-sm">Loading document…</p>
          </div>
        )}
        <div className="flex justify-center py-4">
          <canvas ref={canvasRef} className={`rounded-md shadow-sm ${status === 'ready' ? 'opacity-100' : 'opacity-0'} ${className}`} />
        </div>
      </div>

      {status === 'ready' && numPages > 1 && (
        <div className="flex items-center justify-center gap-4 border-t border-slate-200 bg-white py-2">
          <button
            type="button"
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            disabled={pageNum <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-medium text-slate-500">
            Page {pageNum} of {numPages}
          </span>
          <button
            type="button"
            onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
            disabled={pageNum >= numPages}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
