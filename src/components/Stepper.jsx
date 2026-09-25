import { CheckIcon } from './Icons'

const STEPS = ['Verify', 'Preview', 'Download']

/** `current` is the index of the active step; steps before it render as done. */
export default function Stepper({ current }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                  done
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : active
                      ? 'bg-brand-700 text-white shadow-md shadow-brand-700/30 ring-4 ring-brand-100'
                      : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'
                }`}
              >
                {done ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={`text-xs font-semibold ${done ? 'text-emerald-700' : active ? 'text-brand-900' : 'text-slate-400'}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-700 ${done ? 'w-full' : 'w-0'}`}
                />
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
