/**
 * Forces an actual file save rather than navigating/opening the PDF in a tab.
 * The `download` attribute is honored by browsers for same-origin URLs even
 * though our host serves the file with `Content-Disposition: inline` — using
 * `window.open` instead would just display it, not save it.
 */
export function triggerFileDownload(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
