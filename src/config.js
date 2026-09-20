// Central place for the values that make this template reusable across campaigns.
// All of these can be overridden via a .env.local file (see .env.example).

export const config = {
  // Google Apps Script "Web App" URL that logs Opened / Downloaded events to Google Sheets.
  // See google-apps-script/Code.gs for the script and README.md for deployment steps.
  trackingApiUrl: import.meta.env.VITE_TRACKING_API_URL || '',

  // The PDF that gets previewed and downloaded. Defaults to the sample file in /public.
  pdfUrl: import.meta.env.VITE_PDF_URL || '/sample-document.pdf',
  pdfFileName: import.meta.env.VITE_PDF_FILE_NAME || 'document.pdf',

  // Branding shown on the page.
  companyName: import.meta.env.VITE_COMPANY_NAME || 'Knowledge Culture',
  documentTitle: import.meta.env.VITE_DOCUMENT_TITLE || 'Your Document',

  // Accepted query param names for the recipient's phone number, e.g. ?phone=9198xxxxxxx
  phoneParamNames: ['phone', 'number', 'mobile', 'wa_number'],
}
