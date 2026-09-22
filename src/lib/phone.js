// Handles the messy real-world shapes a WhatsApp CTA link's phone param can arrive in:
//  - Base64 (or base64url) encoded, e.g. "OTE4ODc3NzA5MjA4"
//  - A literal, unsubstituted WhatsApp template placeholder glued onto the value,
//    e.g. "{{1}}918877709208" (seen when the template variable didn't get filled in)
//  - Plain digits, optionally with +91 / 91 / 0 prefixes, spaces or dashes

const TEMPLATE_PLACEHOLDER_RE = /\{\{\s*\d+\s*\}\}/g

function base64Decode(value) {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    return atob(padded)
  } catch {
    return null
  }
}

function extractDigits(value) {
  return (value.match(/\d+/g) || []).join('')
}

/**
 * Cleans a raw `phone` query param value down to a plain digit string.
 * Tries base64 first; falls back to reading digits straight out of the raw value
 * so older/manual links (plain digits, no encoding) keep working too.
 */
export function decodeRawPhoneParam(raw) {
  if (!raw) return ''
  const cleaned = raw.replace(TEMPLATE_PLACEHOLDER_RE, '').trim()
  if (!cleaned) return ''

  const decoded = base64Decode(cleaned)
  const decodedDigits = decoded ? extractDigits(decoded) : ''
  if (decodedDigits.length >= 8) return decodedDigits

  return extractDigits(cleaned)
}

/** The last 10 digits of a phone string — the part that's independent of the country code. */
export function corePhoneDigits(value) {
  return extractDigits(value || '').slice(-10)
}

/** Canonical "91XXXXXXXXXX" form used for tracking / Sheet storage. */
export function toCanonicalPhone(value) {
  const core = corePhoneDigits(value)
  return core.length === 10 ? `91${core}` : ''
}

/** True if two phone-ish strings refer to the same number, ignoring country code / formatting. */
export function phonesMatch(a, b) {
  const coreA = corePhoneDigits(a)
  const coreB = corePhoneDigits(b)
  return coreA.length === 10 && coreA === coreB
}
