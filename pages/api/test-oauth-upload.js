import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URI
)

// Set refresh token
if (process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  })
}

function createTestFile() {
  const testContent = `OAuth Test File
Generated: ${new Date().toISOString()}
Purpose: Testing OAuth-based Google Drive upload
Project: Gen Sales Reimbursement System`

  const filePath = path.join(process.cwd(), 'tmp', `oauth-test-${Date.now()}.txt`)
  
  const tmpDir = path.dirname(filePath)
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }
  
  fs.writeFileSync(filePath, testContent)
  return filePath
}

async function testOAuthUpload() {
  try {
    // Get fresh access token
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)

    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    const testFilePath = createTestFile()
    
    const fileMetadata = {
      name: `oauth-test-${Date.now()}.txt`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    }

    const media = {
      mimeType: 'text/plain',
      body: fs.createReadStream(testFilePath)
    }

    console.log('Uploading test file with OAuth...')
    
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
      message: 'OAuth file upload successful!'
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      message: 'OAuth file upload failed'
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Testing OAuth file upload...')
    
    if (!process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
      return res.status(400).json({
        success: false,
        message: 'OAuth refresh token not configured in .env.local'
      })
    }

    const result = await testOAuthUpload()

    console.log('OAuth upload test result:', JSON.stringify(result, null, 2))

    res.status(result.success ? 200 : 500).json({
      timestamp: new Date().toISOString(),
      test: 'oauth-file-upload',
      result,
      folderLink: `https://drive.google.com/drive/folders/${process.env.GOOGLE_DRIVE_FOLDER_ID}`,
      environment: {
        hasRefreshToken: !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
        hasClientId: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        folderConfigured: !!process.env.GOOGLE_DRIVE_FOLDER_ID
      }
    })

  } catch (error) {
    console.error('OAuth upload test error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to test OAuth upload'
    })
  }
}
