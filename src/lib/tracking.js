import { config } from '../config'

/**
 * Fires a best-effort tracking beacon to the Google Apps Script Web App.
 *
 * Uses mode: 'no-cors' on purpose: Apps Script Web App responses don't reliably
 * carry CORS headers, and we don't need to read the response body — we only need
 * the request to reach the script and let it write to the Sheet. This means we
 * can't detect failures from the browser; failures should be checked from the
 * Sheet / Apps Script execution log instead.
 */
async function sendBeacon(action, phone) {
  if (!config.trackingApiUrl) {
    console.warn(
      `[tracking] VITE_TRACKING_API_URL is not set — skipping "${action}" event for ${phone}.`,
    )
    return { skipped: true }
  }

  if (!phone) {
    console.warn(`[tracking] No phone number found in the URL — skipping "${action}" event.`)
    return { skipped: true }
  }

  const url = new URL(config.trackingApiUrl)
  url.searchParams.set('action', action)
  url.searchParams.set('phone', phone)
  url.searchParams.set('t', Date.now().toString())

  try {
    await fetch(url.toString(), { method: 'GET', mode: 'no-cors', cache: 'no-store' })
    return { skipped: false }
  } catch (error) {
    console.error(`[tracking] Failed to send "${action}" event:`, error)
    return { skipped: false, error }
  }
}

export function trackOpened(phone) {
  return sendBeacon('open', phone)
}

export function trackDownloaded(phone) {
  return sendBeacon('download', phone)
}

/** Reads the recipient's phone number from the current URL's query string. */
export function getPhoneFromUrl() {
  const params = new URLSearchParams(window.location.search)
  for (const name of config.phoneParamNames) {
    const value = params.get(name)
    if (value) return value.trim()
  }
  return null
}
