import { google } from 'googleapis'
import formidable from 'formidable'
import fs from 'fs'

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

// OAuth 2.0 credentials - you'll need to create these in Google Cloud Console
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/oauth-callback'
)

// Set refresh token if available
if (process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  })
}

async function uploadWithOAuth(file) {
  try {
    // Get access token
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const fileMetadata = {
      name: file.originalFilename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    }

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.filepath)
    }

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
    })

    // Make file publicly viewable
    await drive.permissions.create({
      fileId: response.data.id,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    })

    return {
      success: true,
      file: response.data,
      message: 'File uploaded successfully with OAuth'
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      message: 'OAuth upload failed'
    }
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Generate OAuth URL for authorization
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      prompt: 'consent'
    })

    return res.status(200).json({
      message: 'OAuth authorization required',
      authUrl,
      instructions: [
        '1. Visit the authUrl to authorize the application',
        '2. Copy the authorization code from the callback',
        '3. Use POST /api/oauth-upload with the code to get refresh token',
        '4. Add GOOGLE_OAUTH_REFRESH_TOKEN to your .env.local'
      ]
    })
  }

  if (req.method === 'POST') {
    try {
      const form = formidable({
        uploadDir: './tmp',
        keepExtensions: true,
        maxFileSize: 20 * 1024 * 1024,
      })

      const [fields, files] = await form.parse(req)

      // If authorization code is provided, exchange for tokens
      if (fields.code) {
        const code = Array.isArray(fields.code) ? fields.code[0] : fields.code
        
        try {
          const { tokens } = await oauth2Client.getToken(code)
          oauth2Client.setCredentials(tokens)

          return res.status(200).json({
            success: true,
            message: 'OAuth tokens obtained successfully',
            refreshToken: tokens.refresh_token,
            instruction: `Add this to your .env.local: GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`
          })
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: error.message,
            message: 'Failed to exchange authorization code for tokens'
          })
        }
      }

      // If refresh token is not set, return error
      if (!process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
        return res.status(400).json({
          success: false,
          message: 'OAuth not configured. Visit GET /api/oauth-upload to start authorization process.'
        })
      }

      // Upload files using OAuth
      const results = []
      
      for (const [key, fileArray] of Object.entries(files)) {
        if (key.startsWith('receipt_')) {
          const fileList = Array.isArray(fileArray) ? fileArray : [fileArray]
          
          for (const file of fileList) {
            const result = await uploadWithOAuth(file)
            results.push(result)
            
            // Clean up temp file
            fs.unlinkSync(file.filepath)
          }
        }
      }

      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      res.status(200).json({
        success: failed.length === 0,
        results,
        summary: {
          total: results.length,
          successful: successful.length,
          failed: failed.length
        },
        message: failed.length === 0 ? 'All files uploaded successfully' : 'Some files failed to upload'
      })

    } catch (error) {
      console.error('OAuth upload error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to process OAuth upload'
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
