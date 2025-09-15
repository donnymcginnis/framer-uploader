import { google } from 'googleapis'

// Google Service Account credentials
const credentials = {
  type: 'service_account',
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
}

async function testSheetsAPI() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Test reading the sheet to verify access
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    })

    return {
      success: true,
      sheetTitle: response.data.properties.title,
      sheetId: response.data.spreadsheetId,
      message: 'Google Sheets API connection successful'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      message: 'Google Sheets API connection failed'
    }
  }
}

async function testDriveAPI() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })

    // Test accessing the drive folder
    const response = await drive.files.get({
      fileId: process.env.GOOGLE_DRIVE_FOLDER_ID,
      fields: 'id,name,mimeType'
    })

    return {
      success: true,
      folderName: response.data.name,
      folderId: response.data.id,
      message: 'Google Drive API connection successful'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      message: 'Google Drive API connection failed'
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Testing API connections...')
    
    // Test both APIs
    const [sheetsResult, driveResult] = await Promise.all([
      testSheetsAPI(),
      testDriveAPI()
    ])

    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        projectId: process.env.GOOGLE_PROJECT_ID,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        sheetsId: process.env.GOOGLE_SHEETS_ID,
        driveFolder: process.env.GOOGLE_DRIVE_FOLDER_ID
      },
      tests: {
        sheets: sheetsResult,
        drive: driveResult
      },
      overall: {
        success: sheetsResult.success && driveResult.success,
        message: sheetsResult.success && driveResult.success 
          ? 'All API connections successful' 
          : 'Some API connections failed'
      }
    }

    console.log('API Test Results:', JSON.stringify(results, null, 2))

    res.status(200).json(results)

  } catch (error) {
    console.error('API test error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to test API connections'
    })
  }
}
