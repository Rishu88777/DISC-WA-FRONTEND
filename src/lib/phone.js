// Handles the messy real-world shapes a WhatsApp CTA link's phone param can arrive in:
//  - Plain digits, optionally with +91 / 91 / 0 / 0091 prefixes, spaces, dashes or brackets
//  - Values that decode to the number repeated ("918877709208918877709208") — last 10 digits win
//  - Base64 / base64url encoded (with or without "=" padding), e.g. "OTE4ODc3NzA5MjA4"
//  - Base64 whose "+" got turned into a space by the query-string parser
//  - Double-encoded (base64 of base64) or URL-encoded (%2B91…, even %252B91…) values
//  - Base64 of a small payload such as "phone=9188…" or {"phone":"9188…"}
//  - A literal, unsubstituted WhatsApp template placeholder glued onto the value,
//    e.g. "{{1}}918877709208" (seen when the template variable didn't get filled in)

import { config } from '../config'

const TEMPLATE_PLACEHOLDER_RE = /\{\{\s*[\w.]*\s*\}\}/g
const PLAIN_PHONE_RE = /^\+?[\d\s\-().]+$/
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/
// No upper limit on purpose: only the last 10 digits are ever used, so values
// like base64("918877709208918877709208") (number repeated) still resolve.
const MIN_DIGITS = 10
const MAX_DEPTH = 3

function extractDigits(value) {
  return (String(value).match(/\d+/g) || []).join('')
}

function isPhoneLength(digits) {
  return digits.length >= MIN_DIGITS
}

function safeDecodeURIComponent(value) {
  let current = value
  // Undo up to a few layers of percent-encoding (links get re-encoded by
  // redirectors / link shorteners surprisingly often).
  for (let i = 0; i < 3 && /%[0-9a-f]{2}/i.test(current); i++) {
    try {
      current = decodeURIComponent(current)
    } catch {
      break
    }
  }
  return current
}

function isPrintableText(text) {
  // Reject binary garbage — what you get when base64-decoding something that
  // was never base64 in the first place (e.g. a plain "wa918877709208").
  return text.length > 0 && /^[\x20-\x7e -￿\t\r\n]+$/.test(text)
}

function base64Decode(value) {
  // Query-string parsing turns "+" into " ", so put them back first.
  const normalized = value.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '')
  if (!normalized || !BASE64_RE.test(normalized) || normalized.length % 4 === 1) return null
  try {
    const binary = atob(normalized + '='.repeat((4 - (normalized.length % 4)) % 4))
    let text = binary
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(
        Uint8Array.from(binary, (c) => c.charCodeAt(0)),
      )
    } catch {
      // Not valid UTF-8 — fall back to the raw latin-1 string.
    }
    return isPrintableText(text) ? text.trim() : null
  } catch {
    return null
  }
}

const phoneKeys = () => new Set(config.phoneParamNames.map((n) => n.toLowerCase()))

function findInObject(obj, depth) {
  if (!obj || typeof obj !== 'object') return ''
  const keys = phoneKeys()
  for (const [key, value] of Object.entries(obj)) {
    if (keys.has(key.toLowerCase()) && (typeof value === 'string' || typeof value === 'number')) {
      const found = extractPhone(String(value), depth + 1)
      if (found) return found
    }
  }
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      const found = findInObject(value, depth)
      if (found) return found
    }
  }
  return ''
}

/** Looks inside decoded payloads shaped like JSON or "phone=…&name=…". */
function findInStructured(text, depth) {
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      return findInObject(JSON.parse(text), depth)
    } catch {
      // Not JSON.
    }
  }
  if (/[\w]=[^=]/.test(text)) {
    const params = new URLSearchParams(text.replace(/^[?#]/, ''))
    const keys = phoneKeys()
    for (const [key, value] of params) {
      if (keys.has(key.toLowerCase())) {
        const found = extractPhone(value, depth + 1)
        if (found) return found
      }
    }
  }
  return ''
}

/**
 * Pulls a phone digit string out of an arbitrary value, trying (in order):
 * plain digits → structured payload → base64 (recursively) → a digit run.
 * Returns '' when nothing phone-shaped is found.
 */
export function extractPhone(raw, depth = 0) {
  if (raw == null || depth > MAX_DEPTH) return ''
  const cleaned = safeDecodeURIComponent(String(raw))
    .replace(TEMPLATE_PLACEHOLDER_RE, '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
  if (!cleaned) return ''

  if (PLAIN_PHONE_RE.test(cleaned)) {
    const digits = extractDigits(cleaned)
    if (isPhoneLength(digits)) return digits
  }

  const structured = findInStructured(cleaned, depth)
  if (structured) return structured

  const decoded = base64Decode(cleaned)
  if (decoded && decoded !== cleaned) {
    const fromDecoded = extractPhone(decoded, depth + 1)
    if (fromDecoded) return fromDecoded
  }

  // Last resort: a phone-looking digit run inside other text, e.g. "wa:918877709208".
  for (const run of cleaned.match(/\+?\d[\d\s-]{8,}\d/g) || []) {
    const digits = extractDigits(run)
    if (isPhoneLength(digits)) return digits
  }
  return ''
}

/**
 * Cleans a raw `phone` query param value down to a plain digit string.
 * Kept for backwards compatibility — see extractPhone for the actual logic.
 */
export function decodeRawPhoneParam(raw) {
  return extractPhone(raw)
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

/** "+91 ••••• •••08" — enough for the recipient to recognise, not enough to leak. */
export function maskPhone(value) {
  const core = corePhoneDigits(value)
  if (core.length !== 10) return ''
  return `+91 ••••• •••${core.slice(-2)}`
}

/**
 * Keeps the verification input to digits only, max 10.
 * Typing past 10 digits is ignored; a pasted longer value (e.g. "+91 98765 43210")
 * keeps its last 10 digits so the country code is dropped rather than the end.
 */
export function sanitizePhoneInput(next, prev = '') {
  const digits = String(next).replace(/\D/g, '')
  if (digits.length <= 10) return digits
  return digits.length - prev.length > 1 ? digits.slice(-10) : prev
}
