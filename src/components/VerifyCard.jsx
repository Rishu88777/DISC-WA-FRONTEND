import { useEffect, useRef } from 'react'
import { corePhoneDigits, maskPhone } from '../lib/phone'
import { ArrowRight, LockIcon, ShieldIcon } from './Icons'

export default function VerifyCard({ value, onChange, onSubmit, error, hintPhone }) {
  const inputRef = useRef(null)
  const digits = corePhoneDigits(value)
  const ready = digits.length === 10
  const masked = maskPhone(hintPhone)

  useEffect(() => {
    // Don't pop the keyboard on phones before the user has read the screen.
    if (window.matchMedia?.('(min-width: 640px)').matches) inputRef.current?.focus()
  }, [])

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          <LockIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-brand-950 sm:text-xl">Confirm it's you</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Enter the mobile number this document was sent to
            {masked ? (
              <>
                {' '}
                (<span className="font-semibold whitespace-nowrap text-slate-700">{masked}</span>)
              </>
            ) : null}
            .
          </p>
        </div>
      </div>

      <label htmlFor="phone" className="mt-7 mb-2 block text-xs font-semibold tracking-wide text-slate-600 uppercase">
        Mobile number
      </label>
      <div
        className={`flex items-stretch overflow-hidden rounded-2xl border bg-white transition focus-within:ring-4 ${
          error
            ? 'animate-shake border-red-300 focus-within:border-red-400 focus-within:ring-red-100'
            : 'border-slate-300 focus-within:border-brand-500 focus-within:ring-brand-100'
        }`}
      >
        <span className="flex items-center gap-1.5 border-r border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-600 select-none">
          <span aria-hidden="true">🇮🇳</span> +91
        </span>
        <input
          ref={inputRef}
          id="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="98765 43210"
          maxLength={16}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error || undefined}
          size={1}
          className="w-0 min-w-0 flex-1 bg-transparent px-4 py-3.5 text-base font-semibold tracking-wider text-slate-900 outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-300"
        />
        <span
          className={`flex items-center pr-4 text-xs font-semibold tabular-nums ${ready ? 'text-emerald-600' : 'text-slate-300'}`}
        >
          {Math.min(digits.length, 10)}/10
        </span>
      </div>

      <button
        type="submit"
        disabled={!ready}
        className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-900 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-brand-900/25 transition hover:shadow-xl hover:shadow-brand-900/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
      >
        Verify &amp; View Document
        <ArrowRight className="h-4 w-4 transition-transform group-enabled:group-hover:translate-x-0.5" />
      </button>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <ShieldIcon className="h-3.5 w-3.5" />
        Your number is only used to confirm access to this document.
      </p>
    </form>
  )
}
