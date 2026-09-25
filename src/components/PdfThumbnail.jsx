import { useEffect, useRef, useState } from 'react'
import { loadPdfDocument } from '../lib/pdf'

/** Renders page 1 of the PDF as a crisp preview image. */
export default function PdfThumbnail({ url, onLoad, className = '' }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    let task
    loadPdfDocument(url)
      .then(async (pdf) => {
        const [page, info] = await Promise.all([pdf.getPage(1), pdf.getDownloadInfo().catch(() => ({}))])
        if (cancelled) return
        onLoad?.({ numPages: pdf.numPages, size: info.length })
        const canvas = canvasRef.current
        const width = wrapRef.current?.clientWidth || 320
        const unscaled = page.getViewport({ scale: 1 })
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const viewport = page.getViewport({ scale: (width / unscaled.width) * dpr })
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        task = page.render({ canvasContext: canvas.getContext('2d'), viewport })
        await task.promise
        if (!cancelled) setStatus('ready')
      })
      .catch((error) => {
        if (error?.name === 'RenderingCancelledException') return
        console.error('[pdf] Thumbnail failed:', error)
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [url, onLoad])

  return (
    <div ref={wrapRef} className={`relative overflow-hidden bg-white ${className}`}>
      {status !== 'ready' && (
        <div className="skeleton absolute inset-0 flex items-center justify-center">
          {status === 'error' && <span className="text-xs font-medium text-slate-400">Preview unavailable</span>}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`block h-auto w-full transition-opacity duration-500 ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
