import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'

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

function createTestFile() {
  const testContent = `Test Receipt File
Generated: ${new Date().toISOString()}
Purpose: Testing Google Drive upload functionality
Project: Gen Sales Reimbursement System`

  const filePath = path.join(process.cwd(), 'tmp', 'test-receipt.txt')
  
  // Ensure tmp directory exists
  const tmpDir = path.dirname(filePath)
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }
  
  fs.writeFileSync(filePath, testContent)
  return filePath
}

async function uploadTestFile() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })

    // Create test file
    const testFilePath = createTestFile()
    
    const fileMetadata = {
      name: `test-receipt-${Date.now()}.txt`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    }

    const media = {
      mimeType: 'text/plain',
      body: fs.createReadStream(testFilePath)
    }

    // Upload file
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink,size,createdTime',
    })

    // Make file publicly viewable
    await drive.permissions.create({
      fileId: response.data.id,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // Clean up local test file
    fs.unlinkSync(testFilePath)

    return {
      success: true,
      file: {
        id: response.data.id,
        name: response.data.name,
        size: response.data.size,
        createdTime: response.data.createdTime,
        viewLink: response.data.webViewLink,
        directLink: `https://drive.google.com/uc?id=${response.data.id}`
      },
      message: 'Test file uploaded successfully to Google Drive'
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      message: 'Failed to upload test file to Google Drive'
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Testing file upload to Google Drive...')
    
    const result = await uploadTestFile()

    console.log('File upload test result:', JSON.stringify(result, null, 2))

    if (result.success) {
      res.status(200).json({
        timestamp: new Date().toISOString(),
        test: 'file-upload',
        result,
        folderLink: `https://drive.google.com/drive/folders/${process.env.GOOGLE_DRIVE_FOLDER_ID}`
      })
    } else {
      res.status(500).json(result)
    }

  } catch (error) {
    console.error('File upload test error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to test file upload'
    })
  }
}
