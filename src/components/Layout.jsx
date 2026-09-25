import { config } from '../config'
import { CapIcon, GlobeIcon, MailIcon, PhoneIcon, ShieldIcon } from './Icons'

export function BrandMark({ className = 'h-11 w-11' }) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-800 to-brand-950 text-gold-400 shadow-lg shadow-brand-900/25 ring-1 ring-white/10 ${className}`}
    >
      <CapIcon className="h-[55%] w-[55%]" />
    </div>
  )
}

export function Header() {
  return (
    <header className="relative z-30 pt-[env(safe-area-inset-top)] lg:sticky lg:top-0 lg:border-b lg:border-slate-200/70 lg:bg-white/80 lg:backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark className="h-10 w-10 ring-white/20 sm:h-11 sm:w-11 max-lg:bg-white/10 max-lg:from-white/15 max-lg:to-white/5 max-lg:shadow-none" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-bold tracking-tight text-white sm:text-base lg:text-brand-950">
              {config.companyName}
            </p>
            {config.companyTagline && (
              <p className="truncate text-xs font-medium text-white/60 lg:text-slate-500">{config.companyTagline}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 max-[379px]:hidden px-2.5 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/15 lg:bg-emerald-50 lg:px-3 lg:text-xs lg:text-emerald-700 lg:ring-emerald-600/15">
          <ShieldIcon className="h-4 w-4" />
          <span className="max-sm:hidden">Secure document portal</span>
          <span className="sm:hidden">Secure</span>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  const items = [
    config.supportEmail && { icon: MailIcon, label: config.supportEmail, href: `mailto:${config.supportEmail}` },
    config.supportPhone && {
      icon: PhoneIcon,
      label: config.supportPhone,
      href: `tel:${config.supportPhone.replace(/[^\d+]/g, '')}`,
    },
    config.website && {
      icon: GlobeIcon,
      label: config.website,
      href: /^https?:\/\//.test(config.website) ? config.website : `https://${config.website}`,
    },
  ].filter(Boolean)

  return (
    <footer className="mt-auto border-t border-slate-200/70 bg-white/60 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} {config.companyName}. All rights reserved.
        </p>
        {items.length > 0 && (
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {items.map(({ icon: Icon, label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition hover:text-brand-700"
                >
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  )
}

export function Shell({ children }) {
  return (
    <div className="page-bg relative flex min-h-screen flex-col text-slate-900">
      {/* Mobile / WhatsApp WebView: a navy "app bar" band the card overlaps */}
      <div
        className="hero-panel pointer-events-none absolute inset-x-0 top-0 h-[340px] rounded-b-[36px] sm:h-[380px] lg:hidden"
        aria-hidden="true"
      />
      <div className="grid-overlay pointer-events-none absolute inset-x-0 top-0 h-[520px] max-lg:hidden" aria-hidden="true" />
      <Header />
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pt-3 pb-8 sm:px-6 sm:pt-8 sm:pb-12 lg:py-16">
        {children}
      </main>
      <Footer />
    </div>
  )
}
