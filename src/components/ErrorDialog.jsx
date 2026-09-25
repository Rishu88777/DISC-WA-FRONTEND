import { useEffect } from 'react'
import { AlertIcon } from './Icons'

export default function ErrorDialog({ open, title, message, onClose, actionLabel = 'Try Again' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-950/60 p-6 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="error-dialog-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl ring-1 ring-black/5"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
          <AlertIcon className="h-7 w-7" />
        </div>
        <h2 id="error-dialog-title" className="text-lg font-bold text-brand-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-6 w-full rounded-2xl bg-brand-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-brand-800 active:scale-[0.99]"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
