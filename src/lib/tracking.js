import { config } from '../config'
import { decodeRawPhoneParam, toCanonicalPhone } from './phone'

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

/**
 * Reads the recipient's phone number from the current URL's query string,
 * decoding base64/placeholder-junk as needed, and returns it in the canonical
 * "91XXXXXXXXXX" form (or null if none could be found).
 */
export function getPhoneFromUrl() {
  const params = new URLSearchParams(window.location.search)
  for (const name of config.phoneParamNames) {
    const raw = params.get(name)
    if (!raw) continue
    const canonical = toCanonicalPhone(decodeRawPhoneParam(raw))
    if (canonical) return canonical
  }
  return null
}
