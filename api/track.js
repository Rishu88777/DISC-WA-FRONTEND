// Same-origin proxy for the Apps Script tracking beacon.
//
// The frontend used to call script.google.com directly from the browser, but
// tracker/ad blockers (Brave Shields, uBlock Origin, Firefox strict tracking
// protection) flag Apps Script /exec URLs as tracker-like and silently drop
// the request client-side — so Opened/Downloaded events never reached the
// Sheet for anyone with one of those enabled, even though the Apps Script
// side worked fine. Proxying through our own domain makes it a first-party
// request, which blockers don't touch.
const TRACKING_API_URL =
  process.env.TRACKING_API_URL ||
  'https://script.google.com/macros/s/AKfycbzPGEmp-yDdmPJWOyRhs7XjEE0cOqU3Hjys0pfuZEiPHMxnXz0VKY9diXUf4TBNMZgQ/exec'

export default async function handler(req, res) {
  const { action, phone } = req.query || {}

  if (!action || !phone) {
    res.status(400).json({ success: false, error: 'Missing "action" or "phone" parameter.' })
    return
  }

  const url = new URL(TRACKING_API_URL)
  url.searchParams.set('action', String(action))
  url.searchParams.set('phone', String(phone))

  try {
    await fetch(url.toString())
  } catch (error) {
    console.error('[api/track] Failed to reach Apps Script:', error)
  }

  res.status(204).end()
}
