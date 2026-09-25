// Central place for the values that make this template reusable across campaigns.
// Hardcoded directly (no Vercel/deploy env vars needed) — edit these to change
// the tracking endpoint, PDF, or branding. A .env.local override still works
// too, if you ever want it, but isn't required.

const env = import.meta.env

export const config = {
  // The PDF that gets previewed and downloaded. Lives in /public.
  pdfUrl: env.VITE_PDF_URL || '/School_Report.pdf',
  pdfFileName: env.VITE_PDF_FILE_NAME || 'School_Report.pdf',

  // Branding shown on the page.
  companyName: env.VITE_COMPANY_NAME || 'ABC Learning Institute',
  companyTagline: env.VITE_COMPANY_TAGLINE || 'Learn • Build • Grow',
  documentTitle: env.VITE_DOCUMENT_TITLE || 'Result & Certificate',
  documentSubtitle:
    env.VITE_DOCUMENT_SUBTITLE || 'Your official course result and certificate of completion',

  // Contact details shown in the footer. Leave any of them empty to hide it.
  supportEmail: env.VITE_SUPPORT_EMAIL ?? 'info@abclearning.com',
  supportPhone: env.VITE_SUPPORT_PHONE ?? '+91 98765 43210',
  website: env.VITE_WEBSITE ?? 'www.abclearning.com',

  // Accepted query param names for the recipient's phone number, e.g. ?phone=9198xxxxxxx
  // Matching is case-insensitive. Values may be plain digits or base64 — see lib/phone.js.
  phoneParamNames: [
    'phone',
    'number',
    'mobile',
    'wa_number',
    'phone_number',
    'phonenumber',
    'mobile_number',
    'mobileno',
    'whatsapp',
    'wa',
    'msisdn',
    'contact',
    'ph',
    'p',
  ],
}
