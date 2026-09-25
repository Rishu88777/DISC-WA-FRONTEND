import { useEffect, useRef, useState } from 'react'
import { loadPdfDocument } from '../lib/pdf'
import { ChevronLeft, ChevronRight, FitIcon, ZoomInIcon, ZoomOutIcon } from './Icons'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

function ToolbarButton({ label, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  )
}

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
  const [zoom, setZoom] = useState(1) // relative to "fit width"
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    loadPdfDocument(url)
      .then((pdf) => {
        if (cancelled) return
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
    }
  }, [url])

  // Re-fit when the viewer is resized (rotation, desktop window resize).
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let frame
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setContainerWidth(Math.round(entry.contentRect.width)))
    })
    observer.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !pdfRef.current) return
    let cancelled = false

    const render = async () => {
      const page = await pdfRef.current.getPage(pageNum)
      if (cancelled) return

      const container = containerRef.current
      const canvas = canvasRef.current
      if (!container || !canvas) return

      const available = (containerWidth || container.clientWidth || 320) - 32 // p-4 gutter
      const unscaledWidth = page.getViewport({ scale: 1 }).width
      const scale = Math.max((Math.min(available, 1100) / unscaledWidth) * zoom, 0.1)
      const viewport = page.getViewport({ scale })
      // Cap the backing store so very high zoom levels don't exhaust memory on phones.
      const outputScale = Math.min(window.devicePixelRatio || 1, 4096 / viewport.width, 2.5)

      canvas.width = Math.floor(viewport.width * outputScale)
      canvas.height = Math.floor(viewport.height * outputScale)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

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
  }, [status, pageNum, zoom, containerWidth])

  if (status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
        <p className="text-sm font-semibold text-slate-700">Couldn't preview the document here.</p>
        <p className="text-xs text-slate-400">Use the Download button below to save and view it instead.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {status === 'ready' && (
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-2 py-1.5 backdrop-blur sm:px-4">
          <div className="flex items-center gap-0.5">
            <ToolbarButton
              label="Zoom out"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
              disabled={zoom <= MIN_ZOOM}
            >
              <ZoomOutIcon className="h-[18px] w-[18px]" />
            </ToolbarButton>
            <span className="w-12 text-center text-xs font-semibold text-slate-600 tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <ToolbarButton
              label="Zoom in"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
              disabled={zoom >= MAX_ZOOM}
            >
              <ZoomInIcon className="h-[18px] w-[18px]" />
            </ToolbarButton>
            <ToolbarButton label="Fit to width" onClick={() => setZoom(1)} disabled={zoom === 1}>
              <FitIcon className="h-[18px] w-[18px]" />
            </ToolbarButton>
          </div>

          {numPages > 1 && (
            <div className="flex items-center gap-0.5">
              <ToolbarButton
                label="Previous page"
                onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                disabled={pageNum <= 1}
              >
                <ChevronLeft className="h-5 w-5" />
              </ToolbarButton>
              <span className="min-w-16 text-center text-xs font-semibold text-slate-600 tabular-nums">
                {pageNum} / {numPages}
              </span>
              <ToolbarButton
                label="Next page"
                onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                disabled={pageNum >= numPages}
              >
                <ChevronRight className="h-5 w-5" />
              </ToolbarButton>
            </div>
          )}
        </div>
      )}

      <div ref={containerRef} className="pdf-scroll relative flex-1 overflow-auto bg-slate-200/70">
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-300 border-t-brand-600" />
            <p className="text-sm font-medium">Loading document…</p>
          </div>
        )}
        <div className="mx-auto w-max min-w-full p-4">
          <canvas
            ref={canvasRef}
            className={`mx-auto block rounded-sm bg-white shadow-xl shadow-slate-900/15 ring-1 ring-slate-900/5 transition-opacity ${status === 'ready' ? 'opacity-100' : 'opacity-0'} ${className}`}
          />
        </div>
      </div>
    </div>
  )
}
