// Central place for the values that make this template reusable across campaigns.
// Hardcoded directly (no Vercel/deploy env vars needed) — edit these to change
// the tracking endpoint, PDF, or branding. A .env.local override still works
// too, if you ever want it, but isn't required.

export const config = {
  // Google Apps Script "Web App" URL that logs Opened / Downloaded events to Google Sheets.
  // See google-apps-script/Code.gs for the script and README.md for deployment steps.
  trackingApiUrl:
    import.meta.env.VITE_TRACKING_API_URL ||
    'https://script.google.com/macros/s/AKfycbzPGEmp-yDdmPJWOyRhs7XjEE0cOqU3Hjys0pfuZEiPHMxnXz0VKY9diXUf4TBNMZgQ/exec',

  // The PDF that gets previewed and downloaded. Lives in /public.
  pdfUrl: import.meta.env.VITE_PDF_URL || '/DICS_Admission_Notice.pdf',
  pdfFileName: import.meta.env.VITE_PDF_FILE_NAME || 'DICS_Admission_Notice.pdf',

  // Branding shown on the page.
  companyName: import.meta.env.VITE_COMPANY_NAME || 'DICS',
  documentTitle: import.meta.env.VITE_DOCUMENT_TITLE || 'Admission Notice',

  // Accepted query param names for the recipient's phone number, e.g. ?phone=9198xxxxxxx
  phoneParamNames: ['phone', 'number', 'mobile', 'wa_number'],
}
