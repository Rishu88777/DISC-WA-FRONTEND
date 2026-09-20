# WhatsApp CTA → Document Landing Page

A landing page for a WhatsApp template's CTA button link. When a recipient taps
the link (which carries their phone number as a query param), this page:

1. Logs an **"Opened"** row (phone number + timestamp) to a Google Sheet.
2. Auto-opens a PDF preview in a modal.
3. On **Download**, logs the row as **"Downloaded"** (with its own timestamp).

## Project layout

```
src/
  App.jsx              Landing page (hero, view/download buttons)
  components/
    PdfModal.jsx        The PDF preview modal + download bar
  lib/
    tracking.js          Fires the Opened/Downloaded beacons
  config.js               Reads all the .env values
public/
  sample-document.pdf     Placeholder PDF — replace with your real file
google-apps-script/
  Code.gs                  Paste into Apps Script; writes to the Sheet
```

## 1. Set up the Google Sheet tracking backend

1. Create a new Google Sheet (or open the one you want to use for tracking).
2. In the Sheet: **Extensions → Apps Script**.
3. Delete the placeholder `myFunction` code and paste in the contents of
   [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize the permissions it asks for, then copy the
   **Web app URL** (it ends in `/exec`).
6. The script auto-creates a `Tracking` tab on its first request, with columns:
   `Phone Number | Status | Opened At | Downloaded At`.

Whenever you edit `Code.gs` later, you must **Deploy → Manage deployments →
Edit (pencil) → New version** for changes to apply — saving alone does not
update the live `/exec` URL.

## 2. Configure the frontend

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_TRACKING_API_URL=https://script.google.com/macros/s/XXXXX/exec   # from step 1
VITE_PDF_URL=/sample-document.pdf                                      # or an absolute URL
VITE_PDF_FILE_NAME=your-document.pdf                                    # filename on download
VITE_COMPANY_NAME=Your Company
VITE_DOCUMENT_TITLE=Your Document Title
```

Replace [`public/sample-document.pdf`](public/sample-document.pdf) with your
real PDF (keep the same filename, or update `VITE_PDF_URL` to match). If your
PDF is hosted elsewhere (S3, Drive direct-download link, etc.), just point
`VITE_PDF_URL` at that URL instead — it must allow being embedded in an
`<iframe>` and downloaded cross-origin (Google Drive "share" links don't work
well for this; use a direct file host).

## 3. Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/?phone=919876543210` — the `phone` query param
simulates what the WhatsApp CTA link will send.

## 4. Build & deploy

```bash
npm run build
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare
Pages, GitHub Pages, S3+CloudFront, etc.). Make sure the `VITE_*` env vars are
set in that host's build settings too (they're baked in at build time).

## 5. The WhatsApp CTA link

In your WhatsApp template, set the CTA button's URL to your deployed page with
the phone number appended as a query parameter, e.g.:

```
https://your-domain.com/?phone={{1}}
```

where `{{1}}` is the template variable WhatsApp fills in with the recipient's
number when the message is sent. The page also accepts `number`, `mobile`, or
`wa_number` as the param name if that's easier on your sending platform.

## How tracking works

- On page load, if a phone number is present in the URL, the page fires a
  `GET` request to your Apps Script URL with `action=open`. The script finds
  or creates that phone's row and sets `Status = Opened` (unless it's already
  `Downloaded`) and stamps `Opened At` (only if not already set — reloading
  the page won't overwrite the original open time).
- On Download click, it fires `action=download`, which sets
  `Status = Downloaded` and stamps `Downloaded At` — every time (so a repeat
  download refreshes the timestamp).
- Requests are sent with `mode: 'no-cors'` since Apps Script doesn't reliably
  return CORS headers and we don't need to read the response — we only need
  Apps Script to receive and process it. This means the frontend can't detect
  a failed write; check the Sheet or the Apps Script **Executions** log
  (in the Apps Script editor) if something looks off.
- If no phone number is present in the URL at all, tracking is skipped
  entirely (logged to the console) but the document still opens/downloads
  normally — the page shows a small notice in that case.

## Notes / things you may want to adjust

- The PDF is embedded via `<iframe src="...pdf">`, which uses the visitor's
  browser's built-in PDF viewer. This works well in desktop Chrome/Safari/Edge
  and in Android's WhatsApp in-app browser; iOS in-app browsers can sometimes
  render PDFs inconsistently — the modal includes a fallback line and the
  Download button always works regardless of whether the preview renders.
- Both the modal's Download button and the landing page's own Download
  button share the same `handleDownload` tracking call, so either path is
  logged.
