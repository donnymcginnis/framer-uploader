import { google } from 'googleapis'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Test OAuth client setup
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    )

    if (!process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
      return res.status(400).json({
        error: 'No refresh token found',
        message: 'GOOGLE_OAUTH_REFRESH_TOKEN environment variable is missing'
      })
    }

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
    })

    // Try to refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken()
    
    // Test Google Drive API access
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    
    // Try to list files in the folder to test permissions
    const response = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents`,
      pageSize: 1,
      fields: 'files(id, name)'
    })

    res.status(200).json({
      message: 'OAuth test successful',
      tokenRefreshed: !!credentials.access_token,
      driveAccess: true,
      folderAccess: true,
      filesInFolder: response.data.files?.length || 0,
      expiryDate: credentials.expiry_date
    })

  } catch (error) {
    console.error('OAuth test error:', error)
    
    let errorMessage = error.message
    let errorCode = error.code
    
    if (error.message?.includes('invalid_grant')) {
      errorMessage = 'Refresh token is invalid or expired. Need to re-authorize.'
      errorCode = 'INVALID_REFRESH_TOKEN'
    }
    
    res.status(500).json({
      error: errorCode || 'OAUTH_ERROR',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
