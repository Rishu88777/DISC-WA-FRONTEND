import { config } from '../config'
import { extractPhone, toCanonicalPhone } from './phone'

function buildUrl(action, phone) {
  const url = new URL(config.trackingApiUrl)
  url.searchParams.set('action', action)
  url.searchParams.set('phone', phone)
  url.searchParams.set('t', Date.now().toString())
  return url.toString()
}

/**
 * Fires a best-effort tracking beacon to the Google Apps Script Web App.
 *
 * Prefers `navigator.sendBeacon`: it queues the request with the browser itself,
 * so it still reaches the server even if this call happens right before the page
 * navigates away (e.g. WhatsApp's in-app WebView handing the download off to the
 * system browser). Falls back to a fire-and-forget fetch where sendBeacon isn't
 * available. Either way we use `no-cors`/beacon semantics on purpose: Apps Script
 * doesn't reliably return CORS headers and we don't need to read the response.
 */
function sendBeacon(action, phone) {
  if (!config.trackingApiUrl) {
    console.warn(
      `[tracking] VITE_TRACKING_API_URL is not set — skipping "${action}" event for ${phone}.`,
    )
    return
  }

  if (!phone) {
    console.warn(`[tracking] No phone number found in the URL — skipping "${action}" event.`)
    return
  }

  const url = buildUrl(action, phone)

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const queued = navigator.sendBeacon(url)
    if (queued) return
  }

  fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store', keepalive: true }).catch(
    (error) => console.error(`[tracking] Failed to send "${action}" event:`, error),
  )
}

export function trackOpened(phone) {
  sendBeacon('open', phone)
}

export function trackDownloaded(phone) {
  sendBeacon('download', phone)
}

// Params that are never the phone number — ad-click IDs etc. are long random
// strings that could otherwise be mis-read by the fallback scan below.
const IGNORED_PARAM_RE = /^(utm_.*|fbclid|gclid|gbraid|wbraid|ctwa_clid|msclkid|igshid|ref_src|t|v|lang)$/i

function parseParams(source) {
  const trimmed = (source || '').replace(/^[?#/]+/, '')
  return trimmed ? [...new URLSearchParams(trimmed)] : []
}

/**
 * Reads the recipient's phone number from the current URL and returns it in the
 * canonical "91XXXXXXXXXX" form (or null if none could be found).
 *
 * Accepts plain or base64/base64url values (see lib/phone.js), and looks in, in order:
 *  1. Known param names in the query string or hash — ?phone=…, ?Mobile=…, #phone=…
 *  2. Any other query/hash param value or bare key — ?data=<base64>, ?OTE4ODc3…
 *  3. The last path segment — /918877709208 or /OTE4ODc3NzA5MjA4
 */
export function getPhoneFromUrl() {
  const { search, hash, pathname } = window.location
  const params = [...parseParams(search), ...parseParams(hash)]
  const knownNames = new Set(config.phoneParamNames.map((n) => n.toLowerCase()))
  const toResult = (raw) => toCanonicalPhone(extractPhone(raw)) || null

  for (const [key, value] of params) {
    if (!knownNames.has(key.toLowerCase())) continue
    const phone = toResult(value)
    if (phone) return phone
  }

  for (const [key, value] of params) {
    if (knownNames.has(key.toLowerCase()) || IGNORED_PARAM_RE.test(key)) continue
    const phone = toResult(value) || (value === '' ? toResult(key) : null)
    if (phone) return phone
  }

  // A bare base64 query like "?OTE4ODc3NzA5MjA4==" parses into a key ending in "=".
  const bareQuery = search.replace(/^\?/, '')
  if (bareQuery && !bareQuery.includes('&')) {
    const phone = toResult(bareQuery)
    if (phone) return phone
  }

  const lastSegment = pathname.split('/').filter(Boolean).pop()
  if (lastSegment && !lastSegment.includes('.')) {
    const phone = toResult(lastSegment)
    if (phone) return phone
  }

  return null
}
