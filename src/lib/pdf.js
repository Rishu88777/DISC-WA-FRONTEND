// Loaded lazily (not at module scope) so the ~650KB pdf.js bundle is only
// fetched once a PDF actually needs to be shown, keeping first paint of the
// phone-verification screen fast.
//
// We use the *legacy* build on purpose: the modern build relies on very new JS
// APIs (e.g. Map.prototype.getOrInsertComputed) that older Android System
// WebViews — which WhatsApp's in-app browser runs on — don't have yet, and the
// preview silently fails there. The legacy build ships polyfills for them.
let pdfjsLibPromise
export function loadPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjsLib, workerModule]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default
      return pdfjsLib
    })
  }
  return pdfjsLibPromise
}

// One shared, cached document per URL so the card thumbnail and the full
// viewer don't each download and parse the same file.
const documents = new Map()
export function loadPdfDocument(url) {
  if (!documents.has(url)) {
    const promise = loadPdfjs()
      .then((pdfjsLib) => pdfjsLib.getDocument({ url }).promise)
      .catch((error) => {
        documents.delete(url)
        throw error
      })
    documents.set(url, promise)
  }
  return documents.get(url)
}

export function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
