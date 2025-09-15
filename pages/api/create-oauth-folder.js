import { google } from 'googleapis'

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

async function createOAuthFolder() {
  try {
    // Get fresh access token
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)

    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    
    const folderMetadata = {
      name: 'Reimbursement Receipts (OAuth)',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [] // Root folder
    }

    console.log('Creating OAuth folder...')
    
    const response = await drive.files.create({
      resource: folderMetadata,
      fields: 'id,name,webViewLink',
    })

    // Make folder publicly viewable
    await drive.permissions.create({
      fileId: response.data.id,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    })

    return {
      success: true,
      folder: {
        id: response.data.id,
        name: response.data.name,
        viewLink: response.data.webViewLink
      },
      message: 'OAuth folder created successfully!'
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      message: 'OAuth folder creation failed'
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Creating OAuth folder...')
    
    if (!process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
      return res.status(400).json({
        success: false,
        message: 'OAuth refresh token not configured in .env.local'
      })
    }

    const result = await createOAuthFolder()

    console.log('OAuth folder creation result:', JSON.stringify(result, null, 2))

    if (result.success) {
      res.status(200).json({
        timestamp: new Date().toISOString(),
        result,
        instruction: `Update your .env.local with: GOOGLE_DRIVE_FOLDER_ID=${result.folder.id}`,
        environment: {
          hasRefreshToken: !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
          hasClientId: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
          hasClientSecret: !!process.env.GOOGLE_OAUTH_CLIENT_SECRET
        }
      })
    } else {
      res.status(500).json({
        timestamp: new Date().toISOString(),
        result
      })
    }

  } catch (error) {
    console.error('OAuth folder creation error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create OAuth folder'
    })
  }
}
