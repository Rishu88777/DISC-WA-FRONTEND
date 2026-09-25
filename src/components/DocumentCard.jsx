import { useState } from 'react'
import { formatBytes } from '../lib/pdf'
import { maskPhone } from '../lib/phone'
import PdfThumbnail from './PdfThumbnail'
import { CheckIcon, DownloadIcon, EyeIcon, ShieldIcon } from './Icons'

export default function DocumentCard({ pdfUrl, fileName, title, subtitle, phone, downloaded, onView, onDownload }) {
  const [meta, setMeta] = useState(null)
  const masked = maskPhone(phone)
  const details = [
    'PDF',
    meta?.numPages && `${meta.numPages} ${meta.numPages === 1 ? 'page' : 'pages'}`,
    meta?.size && formatBytes(meta.size),
  ].filter(Boolean)

  return (
    <div className="animate-fade-in">
      <button
        type="button"
        onClick={onView}
        className="hero-panel group relative block w-full overflow-hidden rounded-2xl p-4 text-left ring-1 ring-brand-900/10 sm:p-5"
        aria-label={`Preview ${title}`}
      >
        <div className="overflow-hidden rounded-lg shadow-2xl shadow-black/30 ring-1 ring-white/20 transition duration-500 group-hover:scale-[1.015]">
          <PdfThumbnail url={pdfUrl} onLoad={setMeta} className="aspect-[3/2]" />
        </div>
        <span className="absolute right-6 bottom-6 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-brand-900 shadow-lg backdrop-blur transition group-hover:bg-white sm:right-7 sm:bottom-7">
          <EyeIcon className="h-3.5 w-3.5" />
          Tap to preview
        </span>
      </button>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-brand-950 sm:text-xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="max-w-full truncate rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-600">
          {fileName}
        </span>
        {details.map((d) => (
          <span key={d} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {d}
          </span>
        ))}
      </div>

      {masked && (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/15">
          <ShieldIcon className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Verified for <span className="font-bold">{masked}</span>
          </span>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onView}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-900 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-900/20 transition hover:shadow-xl active:scale-[0.99]"
        >
          <EyeIcon className="h-4 w-4" />
          View Document
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99]"
        >
          {downloaded ? <CheckIcon className="h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />}
          {downloaded ? 'Download Again' : 'Download PDF'}
        </button>
      </div>
    </div>
  )
}
