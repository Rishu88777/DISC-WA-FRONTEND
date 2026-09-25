import { useEffect } from 'react'
import { CheckIcon } from './Icons'

export default function Toast({ message, onDone, duration = 3500 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDone, duration)
    return () => clearTimeout(timer)
  }, [message, onDone, duration])

  if (!message) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] sm:top-auto sm:bottom-6 flex justify-center px-4" role="status" aria-live="polite">
      <div className="animate-fade-up flex items-center gap-3 rounded-2xl bg-brand-950 px-4 py-3 text-sm font-medium text-white shadow-2xl shadow-brand-950/30">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
        {message}
      </div>
    </div>
  )
}
