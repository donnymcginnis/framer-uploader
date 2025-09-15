import { google } from 'googleapis'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

// Service account for Google Sheets
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

// OAuth client for Google Drive
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URI
)

if (process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  })
}

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
const SHEET_NAME = 'Reimbursements'

async function appendToSheet(data) {
  try {
    const sheets = google.sheets({ version: 'v4', auth: sheetsAuth })

    // Prepare the row data
    const values = [[
      new Date().toISOString(), // Timestamp
      data.name,
      data.email,
      data.phone || '',
      data.amount,
      data.description,
      data.agreeToContact,
      data.agreeToTerms,
      data.receiptFiles?.join('\n') || 'No files uploaded'
    ]]

    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:I`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values,
      },
    }

    const response = await sheets.spreadsheets.values.append(request)
    return response.data
  } catch (error) {
    console.error('Error appending to sheet:', error)
    throw error
  }
}

async function uploadToGoogleDrive(file) {
  try {
    // Get fresh access token for OAuth
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const fileMetadata = {
      name: file.originalFilename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    }

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.filepath),
    }

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
    })

    // Make the file publicly viewable
    await drive.permissions.create({
      fileId: response.data.id,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    })

    return {
      id: response.data.id,
      name: response.data.name,
      link: response.data.webViewLink,
    }
  } catch (error) {
    console.error('Error uploading to Drive:', error)
    
    // If Drive upload fails due to quota, continue without file upload
    if (error.code === 403 && error.message.includes('storage quota')) {
      console.warn('Google Drive storage quota exceeded, skipping file upload')
      return {
        id: null,
        name: file.originalFilename,
        link: 'File upload skipped - storage quota exceeded',
        error: 'Storage quota exceeded'
      }
    }
    
    throw error
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Parse the form data
    const form = formidable({
      uploadDir: './tmp',
      keepExtensions: true,
      maxFileSize: 20 * 1024 * 1024, // 20MB per file
      maxTotalFileSize: 50 * 1024 * 1024, // 50MB total
      maxFiles: 10, // Maximum 10 files
    })

    const [fields, files] = await form.parse(req)

    // Extract form data
    const formData = {
      name: Array.isArray(fields.name) ? fields.name[0] : fields.name,
      email: Array.isArray(fields.email) ? fields.email[0] : fields.email,
      phone: Array.isArray(fields.phone) ? fields.phone[0] : fields.phone,
      amount: Array.isArray(fields.amount) ? fields.amount[0] : fields.amount,
      description: Array.isArray(fields.description) ? fields.description[0] : fields.description,
      agreeToContact: Array.isArray(fields.agreeToContact) ? fields.agreeToContact[0] === 'true' : fields.agreeToContact === 'true',
      agreeToTerms: Array.isArray(fields.agreeToTerms) ? fields.agreeToTerms[0] === 'true' : fields.agreeToTerms === 'true',
    }

    // Validate required fields
    if (!formData.name || !formData.email || !formData.amount || !formData.description) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    if (!formData.agreeToTerms) {
      return res.status(400).json({ message: 'You must agree to the terms to submit' })
    }

    // Upload files to Google Drive (if any)
    const uploadedFiles = []
    const receiptFiles = []

    for (const [key, fileArray] of Object.entries(files)) {
      if (key.startsWith('receipt_')) {
        const fileList = Array.isArray(fileArray) ? fileArray : [fileArray]
        
        for (const file of fileList) {
          try {
            const uploadedFile = await uploadToGoogleDrive(file)
            uploadedFiles.push(uploadedFile)
            
            if (uploadedFile.error) {
              receiptFiles.push(`${uploadedFile.name} (Upload failed: ${uploadedFile.error})`)
            } else {
              // Create a clickable hyperlink formula for Google Sheets
              receiptFiles.push(`=HYPERLINK("${uploadedFile.link}","${uploadedFile.name}")`)
            }
            
            // Clean up temporary file
            fs.unlinkSync(file.filepath)
          } catch (error) {
            console.error('Error uploading file:', error)
            receiptFiles.push(`${file.originalFilename} (Upload failed: ${error.message})`)
            
            // Clean up temporary file even on error
            try {
              fs.unlinkSync(file.filepath)
            } catch (cleanupError) {
              console.error('Error cleaning up file:', cleanupError)
            }
          }
        }
      }
    }

    // Add uploaded files info to form data
    formData.receiptFiles = receiptFiles

    // Append data to Google Sheets
    await appendToSheet(formData)

    res.status(200).json({ 
      message: 'Reimbursement request submitted successfully',
      uploadedFiles: uploadedFiles.length
    })

  } catch (error) {
    console.error('Submission error:', error)
    
    // Handle specific formidable errors
    if (error.code === 1009) {
      return res.status(413).json({ 
        message: 'File size too large. Please reduce file sizes and try again.',
        error: 'File size limit exceeded'
      })
    }
    
    if (error.code === 1008) {
      return res.status(413).json({ 
        message: 'Too many files uploaded. Maximum 10 files allowed.',
        error: 'File count limit exceeded'
      })
    }
    
    res.status(500).json({ 
      message: 'Error processing submission',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}
