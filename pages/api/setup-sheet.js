import { google } from 'googleapis'

const sheetsAuth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
const SHEET_NAME = 'Reimbursements'

async function setupSheet() {
  try {
    const sheets = google.sheets({ version: 'v4', auth: sheetsAuth })
    
    // First, check if the sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })
    
    const sheetExists = spreadsheet.data.sheets.some(
      sheet => sheet.properties.title === SHEET_NAME
    )
    
    if (!sheetExists) {
      // Create the sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: SHEET_NAME,
              },
            },
          }],
        },
      })
      
      console.log(`Created sheet: ${SHEET_NAME}`)
    }
    
    // Add headers if the sheet is empty
    const range = `${SHEET_NAME}!A1:I1`
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    })
    
    if (!response.data.values || response.data.values.length === 0) {
      // Add headers
      const headers = [
        'Timestamp',
        'Name', 
        'Email',
        'Phone',
        'Amount',
        'Description',
        'Agree to Contact',
        'Agree to Terms',
        'Receipt Files'
      ]
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: 'RAW',
        resource: {
          values: [headers],
        },
      })
      
      console.log('Added headers to sheet')
    }
    
    return {
      success: true,
      message: 'Sheet setup completed',
      sheetExists: true,
      hasHeaders: true
    }
    
  } catch (error) {
    console.error('Error setting up sheet:', error)
    return {
      success: false,
      error: error.message,
      message: 'Failed to setup sheet'
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const result = await setupSheet()
    
    res.status(result.success ? 200 : 500).json({
      timestamp: new Date().toISOString(),
      result,
      spreadsheetLink: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`,
    })

  } catch (error) {
    console.error('Setup error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to setup sheet'
    })
  }
}
