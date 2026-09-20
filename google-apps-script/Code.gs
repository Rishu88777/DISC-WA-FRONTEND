/**
 * WhatsApp CTA -> Google Sheets tracking backend.
 *
 * Setup:
 * 1. Create (or open) the Google Sheet you want to use for tracking.
 * 2. Extensions > Apps Script, delete any starter code, and paste this whole file in.
 * 3. Update SHEET_NAME below if you want a different tab name (it will be created
 *    automatically on first run if it doesn't exist).
 * 4. Deploy > New deployment > type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the Web App URL (ends in /exec) into the frontend's .env.local as
 *    VITE_TRACKING_API_URL.
 * 6. Whenever you edit this script, redeploy (Deploy > Manage deployments > Edit > New version)
 *    for the changes to take effect on the existing URL.
 */

const SHEET_NAME = 'Tracking'

function doGet(e) {
  const params = (e && e.parameter) || {}
  const action = params.action
  const phone = params.phone ? String(params.phone).trim() : ''

  if (!phone || (action !== 'open' && action !== 'download')) {
    return jsonResponse({ success: false, error: 'Missing or invalid "phone"/"action" parameter.' })
  }

  const sheet = getOrCreateSheet()
  const rowIndex = findRowByPhone(sheet, phone)
  const now = new Date()

  if (action === 'open') {
    if (rowIndex === -1) {
      sheet.appendRow([phone, 'Opened', now, ''])
    } else {
      const statusCell = sheet.getRange(rowIndex, 2)
      if (statusCell.getValue() !== 'Downloaded') {
        statusCell.setValue('Opened')
      }
      const openedAtCell = sheet.getRange(rowIndex, 3)
      if (!openedAtCell.getValue()) {
        openedAtCell.setValue(now)
      }
    }
  } else if (action === 'download') {
    if (rowIndex === -1) {
      sheet.appendRow([phone, 'Downloaded', now, now])
    } else {
      sheet.getRange(rowIndex, 2).setValue('Downloaded')
      sheet.getRange(rowIndex, 4).setValue(now)
    }
  }

  return jsonResponse({ success: true })
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.appendRow(['Phone Number', 'Status', 'Opened At', 'Downloaded At'])
    sheet.setFrozenRows(1)
    sheet.autoResizeColumns(1, 4)
  }
  return sheet
}

function findRowByPhone(sheet, phone) {
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return -1
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === phone) {
      return i + 2 // +2: 1-indexed sheet rows, offset by the header row
    }
  }
  return -1
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
